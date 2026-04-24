const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

export async function filterAndRankBooks(category: string, books: any[]) {
  if (!OPENAI_API_KEY) {
    console.warn('OPENAI_API_KEY is not defined, skipping AI filtering');
    return books;
  }

  // To handle large lists efficiently, we only send the top 250 candidates to AI for ranking
  // This avoids context limit issues while providing a very broad selection.
  const candidates = books.slice(0, 250);

  const prompt = `
أنت خبير في المكتبات الإسلامية والكتب العربية.
لديك قائمة بالكتب التي تم جلبها من Archive.org بناءً على التصنيف: "${category}".

مهمتك هي:
1. مراجعة كل كتاب وتقييم درجة ارتباطه (relevance_score) من 1 إلى 100 بالتصنيف المطلوب وأهميته العلمية.
2. تحسين وتوحيد العناوين لتكون احترافية وبليغة (مثال: "الأم" -> "كتاب الأم للإمام الشافعي").
3. تصحيح أسماء المؤلفين وإزالة أي زيادات غير ضرورية.
4. دمج النسخ المتكررة لنفس الكتاب في نتيجة واحدة بأفضل عنوان.
5. ترتيب القائمة تنازلياً حسب درجة الارتباط.

هام جداً:
- لا تستبعد أي كتاب إلا إذا كان خارج الموضوع تماماً أو تالفاً أو غير مقروء.
- الهدف هو تقديم أطول قائمة ممكنة من الكتب ذات الصلة.
- أريد 100-200 نتيجة مرتبة في الرد النهائي.
- تأكد من أن الرد JSON صالح تماماً.

قائمة الكتب (JSON):
${JSON.stringify(candidates.map(b => ({ id: b.identifier, title: b.title, author: b.author })))}

أريد النتيجة بتنسيق JSON كقائمة (Array) من الأشياء التالية تحت مفتاح "books":
{
  "id": "معرف الكتاب الأصلي",
  "title": "العنوان المحسن",
  "author": "المؤلف المحسن",
  "relevance_score": 1-100
}
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
    // Fallback: return first 200 items with default scores
    return candidates.slice(0, 200).map(b => ({
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
