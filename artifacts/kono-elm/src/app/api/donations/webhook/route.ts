import { NextResponse } from 'next/server';
import { supabaseAdmin, supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const reference = searchParams.get('reference');
    const valueCoin = searchParams.get('value_coin');
    const txidIn = searchParams.get('txid_in');
    const txidOut = searchParams.get('txid_out');
    const addressIn = searchParams.get('address_in');
    const coin = searchParams.get('coin') || 'polygon_usdc';

    if (!reference) {
      return NextResponse.json({ error: 'Missing payment reference' }, { status: 400 });
    }

    const client = supabaseAdmin || supabase;
    if (!client) {
      return NextResponse.json({ success: true, message: 'Webhook received (no database)' });
    }

    // 1. Fetch existing donation by payment_reference
    const { data: donation, error: fetchError } = await client
      .from('donations')
      .select('*')
      .eq('payment_reference', reference)
      .single();

    if (fetchError || !donation) {
      console.warn('Webhook received for unknown reference:', reference);
      return NextResponse.json({ error: 'Donation reference not found' }, { status: 404 });
    }

    // 2. Idempotency Check: If already paid or verified, return early success
    if (donation.status === 'paid' || donation.status === 'verified') {
      return NextResponse.json({
        success: true,
        message: 'Webhook already processed (idempotent)',
        reference,
        status: donation.status
      });
    }

    const parsedValue = valueCoin ? parseFloat(valueCoin) : parseFloat(donation.amount);

    // 3. Update donation status to paid
    const { error: updateError } = await client
      .from('donations')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        amount: parsedValue > 0 ? parsedValue : donation.amount,
        txid_in: txidIn || donation.txid_in || null,
        txid_out: txidOut || donation.txid_out || null,
        currency: 'USDC',
        network: 'Polygon'
      })
      .eq('id', donation.id);

    if (updateError) {
      console.error('Webhook error updating donation status:', updateError);
      return NextResponse.json({ error: 'Failed to update donation status' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      reference,
      status: 'paid'
    });
  } catch (err: any) {
    console.error('Error in PayGate webhook handler:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
