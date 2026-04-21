import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Log search to Supabase
export async function logSearch(query: string, resultsCount: number) {
  if (!supabase) {
    console.log('Supabase not configured, skipping log');
    return;
  }

  try {
    const { error } = await supabase
      .from('search_logs')
      .insert({
        query,
        results_count: resultsCount,
        created_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Error logging search:', error);
    }
  } catch (error) {
    console.error('Error logging search:', error);
  }
}