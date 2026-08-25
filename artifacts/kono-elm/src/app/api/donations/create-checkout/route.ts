import { NextResponse } from 'next/server';
import { supabaseAdmin, supabase } from '@/lib/supabase';
import { getSiteUrl } from '@/lib/utils';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { amount, donor_name = '', donor_email = '', donor_message = '' } = body;

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount < 15) {
      return NextResponse.json({ error: 'أقل مبلغ للقرص بالبطاقة هو 15 دولار' }, { status: 400 });
    }

    // Default target wallet on Polygon for USDC
    const walletAddress = process.env.DONATION_USDC_WALLET || '0x988d2684ab66206324e35c032558d6d9bd938fbc';

    // Generate unique reference
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomHex = crypto.randomBytes(4).toString('hex').toUpperCase();
    const paymentReference = `HUDALIB-${dateStr}-${randomHex}`;

    // Callback URL for PayGate webhook notification
    const siteUrl = getSiteUrl();
    const callbackUrl = `${siteUrl}/api/donations/webhook?reference=${paymentReference}`;
    const encodedCallback = encodeURIComponent(callbackUrl);

    // 1. Call PayGate to create wallet control
    const paygateUrl = `https://api.paygate.to/control/wallet.php?address=${walletAddress}&callback=${encodedCallback}`;

    let addressIn = '';
    let ipnToken = '';
    let isOfflineFallback = false;

    try {
      const paygateRes = await fetch(paygateUrl, { method: 'GET', cache: 'no-store' });
      if (paygateRes.ok) {
        const paygateData = await paygateRes.json();
        addressIn = paygateData.address_in || '';
        ipnToken = paygateData.ipn_token || '';
      } else {
        console.error('PayGate wallet API error response:', paygateRes.status);
      }
    } catch (err) {
      console.error('Failed to contact PayGate API:', err);
    }

    if (!addressIn) {
      console.error('PayGate wallet API did not return address_in');
      return NextResponse.json({
        error: 'تعذر الاتصال ببوابة الدفع PayGate حالياً، يرجى المحاولة مرة أخرى أو استخدام التبرع المباشر.'
      }, { status: 502 });
    }

    const client = supabaseAdmin || supabase;
    if (client) {
      const { error: dbError } = await client
        .from('donations')
        .insert({
          payment_reference: paymentReference,
          transaction_hash: addressIn,
          currency: 'USDC',
          network: 'Polygon',
          amount: parsedAmount,
          provider: 'paygate',
          provider_payment_id: ipnToken || null,
          donor_name: donor_name.trim() || null,
          donor_email: donor_email.trim() || null,
          donor_message: donor_message.trim() || null,
          status: 'pending'
        });

      if (dbError) {
        console.error('Database error recording pending donation:', dbError);
      }
    }

    // Build Checkout Redirect URL
    // addressIn from PayGate wallet.php is already URL-encoded; do NOT double-encode it.
    // PayGate pay.php requires an email parameter. If none provided by donor, use default domain donor email.
    const emailToUse = donor_email.trim() || 'donor@hudalibrary.com';
    const checkoutUrl = `https://checkout.paygate.to/pay.php?address=${addressIn}&amount=${parsedAmount}&currency=USD&email=${encodeURIComponent(emailToUse)}`;

    return NextResponse.json({
      success: true,
      reference: paymentReference,
      checkout_url: checkoutUrl,
      address_in: addressIn,
      ipn_token: ipnToken,
      offline_mode: isOfflineFallback
    });
  } catch (err: any) {
    console.error('Error in create-checkout API:', err);
    return NextResponse.json({ error: 'حدث خطأ أثناء معالجة طلب الدفع' }, { status: 500 });
  }
}
