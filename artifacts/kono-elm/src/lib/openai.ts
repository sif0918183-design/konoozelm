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
Begin immediately with a descriptive noun phrase or subject assertion regarding the book's specific domain matter.`,
      `STRUCTURAL PERSPECTIVE 2: Thematic Focus & Conceptual Scope.
Open with the primary scholarly concepts or subject areas explored in this text.`,
      `STRUCTURAL PERSPECTIVE 3: Content Structure Breakdown.
Focus directly on the thematic sections and subject organization of the work.`,
      `STRUCTURAL PERSPECTIVE 4: Discipline & Methodological Context.
Start with the central principles of the discipline and how this work addresses them.`,
      `STRUCTURAL PERSPECTIVE 5: Textual Overview.
Provide a direct synthesis of what the work covers and its core focus within its category.`,
      `STRUCTURAL PERSPECTIVE 6: Subject-First Functional Guide.
Open directly with the primary subject matter and its specific relevance for readers.`
    ];

    return `
You are a professional book editor and library specialist writing for an English-language digital catalog.
Write an authentic, highly informative, and natural SEO book description for:
Book Title: "${title}"
${validAuthor ? `Author: "${validAuthor}"` : ''}
${categoryContext ? `Category/Subject: "${categoryContext}"` : ''}

${englishStyles[styleIndex]}

GUIDELINES & PRINCIPLES (INFORMATION FIRST, SEO SECOND):
1. NATIVE ENGLISH EDITORIAL PROSE: Write naturally as a native English book editor. Avoid translationese, rigid formulas, or marketing tone.
2. WORD COUNT: Aim for 150-220 words when sufficient metadata is provided. If metadata is minimal, write a concise, accurate, and informative summary without adding artificial fluff or filler.
3. FACTUAL GROUNDING: Base the text strictly on verified book data (title, author, category, subject area). Do NOT extrapolate speculative details or invent unconfirmed facts.
4. BANNED CLICHÉS: DO NOT use repetitive sales pitch phrases such as "This valuable work...", "This important reference...", "Perfect for scholars and students...", "It provides readers with...", "This indispensable masterpiece...", or "Written by...".
5. SEMANTIC SEO & PDF MENTIONS: Incorporate relevant discipline terminology naturally for strong semantic SEO. Do NOT stuff keywords. Mention "PDF download" or "read online" AT MOST ONCE naturally if relevant, never as a primary focus.
6. UNKNOWN AUTHOR HANDLING: ${validAuthor ? `Include author "${validAuthor}" naturally.` : `Do NOT mention that the author is unknown or missing. Focus entirely on the text content.`}
7. SEO TITLE: Suggest a clean, authoritative SEO title that reads like a professional library catalog entry.

Format response strictly as JSON:
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
ركز على المسائل العلمية والقضايا التي يطرحها المتن في سياق موضوعه بتركيب لغوي فريد.`,
      `نمط البناء الثالث: التركيز على المحاور والأبواب.
ابسط المحاور والموضوعات الأساسية للكتاب مباشرة دون مقدمات إنشائية، بأسلوب بليغ يناسب فن العلم.`,
      `نمط البناء الرابع: المنظور المنهجي والمعرفي.
سلط الضوء على المنهجية والأصول العلمية الواردة في النص بأسلوب علمي رصين.`,
      `نمط البناء الخامس: العرض المباشر والمكثف.
قدم عرضاً شاملاً ومكثفاً لمحتوى السفر وموضوعه الأساسي دون حشو.`,
      `نمط البناء السادس: التناول السياقي للموضوع.
ابدأ فوراً بتأصيل المادة العلمية ومجالها المعرفي، بأسلوب يعبر عن خصوصية هذا الكتاب.`
    ];

    return `
أنت محرر كتب متخصص في مكتبة إسلامية ومعرفية. قم بكتابة وصف طبيعي، فريد، بليغ، وغني بالمعلومات لكتاب:
عنوان الكتاب: "${title}"
${validAuthor ? `المؤلف: "${validAuthor}"` : ''}
${categoryContext ? `التصنيف/المجال: "${categoryContext}"` : ''}

${arabicStyles[styleIndex]}

قواعد وضوابط كتابة الوصف (المعلومات أولاً، SEO ثانياً، والتسويق في الحد الأدنى):
1. أسلوب عربي أصيل: اكتب بلغة عربية فصيحة وسليمة وبناء تعبيري متنوع ومستقل، بعيداً عن القوالب الجاهزة أو الصياغات الآلية.
2. الطول والعمق: استهدف 150-220 كلمة عندما تكون معلومات الكتاب كافية. إذا كانت المعلومات المتاحة محدودة، اكتب وصفاً أقصر لكنه مفيد ودقيق ودون حشو أو تكرار.
3. الالتزام بالحقائق: استند حصراً إلى المعطيات المتوفرة (العنوان، المؤلف، التصنيف، المجال). لا تضف معلومات غير موجودة ولا تستنتج محتوى تفصيلياً غير مؤكد.
4. منع العبارات المستهلكة: يمنع استخدام عبارات تسويقية عامة مثل ("مرجع لا غنى عنه"، "كنز علمي"، "مطلب ضروري لكل باحث"، "يعد هذا الكتاب من أهم/أبرز...", "يقدم الباحث رؤية عميقة").
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
