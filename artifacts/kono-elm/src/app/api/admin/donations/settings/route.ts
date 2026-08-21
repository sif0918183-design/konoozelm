import { NextResponse } from 'next/server';
import { checkAuth } from '@/lib/admin-auth';
import { supabaseAdmin, supabase } from '@/lib/supabase';
import { DEFAULT_DONATION_SETTINGS } from '@/lib/donation-data';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!checkAuth()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const client = supabaseAdmin || supabase;
  if (!client) {
    return NextResponse.json(DEFAULT_DONATION_SETTINGS);
  }

  try {
    const { data, error } = await client
      .from('donation_settings')
      .select('*')
      .eq('id', 1)
      .single();

    if (error || !data) {
      return NextResponse.json(DEFAULT_DONATION_SETTINGS);
    }

    return NextResponse.json(data);
  } catch (err: any) {
    console.error('Error fetching admin donation settings:', err);
    return NextResponse.json(DEFAULT_DONATION_SETTINGS);
  }
}

export async function POST(req: Request) {
  if (!checkAuth()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const client = supabaseAdmin || supabase;
  if (!client) {
    return NextResponse.json({ error: 'Database connection not available' }, { status: 500 });
  }

  try {
    const body = await req.json();

    const payload = {
      id: 1,
      enabled: body.enabled ?? true,
      show_button: body.show_button ?? true,
      wallet_address: body.wallet_address?.trim() || DEFAULT_DONATION_SETTINGS.wallet_address,
      currency: body.currency?.trim() || 'USDT',
      network: body.network?.trim() || 'TRON (TRC-20)',
      qr_code: body.qr_code?.trim() || '',
      title_ar: body.title_ar?.trim() || DEFAULT_DONATION_SETTINGS.title_ar,
      title_en: body.title_en?.trim() || DEFAULT_DONATION_SETTINGS.title_en,
      description_ar: body.description_ar?.trim() || DEFAULT_DONATION_SETTINGS.description_ar,
      description_en: body.description_en?.trim() || DEFAULT_DONATION_SETTINGS.description_en,
      preset_amounts: Array.isArray(body.preset_amounts) ? body.preset_amounts : DEFAULT_DONATION_SETTINGS.preset_amounts,
      explorer_url_template: body.explorer_url_template?.trim() || DEFAULT_DONATION_SETTINGS.explorer_url_template,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await client
      .from('donation_settings')
      .upsert(payload, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.error('Error updating donation settings:', error);
      return NextResponse.json({ error: error.message || 'Failed to update settings' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error('Error in POST /api/admin/donations/settings:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
