import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { DEFAULT_DONATION_SETTINGS } from '@/lib/donation-data';

export async function GET() {
  try {
    if (!supabase) {
      return NextResponse.json(DEFAULT_DONATION_SETTINGS);
    }

    const { data, error } = await supabase
      .from('donation_settings')
      .select('*')
      .eq('id', 1)
      .single();

    if (error || !data) {
      return NextResponse.json(DEFAULT_DONATION_SETTINGS);
    }

    return NextResponse.json({
      enabled: data.enabled ?? DEFAULT_DONATION_SETTINGS.enabled,
      show_button: data.show_button ?? DEFAULT_DONATION_SETTINGS.show_button,
      wallet_address: data.wallet_address || DEFAULT_DONATION_SETTINGS.wallet_address,
      currency: data.currency || DEFAULT_DONATION_SETTINGS.currency,
      network: data.network || DEFAULT_DONATION_SETTINGS.network,
      qr_code: data.qr_code || '',
      title_ar: data.title_ar || DEFAULT_DONATION_SETTINGS.title_ar,
      title_en: data.title_en || DEFAULT_DONATION_SETTINGS.title_en,
      description_ar: data.description_ar || DEFAULT_DONATION_SETTINGS.description_ar,
      description_en: data.description_en || DEFAULT_DONATION_SETTINGS.description_en,
      preset_amounts: Array.isArray(data.preset_amounts) ? data.preset_amounts : DEFAULT_DONATION_SETTINGS.preset_amounts,
      explorer_url_template: data.explorer_url_template || DEFAULT_DONATION_SETTINGS.explorer_url_template
    });
  } catch (err) {
    console.error('Error fetching donation settings:', err);
    return NextResponse.json(DEFAULT_DONATION_SETTINGS);
  }
}
