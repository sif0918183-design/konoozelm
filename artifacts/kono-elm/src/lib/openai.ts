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

// Global counter for deterministic sequential rotation across generations (1 -> 2 -> 3 -> 4 -> 1 ...)
let globalStyleCounter = 0;

/**
 * Returns current global style index (0-based) and increments counter.
 */
export function getNextStyleIndex(): number {
  const currentIndex = globalStyleCounter % 4;
  globalStyleCounter++;
  return currentIndex;
}

/**
 * Advances global style counter by count.
 */
export function advanceStyleCounter(count: number): void {
  globalStyleCounter += count;
}

/**
 * Generates SEO description for a book using GPT-4.1-mini with 4 distinct editorial styles.
 * If explicitStyleIndex is provided, uses that specific style (0-based index 0..3).
 * Otherwise, automatically uses and advances the global sequential counter.
 */
export async function generateBookDescription(title: string, author: string, lang: string = 'ar', explicitStyleIndex?: number) {
  const isEnglish = lang === 'en';
  const hasAuthor = author && author !== 'Unknown' && author !== 'غير معروف' && author.trim() !== '';

  const styleIndex = explicitStyleIndex !== undefined ? (Math.abs(explicitStyleIndex) % 4) : getNextStyleIndex();

  // Common mandatory safety, grounding, semantic SEO, and editorial guidelines
  const commonRulesAr = `
قواعد وأحكام إلزامية حاسمة (تحرير بشري احترافي + SEO دلالي غني):
1. الاعتماد المطلق على البيانات الحقيقية: اعتمد حصراً وبشكل مطلق على بيانات الكتاب الحقيقية المتوفرة ("${title}"${hasAuthor ? ` للمؤلف "${author}"` : ''}).
2. التكاملي بين التحرير البشري والـ Semantic SEO: ادعم النص بالمصطلحات العلمية والدلالية المرتبطة بموضوع الكتاب ومجاله (مثل الفقه الحنفي، الأحكام الفقهية، الحديث، السنة النبوية، العقيدة) فقط عندما تكون مرتبطة وثيقة بمادة الكتاب. لا تحشو كلمات مفتاحية لمجرد SEO.
3. حظر الاختلاق والتخمين: يُمنع منعاً باتاً اختلاق فصول غير معروفة، أجزاء، منهج المؤلف، مذهبه، آراؤه، تقييمات، أو دار نشر ما لم ترد صراحة في البيانات. مجرد وجود عنوان لا يعني جواز اختراع محتواه التفصيلي.
4. ${!hasAuthor ? 'اسم المؤلف غير متوفر؛ يُمنع منعاً باتاً كتابة "المؤلف غير معروف" أو أي جملة تشير لغيابه. ركز الوصف بالكامل وبشكل طبيعي على متن الكتاب وموضوعه.' : 'اذكر اسم المؤلف بطريقة طبيعية دون حشو أو تكرار متكلف.'}
5. تركيز النص على الكتاب لا على الموقع: لا تحول الوصف إلى نص تسويقي للموقع، ويُمنع ختم الفقرات بعبارات حشو دعائية مثل ("تحميل PDF مجاناً"، "يمكن قراءته أونلاين عبر المكتبة"، "في المكتبة الإسلامية الرقمية").
6. منع القوالب والعبارات المستهلكة: حظر العبارات المكررة مثل ("يُعد كتاب"، "يعتبر كتاب"، "مرجع مهم"، "مرجع قيم"، "إضافة قيمة"، "يتيح للقارئ"، "مما يسهم في"، "الباحثين والطلاب والمهتمين"، "بأسلوب علمي رصين").
7. بنية تحريرية مرنة وطول مناسب: استهدف طولاً بين 120 إلى 220 كلمة عندما تسمح البيانات بذلك (وأقصر إذا كانت البيانات قليلة). نوع بنيات الفقرات والجمل (من 1 إلى 3 فقرات) دون اتباع قالب ثوابت مسبق.
8. مراجعة تحريرية داخلية قبل إخراج الناتج: راجع النص ذهنياً قبل إخرجه وتأكد أن النص يجيب عن سؤال القارئ ومحرك البحث ببلاغة ودقة ودون جمل حشو.
`;

  const commonRulesEn = `
CRITICAL MANDATORY RULES (Native English Editorial Quality + Semantic SEO):
1. FACTS FIRST: Rely STRICTLY and SOLELY on the real provided book data ("${title}"${hasAuthor ? ` by "${author}"` : ''}).
2. NATIVE ENGLISH EDITORIAL QUALITY: Write as a professional English-language book editor. Do NOT produce translated Arabic patterns or clumsy phrasing.
3. SEMANTIC SEO INTEGRATION: Naturally incorporate relevant domain keywords (e.g., Islamic jurisprudence, Hadith studies, theology, historical analysis) ONLY when genuinely backed by the book's topic. Do NOT keyword-stuff.
4. ABSOLUTELY NO HALLUCINATIONS: Do NOT invent unverified chapters, volume numbers, school of thought, or author opinions not present in the input.
5. ${!hasAuthor ? 'Author name is unavailable; DO NOT write "Unknown Author" or mention missing author details. Focus 100% on the book itself.' : 'Mention the author naturally without overusing the name.'}
6. NO MARKETING/WEBSITE FILLER: Focus entirely on the book. Do NOT write promotional text about the website/library or append boilerplate download links ("Download PDF here", "Read online in our digital library").
7. BAN AI CLICHÉS: Avoid generic phrases ("This book is an important reference...", "This valuable work...", "It provides readers with...", "It is a valuable addition...", "Researchers and students interested in...").
8. LENGTH & FLEXIBLE STRUCTURE: Target roughly 120 to 220 words (or shorter if data is sparse). Use 1 to 3 natural paragraphs with varied sentence structures.
`;

  // 4 Re-formulated Editorial Styles
  let styleInstructionAr = '';
  let styleInstructionEn = '';

  switch (styleIndex) {
    case 0:
      // Style 1: تعريف وتحليل (Definition & Subject Analysis)
      styleInstructionAr = `
[الأسلوب التحريري الأول: تعريف وتحليل]
- الشخصية التحريرية: أسلوب تحريري رصين ينطلق من هوية الكتاب وموضوعه الأساسي، ثم ينتقل بشكل طبيعي إلى استعراض محتواه وأبرز جوانبه المعرفية.
- التناول والتنظيم:
  * ابدأ مباشرة بتسليط الضوء على هويته وموضوعه الرئيسي بأسلوب متجدد (تجنب افتتاحات القوالب مثل "يُعد كتاب...").
  * حلل المحور الفكري أو الفقهي أو التاريخي للكتاب بناءً على المعطيات المؤكدة.
  * صغ خاتمة متناسقة توضح البعد المعرفي للمصنف.
`;
      styleInstructionEn = `
[Editorial Style 1: Definition & Analysis]
- Editorial Character: Scholarly and analytical. Begins directly with the book's identity and primary subject, then analyzes its core coverage.
- Structure:
  * Lead with a direct statement of the book's identity and core discipline (avoid "This book is...").
  * Analyze the central theme or field based strictly on confirmed metadata.
  * Conclude with a concise summary of its intellectual scope.
`;
      break;

    case 1:
      // Style 2: الموضوع أولاً (Subject-First Lead)
      styleInstructionAr = `
[الأسلوب التحريري الثاني: الموضوع أولاً]
- الشخصية التحريرية: أسلوب يبدأ من القضية المعرفية أو المجال الفكري الذي يناقشه الكتاب، ثم يربط ذلك ببراعة بعنوان المصنف ومؤلفه.
- التناول والتنظيم:
  * افتتح النص بطرح المجال أو المسألة الرئيسية التي يدور حولها موضوع الكتاب.
  * اربط المضمون بعين العنوان واكتفِ بالإشارة إلى مادة الكتاب بأسلوب سلس.
  * قدم استعراضاً متماسكاً يبرز السياق المعرفي للموضوع دون حشو.
`;
      styleInstructionEn = `
[Editorial Style 2: Subject-First Lead]
- Editorial Character: Conceptual lead. Begins with the central question, discipline, or thematic issue addressed by the work.
- Structure:
  * Open with the overarching topic or field of study before naming the title.
  * Connect the theme seamlessly to the book title and author.
  * Offer an engaging presentation of the core subject matter.
`;
      break;

    case 2:
      // Style 3: بنية ومحتوى (Content & Structural Focus)
      styleInstructionAr = `
[الأسلوب التحريري الثالث: بنية ومحتوى]
- الشخصية التحريرية: أسلوب محدد وإخباري يجيب القارئ بوضوح عن طبيعة المادة المعالجة والموضوعات المدرجة وفق البيانات المتوفرة فقط.
- التناول والتنظيم:
  * ركز على صلب المادة العلمية ونوع القضايا التي يتطرق إليها النص.
  * استعرض البنية المعرفية والنطاق الموضوعي للكتاب بدقة ودون اختلاق فصول أو أبواب لم تذكر.
  * صغ الفقرات بأسلوب مقتضب ومباشر يوضح معالم الكتاب الأساسية.
`;
      styleInstructionEn = `
[Editorial Style 3: Content & Structure]
- Editorial Character: Direct and informative. Focuses on what the book actually covers and its structural material.
- Structure:
  * Highlight the core material and specific topics verified in the metadata.
  * Outline the scope and thematic coverage with clarity and precision.
  * Maintain strict factual fidelity without inventing missing chapters or outlines.
`;
      break;

    case 3:
      // Style 4: تحرير مرن (Flexible Narrative Style)
      styleInstructionAr = `
[الأسلوب التحريري الرابع: تحرير مرن بأسلوب حر]
- الشخصية التحريرية: أسلوب تحريري حر بتركيب جمل متجدد وإيقاع انسيابي غير تقليدي، يعطي الانطباع بقلم محرر متخصص يكتب بأسلوب مستقل.
- التناول والتنظيم:
  * انطلق من زاوية مدخل مميزة تنبع من عنوان الكتاب أو نطاقه الفرعي.
  * تنقل بين المعطيات بانسيابية وسلاسة وبناء لغوي يتنوع في طول الجمل والفقرات.
  * حافظ على الانضباط والدقة التامة للبيانات المتاحة دون مبالغة.
`;
      styleInstructionEn = `
[Editorial Style 4: Flexible Narrative Style]
- Editorial Character: Dynamic and fluid. Expressive prose with varied sentence mechanics suited for a modern editorial piece.
- Structure:
  * Choose a dynamic entry point drawn from a key aspect of the title or subfield.
  * Transition effortlessly between details using expressive language.
  * Ensure strict fidelity to real metadata throughout.
`;
      break;
  }

  const prompt = isEnglish ? `
You are a senior professional book editor. Write a natural, highly professional, fact-grounded book description for "${title}"${hasAuthor ? ` by "${author}"` : ''}.

${styleInstructionEn}

${commonRulesEn}

Requirements:
- Length: Target 120 to 220 words (or shorter if data is sparse).
- Language: Native, fluent English strictly (no Arabic phrases or clumsy translation patterns).
- SEO Title: Suggest a concise, clean title incorporating "Download & Read PDF" and the book title.
- Format: Return strictly JSON object format:
{
  "seoTitle": "SEO Title Here",
  "description": "Full Description Here"
}
` : `
أنت رئيس تحرير مكتبة متخصصة. قم بكتابة وصف تحريري دقيق، طبيعي، وغني دلالياً لكتاب بعنوان "${title}"${hasAuthor ? ` للمؤلف "${author}"` : ''}.

${styleInstructionAr}

${commonRulesAr}

المتطلبات:
- الطول: استهدف بين 120 و 220 كلمة تقريباً (أو أقصر إذا كانت البيانات محدودة).
- اللغة: لغة عربية فصحى طبيعية واحترافية حصراً.
- عنوان SEO: اقترح عنواناً جذاباً ورصيناً يتضمن "تحميل وقراءة PDF" واسم الكتاب.
- التنسيق: أعد النتيجة حصراً بصيغة JSON:
{
  "seoTitle": "عنوان SEO هنا",
  "description": "الوصف الكامل هنا"
}
`;

  console.log(`[SEO Description Generation] Using Editorial Style #${styleIndex + 1}`);

  const result = await callOpenAI(
    SEO_MODEL,
    [{ role: 'user', content: prompt }],
    { type: 'json_object' },
    `[SEO Style #${styleIndex + 1}]`
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
