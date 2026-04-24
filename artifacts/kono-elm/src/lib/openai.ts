const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

export async function filterAndRankBooks(category: string, books: any[]) {
  if (!OPENAI_API_KEY) {
    console.warn('OPENAI_API_KEY is not defined, skipping AI filtering');
    return books;
  }

  const prompt = `
أنت خبير في المكتبات الإسلامية والكتب العربية.
لديك قائمة بالكتب التي تم جلبها من Archive.org بناءً على التصنيف: "${category}".
مهمتك هي:
1. استبعاد الكتب غير الإسلامية أو غير المرتبطة بهذا التصنيف تماماً.
2. استبعاد الكتب التي يبدو أنها تالفة أو غير مكتملة من العنوان.
3. ترتيب الكتب حسب أهميتها وشهرتها في هذا العلم.
4. توحيد وتحسين عناوين الكتب لتكون واضحة (مثال: "الأم" -> "كتاب الأم للإمام الشافعي").
5. كشف التكرار حتى لو اختلفت العناوين قليلاً.

قائمة الكتب (JSON):
${JSON.stringify(books.map(b => ({ id: b.identifier, title: b.title, author: b.author })))}

أريد النتيجة بتنسيق JSON كقائمة من الأشياء التالية:
{
  "id": "معرف الكتاب الأصلي",
  "title": "العنوان المحسن",
  "author": "المؤلف المحسن",
  "relevance_score": 1-100 (مدى الارتباط بالتصنيف)
}
فقط أعد JSON صالح.
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
    return result.books || result; // Handle both { books: [...] } or just [...]
  } catch (error) {
    console.error('Error in AI filtering:', error);
    return books;
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
