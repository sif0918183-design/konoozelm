import { generateCleanSlug } from '../src/lib/slug-utils';

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
    expected: 'فتح-الباري-بشرح-صحيح-البخاري'
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
  const result = generateCleanSlug(tc.title, tc.author);
  const status = result === tc.expected ? '✅' : '❌';
  console.log(`${i+1}. Input: "${tc.title}"`);
  console.log(`   Result: "${result}"`);
  console.log(`   Expected: "${tc.expected}" ${status}`);
  console.log('---');
});
