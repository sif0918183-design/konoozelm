const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export async function generateBookDescription(title: string, author: string) {
  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not defined');
  }

  const prompt = `
أنت خبير SEO ومكتبات إسلامية. قم بكتابة وصف جذاب ومحسّن لمحركات البحث (SEO) لكتاب بعنوان "${title}" للمؤلف "${author}".
يجب أن يتضمن الوصف:
1. مقدمة عن أهمية الكتاب وقيمته العلمية.
2. نبذة مختصرة عن المحتوى.
3. كلمات مفتاحية طبيعية ضمن النص (مثل: تحميل PDF، قراءة أونلاين، كتب فقه، كتب حديث، إلخ حسب موضوع الكتاب).
4. طول النص بين 150 إلى 300 كلمة.
5. اجعل الأسلوب بليغاً ومناسباً للمحتوى الإسلامي.
6. لا تذكر أنك ذكاء اصطناعي، ابدأ الوصف مباشرة.
7. اقترح أيضاً عنواناً محسناً (SEO Title) يتضمن "تحميل وقراءة PDF".

أريد النتيجة بتنسيق JSON كالتالي:
{
  "seoTitle": "عنوان الكتاب هنا",
  "description": "الوصف هنا"
}
`;

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Groq API error: ${errorData.error?.message || response.statusText}`);
  }

  const data = await response.json();
  const content = JSON.parse(data.choices[0].message.content);
  return content as { seoTitle: string; description: string };
}

export async function cleanExcerptWithAI(text: string, lang: string = 'ar') {
  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not defined');
  }

  if (!text || text.trim().length < 10) return text;

  const isArabic = lang === 'ar';
  const prompt = isArabic ? `
أنت خبير في معالجة النصوص التاريخية والإسلامية. وصلك نص مستخرج عبر OCR من كتاب قديم، والنص يحتوي على أخطاء كثيرة (حروف مقطعة، رموز غريبة، كلمات مشوهة).

مهمتك هي:
1. إعادة كتابة النص بشكل صحيح ومفهوم.
2. إصلاح الكلمات المشوهة بناءً على السياق (مثلاً "ا لسلام" تصبح "السلام").
3. إزالة أي رموز غير نصية أو عشوائية ناتجة عن المسح الضوئي.
4. الحفاظ على المعنى الأصلي للنص تماماً دون إضافة رأي شخصي أو تغيير المحتوى العلمي.
5. إذا كان النص غير قابل للإصلاح تماماً، قم بتنقيته قدر الإمكان.

النص المراد معالجته:
"${text}"

أريد النتيجة بتنسيق JSON كالتالي:
{
  "cleanedText": "النص النظيف هنا"
}
` : `
You are an expert in text processing and digital libraries. You have been provided with a text extracted via OCR from an old book. The text contains many errors (fragmented letters, strange symbols, distorted words).

Your task is:
1. Rewrite the text correctly and clearly.
2. Fix distorted words based on the context.
3. Remove any non-textual or random symbols caused by the scanning process.
4. Maintain the exact original meaning without adding personal opinions or changing the scientific content.
5. If the text is completely irreparable, clean it up as much as possible.

Text to process:
"${text}"

I want the result strictly in JSON format:
{
  "cleanedText": "Cleaned text here"
}
`;

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = JSON.parse(data.choices[0].message.content);
    return content.cleanedText as string;
  } catch (error) {
    console.error('Error cleaning excerpt with Groq:', error);
    return text; // Return original if AI fails
  }
}
