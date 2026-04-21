import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Log search to Supabase
export async function logSearch(
  query: string, 
  resultsCount: number, 
  searchDurationMs?: number
) {
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
        search_duration_ms: searchDurationMs,
        user_agent: typeof window !== 'undefined' ? navigator.userAgent : null,
        created_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Error logging search:', error);
    }
  } catch (error) {
    console.error('Error logging search:', error);
  }
}

// Get search statistics from Supabase
export async function getSearchStats(days: number = 7) {
  if (!supabase) {
    console.log('Supabase not configured');
    return null;
  }

  try {
    const { data, error } = await supabase
      .rpc('get_search_stats', { days });

    if (error) {
      console.error('Error getting search stats:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error getting search stats:', error);
    return null;
  }
}