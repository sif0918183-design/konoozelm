
function slugify(text) {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .replace(/[^\u0600-\u06FFa-z0-9\s-]/g, '')
    .replace(/[\u064B-\u065F]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/[ة]/g, 'ه')
    .replace(/[ى]/g, 'ي')
    .replace(/[ؤ]/g, 'و')
    .replace(/[ئ]/g, 'ي')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function generateCleanSlug(title, author, archiveId) {
  if (!title) return archiveId || 'book';

  let cleaned = title
    .replace(/\(.*?\)/g, ' ')
    .replace(/\[.*?\]/g, ' ')
    .replace(/--.*$/, '')
    .replace(/_[0-9]{4,}/g, ' ')
    .trim();

  let slug = slugify(cleaned);

  const prefixes = [
    'book-', 'kitab-', 'archive-', 'pdf-', 'full-book-',
    'تحميل-كتاب-', 'تحميل-', 'كتاب-', 'قراءة-كتاب-', 'قراءة-'
  ];

  let changed = true;
  while (changed) {
    changed = false;
    for (const prefix of prefixes) {
      const p = slugify(prefix);
      if (slug.startsWith(p)) {
        slug = slug.substring(p.length).replace(/^-+/, '');
        changed = true;
      }
    }
  }

  const junkPatterns = [
    'ozkorallh', 'archive', 'ymail', 'gmail', 'hotmail', 'yahoo', 'y-mail',
    'bwb', 'agv', 'alexandrina', 'google', 'internet', 'library', 'download',
    'copy', 'scan', 'version', 'edition', 'high-quality', 'full-text', 'team',
    'uploaded', 'collection'
  ];

  let parts = slug.split('-');
  parts = parts.filter(part => {
    if (/^[0-9]{4,}$/.test(part)) return false;
    if (junkPatterns.includes(part.toLowerCase())) return false;
    return true;
  });

  slug = parts.join('-');

  const words = slug.split('-');
  const uniqueWords = [];
  for (const word of words) {
    if (!uniqueWords.includes(word)) {
      uniqueWords.push(word);
    }
  }
  slug = uniqueWords.join('-');

  if ((!slug || slug.length < 4) && author && !['غير معروف', 'unknown'].includes(author.toLowerCase())) {
    const authorSlug = slugify(author);
    if (authorSlug) {
      slug = slug ? `${slug}-${authorSlug}` : authorSlug;
    }
  }

  const MAX_LENGTH = 80;
  if (slug.length > MAX_LENGTH) {
    const truncated = slug.substring(0, MAX_LENGTH);
    const lastHyphen = truncated.lastIndexOf('-');
    slug = lastHyphen > 30 ? truncated.substring(0, lastHyphen) : truncated;
  }

  slug = slug.replace(/-+/g, '-').replace(/^-+|-+$/g, '');

  if (!slug || slug.length < 3) {
    return archiveId ? slugify(archiveId) : 'book';
  }

  return slug;
}

const testCases = [
  {
    title: 'riyad-us-saliheen--RiyadUsSaliheen_201801',
    author: 'Imam al-Nawawi',
    expected: 'riyad-us-saliheen'
  },
  {
    title: 'التجويد-الميسر--ala_z_ymail_20160504',
    author: 'غير معروف',
    expected: 'التجويد-الميسر'
  },
  {
    title: 'tafsir-ul-quran--bwb_P9-AGV-873_4',
    author: 'Unknown',
    expected: 'tafsir-ul-quran'
  },
  {
    title: 'book-العبادات-شرعيها-وبدعيها-0184701',
    author: 'Author Name',
    expected: 'العبادات-شرعيها-وبدعيها'
  },
  {
    title: 'عمده-القاري-شرح-صحيح-البخاري-18--18_20200913_20200913_2122',
    author: 'البدر العيني',
    expected: 'عمده-القاري-شرح-صحيح-البخاري-18'
  },
  {
    title: '140918فتحالباريبشرحصحيحالبخاري--AAlexandrina-140918',
    author: 'ابن حجر العسقلاني',
    expected: '140918فتحالباريبشرحصحيحالبخاري'
  },
  {
    title: 'kitab-al-tawhid-archive-copy-2022',
    author: 'Muhammad ibn Abd al-Wahhab',
    expected: 'al-tawhid'
  },
  {
    title: 'pdf-تحميل-كتاب-صحيح-مسلم-كامل',
    author: 'الإمام مسلم',
    expected: 'صحيح-مسلم-كامل'
  }
];

console.log('--- Testing Slug Normalization ---');
testCases.forEach((tc, i) => {
  const result = generateCleanSlug(tc.title, tc.author, '12345');
  const status = result === tc.expected ? '✅' : '❌';
  console.log(`${i+1}. Input: "${tc.title}"`);
  console.log(`   Result: "${result}"`);
  console.log(`   Expected: "${tc.expected}" ${status}`);
  console.log('---');
});
