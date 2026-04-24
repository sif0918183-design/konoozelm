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
