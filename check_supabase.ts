import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkData() {
  console.log('Checking Categories...');
  const { data: categories, error: catError } = await supabase
    .from('seo_categories')
    .select('title, slug')
    .limit(5);

  if (catError) console.error('Error fetching categories:', catError);
  else console.log('Categories:', categories);

  console.log('\nChecking Books...');
  const { data: books, error: bookError } = await supabase
    .from('seo_books')
    .select('title, category, category_slug')
    .limit(10);

  if (bookError) console.error('Error fetching books:', bookError);
  else console.log('Books:', books);
}

checkData();
