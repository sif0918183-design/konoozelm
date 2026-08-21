import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      transaction_hash,
      currency = 'USDT',
      network = 'TRON (TRC-20)',
      amount = 0,
      donor_name = '',
      donor_email = '',
      donor_message = ''
    } = body;

    if (!transaction_hash || typeof transaction_hash !== 'string' || !transaction_hash.trim()) {
      return NextResponse.json({ error: 'Transaction Hash is required' }, { status: 400 });
    }

    const cleanTxHash = transaction_hash.trim();
    const parsedAmount = parseFloat(amount) || 0;

    if (!supabase) {
      return NextResponse.json({
        success: true,
        message: 'Donation confirmation received (offline mode).'
      });
    }

    const { data, error } = await supabase
      .from('donations')
      .insert({
        transaction_hash: cleanTxHash,
        currency,
        network,
        amount: parsedAmount,
        donor_name: donor_name.trim() || null,
        donor_email: donor_email.trim() || null,
        donor_message: donor_message.trim() || null,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      console.error('Error recording donation confirmation:', error);
      return NextResponse.json({ error: 'Failed to record donation' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data
    });
  } catch (err) {
    console.error('Donation confirmation API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
