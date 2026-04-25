const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

export async function filterAndRankBooks(category: string, books: any[]) {
  // As per user request, we are removing OpenAI filtering to prevent losing important results.
  // We will return the results from Archive.org directly, but we'll still provide a default score.
  return books.map(b => ({
    id: b.identifier,
    title: b.title,
    author: b.author || 'غير معروف',
    relevance_score: 100 // Default high score as we are not filtering
  }));
}

export async function generateBookDescription(title: string, author: string) {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not defined');
  }

  const prompt = `
أنت خبير SEO ومكتبات إسلامية محترف. قم بكتابة وصف جذاب، طبيعي، وشامل لمحركات البحث (SEO) لكتاب بعنوان "${title}" للمؤلف "${author}".

المتطلبات:
1. الأسلوب: يجب أن يكون الأسلوب طبيعياً جداً ويشبه كتابة البشر (مهم جداً لقبول Google)، بليغاً ومناسباً للمحتوى الإسلامي.
2. المحتوى:
   - مقدمة عن أهمية الكتاب وقيمته العلمية في التراث الإسلامي.
   - نبذة مختصرة ومركزة عن موضوع الكتاب وأهم الأبواب التي يتناولها.
   - كلمات مفتاحية مدمجة بصورة طبيعية تماماً (مثل: تحميل PDF، قراءة أونلاين، كتب إسلامية، إلخ).
3. الطول: بين 200 إلى 400 كلمة لضمان تفوقه في نتائج البحث.
4. عدم ذكر الذكاء الاصطناعي: ابدأ الوصف مباشرة ولا تذكر أنك مساعد ذكي.
5. العنوان المحسن: اقترح عنوان SEO جذاب يتضمن "تحميل وقراءة PDF" ويوحي بالموثوقية.

أريد النتيجة بتنسيق JSON حصراً:
{
  "seoTitle": "عنوان SEO هنا",
  "description": "الوصف الكامل هنا"
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
        model: 'gpt-4o', // Using GPT-4o for higher quality "human-like" writing
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);
    return result as { seoTitle: string; description: string };
  } catch (error) {
    console.error('Error generating book description with OpenAI:', error);
    throw error;
  }
}

export async function generateCategoryDescription(categoryTitle: string) {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not defined');
  }

  const prompt = `
أنت خبير SEO متخصص في المواقع الإسلامية. قم بكتابة وصف تعريفي (Meta Description/Category Description) لقسم في مكتبة إلكترونية يسمى "${categoryTitle}".

المتطلبات:
1. اكتب وصفاً طبيعياً وجذاباً يشجع القراء والباحثين على تصفح القسم.
2. وضح أهمية هذا الفن من فنون العلم (مثلاً الفقه، الحديث، التفسير) وأهم الكتب التي قد يجدها القارئ هنا.
3. ادمج كلمات بحثية طبيعية (مثل: تحميل كتب، مكتبة PDF، أمهات الكتب في ${categoryTitle}).
4. الطول: حوالي 150-250 كلمة.
5. اجعل الأسلوب بشرياً بليغاً بعيداً عن الركاكة الآلية.

أريد النتيجة بتنسيق JSON حصراً:
{
  "description": "الوصف هنا"
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
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);
    return result.description as string;
  } catch (error) {
    console.error('Error generating category description with OpenAI:', error);
    throw error;
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
