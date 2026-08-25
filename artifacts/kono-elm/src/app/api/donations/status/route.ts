import { NextResponse } from 'next/server';
import { supabaseAdmin, supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const reference = searchParams.get('reference');

    if (!reference) {
      return NextResponse.json({ error: 'Missing reference' }, { status: 400 });
    }

    const client = supabaseAdmin || supabase;
    if (!client) {
      return NextResponse.json({
        reference,
        status: 'pending',
        amount: 0
      });
    }

    const { data: donation, error } = await client
      .from('donations')
      .select('*')
      .eq('payment_reference', reference)
      .single();

    if (error || !donation) {
      return NextResponse.json({ error: 'Donation not found' }, { status: 404 });
    }

    // Optional PayGate Status Check if still pending and ipn_token exists
    if (donation.status === 'pending' && donation.provider_payment_id) {
      try {
        const checkRes = await fetch(
          `https://api.paygate.to/control/payment-status.php?ipn_token=${encodeURIComponent(donation.provider_payment_id)}`,
          { cache: 'no-store' }
        );
        if (checkRes.ok) {
          const paygateStatus = await checkRes.json();
          if (paygateStatus.status === 'paid') {
            const parsedVal = paygateStatus.value_coin ? parseFloat(paygateStatus.value_coin) : donation.amount;
            await client
              .from('donations')
              .update({
                status: 'paid',
                paid_at: new Date().toISOString(),
                amount: parsedVal,
                txid_out: paygateStatus.txid_out || donation.txid_out
              })
              .eq('id', donation.id);

            donation.status = 'paid';
            donation.amount = parsedVal;
          }
        }
      } catch (err) {
        console.error('Error verifying PayGate payment status online:', err);
      }
    }

    return NextResponse.json({
      reference: donation.payment_reference,
      status: donation.status,
      amount: donation.amount,
      currency: donation.currency,
      created_at: donation.created_at,
      paid_at: donation.paid_at
    });
  } catch (err: any) {
    console.error('Error checking donation status:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
