const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

export async function filterAndRankBooks(category: string, books: any[]) {
  if (!OPENAI_API_KEY) {
    console.warn('OPENAI_API_KEY is not defined, skipping AI filtering');
    return books;
  }

  // To handle up to 200-300 books, we need to be careful with prompt size.
  // We'll process them in chunks if necessary, but GPT-4o-mini has a large context.
  // We'll aim for efficiency by providing only essential data.

  const prompt = `
أنت خبير في المكتبات الإسلامية والكتب العربية.
لديك قائمة بالكتب التي تم جلبها من Archive.org بناءً على التصنيف: "${category}".

مهمتك هي:
1. تقييم كل كتاب وإعطاؤه درجة ارتباط (relevance_score) من 1 إلى 100 بناءً على مدى انتمائه لهذا التصنيف وأهميته العلمية.
2. توحيد وتحسين عناوين الكتب (مثال: "الأم" -> "كتاب الأم للإمام الشافعي").
3. تصحيح أسماء المؤلفين.
4. كشف التكرار ودمج النتائج المتكررة.
5. ترتيب القائمة النهائية تنازلياً حسب درجة الارتباط.

هام: لا تستبعد الكتب إلا إذا كانت تالفة تماماً. أريد أكبر عدد ممكن من النتائج المرتبة.

قائمة الكتب (JSON):
${JSON.stringify(books.map(b => ({ id: b.identifier, title: b.title, author: b.author })))}

أريد النتيجة بتنسيق JSON كقائمة (Array) من الأشياء التالية تحت مفتاح "books":
{
  "id": "معرف الكتاب الأصلي",
  "title": "العنوان المحسن",
  "author": "المؤلف المحسن",
  "relevance_score": 1-100
}
فقط أعد JSON صالح. لا تضع قيوداً على عدد النتائج في الرد، أعد كل ما هو مفيد.
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
    return result.books || result;
  } catch (error) {
    console.error('Error in AI filtering:', error);
    // Return original books with a default score if AI fails
    return books.map(b => ({
        id: b.identifier,
        title: b.title,
        author: b.author,
        relevance_score: 50
    }));
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
