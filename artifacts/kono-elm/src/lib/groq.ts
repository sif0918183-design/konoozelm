import { cleanBookTitle } from './openai';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

let globalStyleCounter = 0;

export interface BookMetadataPayload {
  title: string;
  author?: string;
  category?: string;
  editor?: string;
  description?: string;
  lang?: 'ar' | 'en';
}

/**
 * Constructs dynamic prompt for Groq with 4 rotated structural perspectives and comprehensive metadata.
 */
export function buildGroqDynamicPrompt(payload: BookMetadataPayload) {
  const lang = payload.lang || 'ar';
  const isEnglish = lang === 'en';
  const validAuthor = payload.author && payload.author !== 'Unknown' && payload.author !== 'غير معروف' && payload.author !== 'null' ? payload.author : null;
  const categoryContext = payload.category && payload.category !== 'عام' && payload.category !== 'General' ? payload.category : null;
  const validEditor = payload.editor && payload.editor !== 'Unknown' && payload.editor !== 'غير معروف' ? payload.editor : null;
  const existingDesc = payload.description ? payload.description.trim() : null;

  const titleHash = payload.title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const styleIndex = (globalStyleCounter + titleHash) % 4;
  globalStyleCounter = (globalStyleCounter + 1) % 4;

  if (isEnglish) {
    const englishStyles = [
      `STYLE PERSPECTIVE 1: Analytical & Direct Subject Focus.
Begin directly with the primary subject matter and analytical core of the work.`,
      `STYLE PERSPECTIVE 2: Scope & Structural Overview.
Open with the main thematic sections and content breakdown of the text.`,
      `STYLE PERSPECTIVE 3: Conceptual & Methodological Perspective.
Start with the discipline's central concepts and how the text addresses them.`,
      `STYLE PERSPECTIVE 4: Contextual & Functional Overview.
Provide a direct synthesis of what the work covers and its specific subject focus.`
    ];

    return `
You are a professional scholarly editor for an English digital library catalog.
Generate an authentic, natural, and highly informative SEO description for:
Book Title: "${payload.title}"
${validAuthor ? `Author: "${validAuthor}"` : ''}
${validEditor ? `Editor/Translator/Muhaqqiq: "${validEditor}"` : ''}
${categoryContext ? `Category/Field: "${categoryContext}"` : ''}
${existingDesc ? `Existing Metadata/Notes: "${existingDesc.substring(0, 300)}"` : ''}

${englishStyles[styleIndex]}

GUIDELINES & PRINCIPLES (INFORMATION FIRST, SEO SECOND):
1. NATIVE ENGLISH PROSE: Write naturally as an English scholarly editor. Avoid translationese, rigid formulas, or marketing tone.
2. VERIFIED BACKGROUND FACTS: Use the provided title, author, category, and metadata context to synthesize the book's core subject, methodology, author's background/era, and contents. Do NOT invent unconfirmed facts or false publication dates.
3. WORD COUNT: Target 150-220 words when information is adequate. If available metadata is limited, write a concise, accurate summary without adding fluff.
4. BANNED CLICHÉS: DO NOT use repetitive sales phrases such as "This valuable work...", "This important reference...", "Perfect for scholars and students...", "It provides readers with...", "This indispensable masterpiece...", or "Written by...".
5. SEMANTIC SEO & PDF MENTIONS: Incorporate relevant discipline terminology naturally for strong semantic SEO. Do NOT stuff keywords. Mention "PDF download" or "read online" AT MOST ONCE naturally.
6. UNKNOWN AUTHOR HANDLING: ${validAuthor ? `Include author "${validAuthor}" naturally.` : `Do NOT mention that the author is unknown or missing. Focus entirely on the text content.`}
7. SEO TITLE: Suggest a clean, authoritative SEO title suitable for a library catalog entry.

Format response strictly as JSON:
{
  "seoTitle": "SEO Title here",
  "description": "Full description here"
}
`;
  } else {
    const arabicStyles = [
      `أسلوب العرض الأول: التحليلي المباشر.
ابدأ الجملة الأولى فوراً بتناول القضايا والمسائل العلمية التي يعالجها الكتاب.`,
      `أسلوب العرض الثاني: التناول المحوري والأبواب.
ركز على الأبواب والمحاور العلمية الأساسية للمتن دون مقدمات تسويقية.`,
      `أسلوب العرض الثالث: المنظور المنهجي والمعرفي.
سلط الضوء على المنهجية والأصول العلمية الواردة في النص بأسلوب علمي رصين.`,
      `أسلوب العرض الرابع: التناول السياقي والمكثف.
قدم عرضاً جامعاً ومكثفاً لموضوع السفر وفائدته العلمية دون حشو.`
    ];

    return `
أنت محرر كتب متخصص في مكتبة إسلامية ومعرفية. قم بكتابة وصف طبيعي، فريد، بليغ، وغني بالمعلومات لكتاب:
عنوان الكتاب: "${payload.title}"
${validAuthor ? `المؤلف: "${validAuthor}"` : ''}
${validEditor ? `المحقق/المترجم: "${validEditor}"` : ''}
${categoryContext ? `التصنيف/المجال: "${categoryContext}"` : ''}
${existingDesc ? `بيانات/ملاحظات سابقة: "${existingDesc.substring(0, 300)}"` : ''}

${arabicStyles[styleIndex]}

قواعد وضوابط كتابة الوصف (المعلومات أولاً، SEO ثانياً، والتسويق في الحد الأدنى):
1. أسلوب عربي أصيل: اكتب بلغة عربية فصيحة وسليمة وبناء تعبيري متنوع ومستقل، بعيداً عن القوالب الجاهزة أو الصياغات الآلية.
2. إثراء المعلومات المؤكدة: استند إلى بيانات الكتاب وتصنيفه ومؤلفه لتقديم صياغة متخصصة تحرر موضوع الكتاب ومحتواه وعصره ومنهجه العلمي دون اختراع تفاصيل غير مؤكدة.
3. الطول والعمق: استهدف 150-220 كلمة عندما تكون معلومات الكتاب كافية. إذا كانت المعلومات المتاحة محدودة، اكتب وصفاً أقصر لكنه مفيد ودقيق ودون حشو أو تكرار.
4. منع العبارات المستهلكة: يمنع استخدام عبارات تسويقية عامة مثل ("يُعتبر مرجعًا أساسيًا"، "مورداً قيمًا"، "كنز علمي"، "المصدر المثالي للجميع"، "لا غنى عنه للباحثين والطلاب"، "يعد من أهم/أبرز...", "يقدم الباحث رؤية عميقة").
5. SEO الدلالي والتنزيل: استخدم المصطلحات العلمية المرتبطة بموضوع الكتاب بأسلوب طبيعي لتحقيق Semantic SEO دون Keyword Stuffing. لا تجعل "تحميل PDF" و"قراءة أونلاين" محور الوصف، ويمكن ذكرهما مرة واحدة فقط بشكل طبيعي ضمن السياق.
6. اسم المؤلف: ${validAuthor ? `أدرج اسم المؤلف "${validAuthor}" بأسلوب سلس.` : `إذا كان اسم المؤلف غير معروف أو مفقوداً، فلا تذكر مطلقاً أنه غير معروف، بل ركز الوصف بالكامل على الموضوع والمتن.`}
7. عنوان SEO: اقترح عنوان SEO جذّاباً ومتنوّعاً يعبر عن الكتاب بأسلوب بشري موثوق.

أريد النتيجة بتنسيق JSON حصراً:
{
  "seoTitle": "عنوان SEO هنا",
  "description": "الوصف الكامل هنا"
}
`;
  }
}

/**
 * Generates SEO description for a book using Groq (llama-3.3-70b-versatile) with dynamic 4-style rotation and enriched metadata.
 */
export async function generateBookDescription(
  title: string,
  author: string,
  lang: 'ar' | 'en' = 'ar',
  category?: string,
  editor?: string,
  existingDescription?: string
) {
  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not defined');
  }

  const cleanedTitle = cleanBookTitle(title);

  const prompt = buildGroqDynamicPrompt({
    title: cleanedTitle,
    author,
    category,
    editor,
    description: existingDescription,
    lang
  });

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
