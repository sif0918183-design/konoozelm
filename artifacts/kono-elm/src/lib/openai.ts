const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

export async function filterAndRankBooks(category: string, books: any[]) {
  if (!OPENAI_API_KEY) {
    console.warn('OPENAI_API_KEY is not defined, skipping AI filtering');
    return books;
  }

  // To avoid hitting token limits with too many books, we can process them in one go if it's within reason.
  // 150 books * ~100 chars per book is ~15k chars, which fits in GPT-4o-mini's context.

  const prompt = `
أنت خبير في المكتبات الإسلامية والكتب العربية.
لديك قائمة بالكتب التي تم جلبها من Archive.org بناءً على التصنيف: "${category}".

مهمتك هي:
1. تقييم كل كتاب وإعطاؤه درجة ارتباط (relevance_score) من 1 إلى 100 بناءً على مدى انتمائه لهذا التصنيف تحديداً وأهميته العلمية.
2. توحيد وتحسين عناوين الكتب لتكون واضحة واحترافية (مثال: "الأم" -> "كتاب الأم للإمام الشافعي").
3. تصحيح أسماء المؤلفين إذا كانت تحتوي على أخطاء أو زيادات.
4. كشف التكرار حتى لو اختلفت العناوين قليلاً، ودمج النتائج المتكررة.
5. ترتيب القائمة النهائية تنازلياً حسب درجة الارتباط.

هام: لا تستبعد الكتب إلا إذا كانت تالفة تماماً أو غير مقروءة، الهدف هو عرض أكبر قدر ممكن من النتائج ذات الصلة.

قائمة الكتب (JSON):
${JSON.stringify(books.map(b => ({ id: b.identifier, title: b.title, author: b.author })))}

أريد النتيجة بتنسيق JSON كقائمة (Array) من الأشياء التالية تحت مفتاح "books":
{
  "id": "معرف الكتاب الأصلي",
  "title": "العنوان المحسن",
  "author": "المؤلف المحسن",
  "relevance_score": 1-100
}
فقط أعد JSON صالح. أريد أكبر عدد ممكن من النتائج (حتى 50 نتيجة إذا توفرت).
`;

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);
    const sortedBooks = result.books || result;

    // Return up to 50 results
    return Array.isArray(sortedBooks) ? sortedBooks.slice(0, 50) : [];
  } catch (error) {
    console.error('Error in AI filtering:', error);
    return books.slice(0, 50);
  }
}

export async function normalizeTitle(title: string, author?: string) {
  if (!OPENAI_API_KEY) return title;

  const prompt = `
قم بتوحيد وتحسين عنوان الكتاب التالي ليكون مناسباً لـ SEO ومكتبة احترافية.
العنوان الأصلي: "${title}"
المؤلف: "${author || 'غير معروف'}"

المطلوب:
1. إزالة أي زيادات غير ضرورية (مثل: "pdf", "تحميل", "نسخة واضحة").
2. إضافة "كتاب" في البداية إذا كان مناسباً.
3. كتابة العنوان كاملاً وصحيحاً.
4. أعد النتيجة كـ JSON: {"normalizedTitle": "..."}
`;

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      }),
    });

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);
    return result.normalizedTitle;
  } catch (error) {
    return title;
  }
}
