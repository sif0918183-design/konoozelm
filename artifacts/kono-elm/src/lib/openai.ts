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

export async function generateBookDescription(title: string, author: string, lang: string = 'ar') {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not defined');
  }

  const isEnglish = lang === 'en';

  const prompt = isEnglish ? `
You are a professional SEO and library expert. Write a compelling, natural, and comprehensive SEO description for a book titled "${title}" by author "${author}".

Requirements:
1. Style: The style must be very natural and human-like (critical for Google indexing), eloquent and suitable for scholarly content.
2. Content:
   - An introduction about the book's importance and value.
   - A brief and focused overview of the book's topic and main sections.
   - Naturally integrated keywords (e.g., Download PDF, Read Online, Islamic books, etc.).
3. Length: Between 200 to 400 words to ensure SEO performance.
4. No AI mention: Start the description directly and do not mention being an AI assistant.
5. Enhanced Title: Suggest a catchy SEO title that includes "Download & Read PDF" and sounds authoritative.

I want the result strictly in JSON format:
{
  "seoTitle": "SEO Title here",
  "description": "Full description here"
}
` : `
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

export async function generateCategoryDescription(categoryTitle: string, lang: string = 'ar') {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not defined');
  }

  const isEnglish = lang === 'en';

  const prompt = isEnglish ? `
You are an SEO expert specialized in digital libraries. Write a compelling category description (Meta Description/Category Description) for a library section named "${categoryTitle}".

Requirements:
1. Write a natural and engaging description that encourages readers and researchers to browse the section.
2. Explain the importance of this field of knowledge and the key books a reader might find here.
3. Integrate natural keywords (e.g., Download books, PDF library, major works in ${categoryTitle}).
4. Length: About 150-250 words.
5. Ensure the style is human-like and eloquent.

I want the result strictly in JSON format:
{
  "description": "Description here"
}
` : `
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

export async function normalizeTitle(title: string, author?: string, lang: string = 'ar') {
  if (!OPENAI_API_KEY) return title;

  const isEnglish = lang === 'en';

  const prompt = isEnglish ? `
Standardize and improve the following book title to be suitable for SEO and a professional library.
Original Title: "${title}"
Author: "${author || 'Unknown'}"

Requirements:
1. Remove any unnecessary additions (e.g., "pdf", "download", "clear copy").
2. Add "Book" at the beginning if appropriate.
3. Write the title completely and correctly.
4. Return the result as JSON: {"normalizedTitle": "..."}
` : `
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
