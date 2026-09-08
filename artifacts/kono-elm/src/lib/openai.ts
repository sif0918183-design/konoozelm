const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// Constants for Hybrid OpenAI system
const SEO_MODEL = "gpt-4.1-mini";
const FILTER_MODEL = "gpt-4.1-nano";

/**
 * Generic helper to call OpenAI API with specific model and logging
 */
async function callOpenAI(model: string, messages: any[], responseFormat: any, logTag: string) {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not defined');
  }

  console.log(`${logTag} Using ${model}`);

  try {
    const body: any = {
      model,
      messages,
    };

    if (responseFormat) {
      body.response_format = responseFormat;
    }

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content.trim();

    if (responseFormat?.type === 'json_object') {
      return JSON.parse(content);
    }
    return content;
  } catch (error) {
    console.error(`${logTag} Error with ${model}:`, error);
    throw error;
  }
}

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

let globalStyleCounter = 0;

/**
 * Generates dynamic prompt for book description with structural and stylistic variation.
 */
export function buildDynamicPrompt(title: string, author: string, lang: string = 'ar', category?: string) {
  const isEnglish = lang === 'en';
  const validAuthor = author && author !== 'Unknown' && author !== 'غير معروف' && author !== 'null' ? author : null;
  const categoryContext = category && category !== 'عام' && category !== 'General' ? category : null;

  const titleHash = title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const styleIndex = (globalStyleCounter + titleHash) % 4;
  globalStyleCounter = (globalStyleCounter + 1) % 4;

  if (isEnglish) {
    const englishStyles = [
      `STYLE APPROACH: Analytical & Direct Subject Focus.
Begin directly with the core subject and domain of the book. Focus on the analytical framework and key themes investigated in the text.`,
      `STYLE APPROACH: Scope & Structural Overview.
Structure the description around the scope of topics covered and the thematic breakdown of the work.`,
      `STYLE APPROACH: Conceptual & Methodological Perspective.
Focus on the methodological approach, theoretical/scholarly concepts, and practical dimensions presented in the text.`,
      `STYLE APPROACH: Contextual & Concise Synthesis.
Provide a clear, punchy, subject-driven summary highlighting the primary questions and core value of the work.`
    ];

    return `
You are a distinguished scholarly editor and SEO specialist for an Islamic digital library.
Write a unique, highly natural, engaging, and SEO-optimized book description for:
Book Title: "${title}"
${validAuthor ? `Author: "${validAuthor}"` : ''}
${categoryContext ? `Category/Subject: "${categoryContext}"` : ''}

${englishStyles[styleIndex]}

CRITICAL REQUIREMENTS:
1. NO TEMPLATES & NO CLICHÉS: DO NOT start with generic openers like "This book is a valuable work...", "This indispensable masterpiece...", "In the realm of...", or "Offers deep insights into...". Start IMMEDIATELY with the actual subject or premise of the book (e.g., "Examining the principles of jurisprudence, '${title}' explores...", "Centered on Hadith terminology, '${title}' presents...").
2. REAL INFORMATION GROUNDING: Base your description strictly on the title, author, and category context. Adapt your vocabulary to the specific discipline (e.g. Fiqh, Tafsir, Aqeedah, Arabic Language, History, or General Knowledge). Do NOT invent false historical dates or imaginary publication facts.
3. HANDLING UNKNOWN AUTHORS: ${validAuthor ? `Mention author "${validAuthor}" naturally.` : `Do NOT mention that the author is unknown or unstated. Focus entirely on the text itself.`}
4. NATURAL KEYWORD INTEGRATION: Seamlessly weave keywords (such as "PDF download", "read online", "scholarly edition") into informative context. Do NOT tack on generic marketing sentences at the end.
5. LENGTH & STRUCTURE: Write 2 to 3 natural, well-crafted paragraphs (150–250 words total). Keep tone eloquent, objective, and human-written.
6. SEO TITLE: Provide a natural, concise SEO title that sounds authoritative (e.g., "Download ${title} PDF - Read Online", "${title} PDF Book - Read & Download").

Format your response strictly as JSON:
{
  "seoTitle": "SEO Title here",
  "description": "Full description here"
}
`;
  } else {
    const arabicStyles = [
      `أسلوب العرض: التحليلي المباشر.
ابدأ فوراً بتحليل الموضوع الأساسي والقضايا المركزية التي يعالجها الكتاب بأسلوب بليغ ومستقل.`,
      `أسلوب العرض: التناول المحوري والأبواب.
ركز على تنوع الموضوعات والأبواب العلمية والنطاق المعرفي الذي يغطيه المتن.`,
      `أسلوب العرض: المنهجي والموضوعي.
تسليط الضوء على المنهجية العلمية والقواعد والأفكار الجوهرية الواردة في النص.`,
      `أسلوب العرض: السياقي والتعريفي المكثف.
تقديم صياغة معبرة ومكثفة توضح طبيعة المادة العلمية وفائدتها المباشرة للباحثين والقراء.`
    ];

    return `
أنت محرر علمي وخبير SEO في مكتبة إسلامية معتمدة. قم بكتابة وصف فريد وطبيعي وبليغ ومحسّن لمحركات البحث (SEO) لكتاب:
عنوان الكتاب: "${title}"
${validAuthor ? `المؤلف: "${validAuthor}"` : ''}
${categoryContext ? `التصنيف/المجال: "${categoryContext}"` : ''}

${arabicStyles[styleIndex]}

قواعد صارمة يمنع التخلي عنها:
1. منع القوالب والجمل المكررة تماماً: يمنع منعاً باتاً البدء بعبارات مستهلكة مثل ("يعد هذا الكتاب من أهم/أبرز...", "يعتبر هذا الكتاب...", "يقدم الباحث/المؤلف رؤية عميقة...", "صرح علمي شامخ", "لا غنى عنه لكل باحث"). ابدأ فوراً بموضوع الكتاب والمتن الأساسي (مثلاً: "ينتظم هذا المصنف حول أحكام الفقه المالي...", "يعالج هذا السفر مبادئ علم النحو...").
2. الاعتماد على المعطيات الحقيقية: استند إلى اسم الكتاب وتصنيفه ومؤلفه لتقديم صياغة متخصصة تناسب المجال (فقه، حديث، تفسير، عقيدة، لغة عربية، تاريخ، إلخ). لا تخترع تواريخ أو تفاصيل غير مؤكدة.
3. اسم المؤلف: ${validAuthor ? `أدرج اسم المؤلف "${validAuthor}" بشكل طبيعي.` : `إذا كان المؤلف غير معروف أو غير متوفر، فلا تذكر أبداً أنه غير معروف، بل ركز الوصف بالكامل على متن الكتاب.`}
4. دمج الكلمات المفتاحية بذكاء: ادمج كلمات البحث (مثل: تحميل PDF، قراءة أونلاين، كتاب) بشكل طبيعي ضمن السياق العلمي، ودون إضافة فقرات تسويقية منفصلة أو مبتذلة.
5. الطول والشكل: اكتب من 2 إلى 3 فقرات قصيرة بليغة (بين 150 إلى 250 كلمة). اجعل الأسلوب بشرياً فصيحاً وموثوقاً.
6. عنوان SEO محسن: اقترح عنوان SEO متنوّعاً وطبيعياً (مثل: "تحميل كتاب ${title} PDF وقراءته أونلاين" أو "كتاب ${title} PDF - قراءة وتحميل مجاني").

أريد النتيجة بتنسيق JSON حصراً:
{
  "seoTitle": "عنوان SEO هنا",
  "description": "الوصف الكامل هنا"
}
`;
  }
}

