const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export async function generateBookDescription(title: string, author: string, lang: 'ar' | 'en' = 'ar') {
  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not defined');
  }

  const arabicPrompt = `
أنت خبير SEO ومكتبات إسلامية. قم بكتابة وصف جذاب ومحسّن لمحركات البحث (SEO) لكتاب بعنوان "${title}"${author && author !== 'Unknown' && author !== 'غير معروف' ? ` للمؤلف "${author}"` : ''}.
يجب أن يتضمن الوصف:
1. مقدمة عن أهمية الكتاب وقيمته العلمية.
2. نبذة مختصرة عن المحتوى.
3. كلمات مفتاحية طبيعية ضمن النص (مثل: تحميل PDF، قراءة أونلاين، كتب فقه، كتب حديث، إلخ حسب موضوع الكتاب).
4. ملاحظة هامة: إذا كان اسم المؤلف غير متوفر أو "غير معروف"، فلا تذكر أبداً أن المؤلف غير معروف، بل ركز الوصف بالكامل على متن الكتاب وقيمته العلمية.
5. طول النص بين 150 إلى 300 كلمة.
6. اجعل الأسلوب بليغاً ومناسباً للمحتوى الإسلامي.
7. لا تذكر أنك ذكاء اصطناعي، ابدأ الوصف مباشرة.
8. اقترح أيضاً عنواناً محسناً (SEO Title) يتضمن "تحميل وقراءة PDF".

أريد النتيجة بتنسيق JSON كالتالي:
{
  "seoTitle": "عنوان الكتاب هنا",
  "description": "الوصف هنا"
}
`;

  const englishPrompt = `
You are an SEO and Islamic Library expert. Write an engaging and SEO-optimized description for a book titled "${title}"${author && author !== 'Unknown' && author !== 'غير معروف' ? ` by author "${author}"` : ''}.
The description must include:
1. An introduction about the importance and scientific value of the book.
2. A brief summary of the content.
3. Natural keywords within the text (e.g., Download PDF, Read Online, Fiqh books, Hadith books, etc., depending on the book's subject).
4. IMPORTANT NOTE: If the author's name is not available or is "Unknown" or "غير معروف", DO NOT mention that the author is unknown. Instead, focus the entire description on the book's content and its scientific value.
5. Text length between 150 to 300 words.
6. Make the style eloquent and suitable for Islamic content.
7. Do not mention that you are an AI; start the description directly.
8. Also suggest an optimized SEO Title that includes "Download & Read PDF".

I want the result in JSON format as follows:
{
  "seoTitle": "Book Title Here",
  "description": "Description here"
}
`;

  const prompt = lang === 'en' ? englishPrompt : arabicPrompt;

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
