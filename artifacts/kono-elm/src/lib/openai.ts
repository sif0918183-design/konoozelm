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
  const styleIndex = (globalStyleCounter + titleHash) % 6;
  globalStyleCounter = (globalStyleCounter + 1) % 6;

  if (isEnglish) {
    const englishStyles = [
      `STRUCTURAL PERSPECTIVE 1: Direct Noun/Subject Opening.
Begin immediately with a descriptive noun phrase or subject assertion regarding the book's specific domain matter. Vary paragraph structure naturally across 2 paragraphs.`,
      `STRUCTURAL PERSPECTIVE 2: Thematic Questions & Conceptual Scope.
Open with the core scholarly questions or issues explored in this text. Use a concise 2-paragraph layout focusing on subject relevance.`,
      `STRUCTURAL PERSPECTIVE 3: Analytical Breakdown.
Focus directly on the content structure and key thematic sections. Keep tone strictly informative without formulaic metadata introductions.`,
      `STRUCTURAL PERSPECTIVE 4: Methodological & Discipline Focus.
Start with the discipline's central concepts and how the text handles them. Use 1 rich, comprehensive paragraph or 2 short focused paragraphs.`,
      `STRUCTURAL PERSPECTIVE 5: Textual Overview.
Provide a direct synthesis of what the work contains, weaving research utility and downloadable reading options naturally into text flow.`,
      `STRUCTURAL PERSPECTIVE 6: Contextual & Functional Guide.
Open directly with the primary focus of the work. Emphasize its practical value for readers and scholars without introductory fluff.`
    ];

    return `
You are an expert scholarly editor and SEO specialist for an Islamic digital library.
Write a completely unique, natural, human-written SEO description for:
Book Title: "${title}"
${validAuthor ? `Author: "${validAuthor}"` : ''}
${categoryContext ? `Category/Subject: "${categoryContext}"` : ''}

${englishStyles[styleIndex]}

STRICT RULES TO AVOID TEMPLATES & REPETITION:
1. BANNED OPENING FORMULAS: DO NOT start with "This book is...", "This work...", "Examining...", "Centered on...", "Delving into...", "In this comprehensive work...", "This indispensable masterpiece...", or "Written by...".
2. VARY OPENING GRAMMAR: Vary the sentence structure naturally. Start with a subject noun, a thematic concept, or a direct statement about the field. NEVER copy or reuse fixed opening phrases across books.
3. FLEXIBLE PARAGRAPH STRUCTURE: Write between 1 and 3 paragraphs (130-220 words total). Allow the structure and sentence flow to vary based on the specific book title and subject matter.
4. INFORMATION GROUNDING: Use only factual information drawn from the title, author, and category context. Do NOT invent fake historical facts or dates.
5. UNKNOWN AUTHOR HANDLING: ${validAuthor ? `Integrate author "${validAuthor}" naturally.` : `Do NOT mention that the author is unknown or omitted. Focus entirely on the text content.`}
6. NATURAL SEO & TITLE: Integrate search intent naturally (e.g. "PDF download", "read online") without standalone sales pitches. Provide an expressive, concise SEO title.

Format response as strictly JSON:
{
  "seoTitle": "SEO Title here",
  "description": "Full description here"
}
`;
  } else {
    const arabicStyles = [
      `نمط البناء الأول: البداية المباشرة باسم الموضوع أو المجال.
ابدأ الجملة الأولى فوراً باسم الموضوع أو الجملة الاسمية التي تحدد مضمون الكتاب دون أفعال تمهيدية مكررة.`,
      `نمط البناء الثاني: التناول القضائي والتحليلي.
ركز على المسائل العلمية والقضايا التي يطرحها المتن في سياق موضوعه، مستخدماً فقرتين قصیرتين بتركيب لغوي فريد.`,
      `نمط البناء الثالث: التركيز على المحاور والأبواب.
ابسط المحاور والموضوعات الأساسية للكتاب مباشرة دون مقدمات إنشائية، بأسلوب بليغ يناسب فن العلم.`,
      `نمط البناء الرابع: المنظور المنهجي والمعرفي.
سلط الضوء على المنهجية والأصول العلمية الواردة في النص بفقرة واحدة غنية أو فقرتين مركزتين.`,
      `نمط البناء الخامس: العرض المباشر والمكثف.
قدم عرضاً شاملاً ومكثفاً لمحتوى السفر وفائدته العلمية مع دمج خيارات القراءة والتحميل بسلاسة.`,
      `نمط البناء السادس: التناول السياقي للموضوع.
ابدأ فوراً بتأصيل المادة العلمية ومجالها المعرفي، بأسلوب يعبر عن خصوصية هذا الكتاب عن غيره.`
    ];

    return `
أنت محرر علمي وخبير SEO محترف في مكتبة إسلامية. قم بكتابة وصف فريد وطبيعي وبليغ وغير مكرر لكتاب:
عنوان الكتاب: "${title}"
${validAuthor ? `المؤلف: "${validAuthor}"` : ''}
${categoryContext ? `التصنيف/المجال: "${categoryContext}"` : ''}

${arabicStyles[styleIndex]}

قواعد صارمة لضمان التنوع التام ومنع التكرار:
1. منع الأفعال والافتتاحيات المكررة: يمنع منعاً باتاً استخدام الافتتاحيات النمطية أو البدء بأفعال مثل ("ينتظم"، "ينطلق"، "يقدم هذا الكتاب"، "يتناول هذا الكتاب"، "يركز هذا الكتاب"، "يستعرض هذا الكتاب"، "يعالج هذا الكتاب"، "يدور هذا الكتاب"، "يعد هذا الكتاب"، "يعتبر هذا الكتاب").
2. التنويع النحوي في الافتتاحية: غير التركيب النحوي للجملة الأولى من كتاب لآخر (ابدأ أحياناً بالجملة الاسمية، أو بالموضوع مباشرة، أو بالمسألة العلمية). يمنع استخدام صيغة موحدة أو جمل استهلالية نمطية.
3. مرونة البناء والفقرات: اكتب بين فقرة واحدة وافية إلى 3 فقرات قصيرة (بين 130 إلى 220 كلمة). اجعل ترتيب الجمل والأفكار يختلف بحسب طبيعة الموضوع والمعلومات المتوفرة.
4. المعطيات الحقيقية: اعتمد على اسم الكتاب وتصنيفه ومؤلفه لتقديم صياغة متخصصة تناسب المجال (فقه، حديث، تفسير، عقيدة، لغة، تاريخ، إلخ) دون اختراع تفاصيل غير مؤكدة.
5. اسم المؤلف: ${validAuthor ? `أدرج اسم المؤلف "${validAuthor}" بأسلوب سلس.` : `إذا كان المؤلف غير معروف، فلا تذكر إطلاقاً أنه غير معروف، بل ركز الوصف بالكامل على موضوع الكتاب.`}
6. دمج SEO والعنوان: ادمج كلمات البحث (تحميل PDF، قراءة أونلاين، كتاب) بشكل طبيعي وضمين داخل النص دون جمل تسويقية مجزأة. اقترح عنوان SEO جذاباً ومتنوعاً.

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