/**
 * Generates SEO description for a book using GPT-4.1-mini with dynamic prompts
 */
export async function generateBookDescription(title: string, author: string, lang: string = 'ar', category?: string) {
  const prompt = buildDynamicPrompt(title, author, lang, category);

  const result = await callOpenAI(
    SEO_MODEL,
    [{ role: 'user', content: prompt }],
    { type: 'json_object' },
    '[SEO]'
  );
  return result as { seoTitle: string; description: string };
}

/**
 * Generates SEO description for a category using GPT-4.1-mini
 */
export async function generateCategoryDescription(categoryTitle: string, lang: string = 'ar') {
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

  const result = await callOpenAI(
    SEO_MODEL,
    [{ role: 'user', content: prompt }],
    { type: 'json_object' },
    '[SEO]'
  );
  return result.description as string;
}

/**
 * Standardizes and improves book titles using GPT-4.1-nano
 */
export async function normalizeTitle(title: string, author?: string, lang: string = 'ar') {
  if (!OPENAI_API_KEY) return title;

  const isEnglish = lang === 'en';

  const prompt = isEnglish ? `
Standardize and improve the following book title to be suitable for SEO and a professional library.
Original Title: "${title}"
${author && author !== 'Unknown' && author !== 'غير معروف' ? `Author: "${author}"` : ''}

Requirements:
1. Remove any unnecessary additions (e.g., "pdf", "download", "clear copy").
2. Add "Book" at the beginning if appropriate.
3. Write the title completely and correctly.
4. Important: If the author's name is unknown, do not mention "Unknown Author" in the title.
5. Return the result as JSON: {"normalizedTitle": "..."}
` : `
قم بتوحيد وتحسين عنوان الكتاب التالي ليكون مناسباً لـ SEO ومكتبة احترافية.
العنوان الأصلي: "${title}"
${author && author !== 'Unknown' && author !== 'غير معروف' ? `المؤلف: "${author}"` : ''}

المطلوب:
1. إزالة أي زيادات غير ضرورية (مثل: "pdf", "تحميل", "نسخة واضحة").
2. إضافة "كتاب" في البداية إذا كان مناسباً.
3. كتابة العنوان كاملاً وصحيحاً.
4. ملاحظة هامة: إذا كان المؤلف غير معروف، فلا تذكر ذلك في العنوان أبداً.
5. أعد النتيجة كـ JSON: {"normalizedTitle": "..."}
`;

  try {
    const result = await callOpenAI(
      FILTER_MODEL,
      [{ role: 'user', content: prompt }],
      { type: 'json_object' },
      '[FILTER]'
    );
    return result.normalizedTitle;
  } catch (error) {
    return title;
  }
}

/**
 * Generic SEO content generation utility using GPT-4.1-mini
 */
export async function generateSeoDescription(prompt: string) {
  const result = await callOpenAI(
    SEO_MODEL,
    [{ role: 'user', content: prompt }],
    { type: 'json_object' },
    '[SEO]'
  );
  return result;
}

// Deprecated functions - no longer used by the English suggestion pipeline
export async function verifyEnglishBooks(_books: any[]) { return []; }
export async function verifyVisionEnglish(_imageUrl: string): Promise<boolean> { return false; }
export async function verifyTextEnglish(_text: string): Promise<boolean> { return false; }
export async function classifyIslamicContent(_text: string, _imageUrl?: string): Promise<string> { return '[3]'; }
