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

  // Common mandatory safety & grounding instructions
  const commonRulesAr = `
قواعد وأحكام إلزامية حاسمة:
1. الاعتماد المطلق على بيانات الكتاب الحقيقية فقط ("${title}"${hasAuthor ? ` للمؤلف "${author}"` : ''}).
2. يُمنع منعاً باتاً اختلاق معلومات عن المؤلف، أو ادعاء وجود أجزاء أو مجلدات غير مؤكدة، أو اختلاق اقتباسات أو آراء لم ترد في البيانات.
3. إذا كانت المعلومات المتاحة عن الكتاب محدودة، يجب أن يكون الوصف مختصراً وطبيعياً (200-300 كلمة) دون حشو أو مبالغات.
4. ${!hasAuthor ? 'اسم المؤلف غير متوفر؛ يُمنع منعاً باتاً ذكر "المؤلف غير معروف" أو أي عبارة مشابهة، بل ركز الوصف بالكامل على الكتاب وموضوعه والقارئ.' : 'اذكر اسم المؤلف بشكل طبيعي وسلس دون مبالغة.'}
5. اكتب بلغة عربية احترافية، بليغة، كأنها بقلم خبير مكتبات ومحرر بشري متمرس، مع دمج كلمات بحثية بأسلوب طبيعي (تحميل PDF، قراءة أونلاين، مكتبة إسلامية).
6. ابدأ النص مباشرة دون التنويه بكونك مساعد ذكي.
`;

  const commonRulesEn = `
CRITICAL MANDATORY RULES:
1. Rely STRICTLY and SOLELY on the real provided book data ("${title}"${hasAuthor ? ` by "${author}"` : ''}).
2. STRICTLY PROHIBITED: Do not fabricate author biography, unverified volume numbers, fake table of contents, or fictional historical claims.
3. If provided metadata is concise, keep the description natural and focused (200-300 words) without fluff or false promises.
4. ${!hasAuthor ? 'Author name is unavailable. DO NOT state "Unknown Author" or anything similar. Focus 100% on the book title, theme, and value.' : 'Mention the author naturally.'}
5. Write in fluent, professional, human-like editorial style suited for a digital Islamic library with smooth SEO phrase integration (Download PDF, Read Online, Islamic Library).
6. Start immediately without any AI intro phrases.
`;

  // 4 Editorial Styles Prompts
  let styleInstructionAr = '';
  let styleInstructionEn = '';

  switch (styleIndex) {
    case 0:
      // Style 1: تقديم موضوعي مباشر (Direct Objective Overview)
      styleInstructionAr = `
[الأسلوب التحريري الأول: تقديم موضوعي مباشر]
- الشخصية التحريرية: أسلوب موسوعي موضوعي، يبدأ مباشرة بتعريف الكتاب وموضوعه العلمي بشكل محدد وواضح.
- البناء التحريري:
  1. فقرة افتتاحية تحدد العنوان والمجال المعرفي الرئيسي للكتاب بصورة مباشرة ورصينة.
  2. استعراض موضوعي لأبرز المحاور والمحتويات التي يعالجها الكتاب بناءً على عنوانه ومجاله.
  3. فقرة ختامية توضح مكانة الكتاب وخيارات الاطلاع عليه وتحميله بجميع صيغه (PDF) وقراءته أونلاين.
`;
      styleInstructionEn = `
[Editorial Style 1: Direct Objective Overview]
- Editorial Character: Encyclopedic, clear, and direct. Begins straight away by defining the book and its primary field of study.
- Structure:
  1. Direct opening paragraph stating the title, author (if available), and core field.
  2. Structured overview of main themes and subject matter derived from the title.
  3. Clear concluding summary regarding its utility for readers and direct PDF download/online reading.
`;
      break;

    case 1:
      // Style 2: عرض تحليلي للمضمون (Analytical Content Presentation)
      styleInstructionAr = `
[الأسلوب التحريري الثاني: عرض تحليلي للمضمون]
- الشخصية التحريرية: أسلوب تحليلي رصين، يركز على المضمون العلمي والقضايا الجوهرية التي يناقشها الكتاب ودواعي تدوينه.
- البناء التحريري:
  1. افتتاحية تركز على زاوية التناول العلمية والموضوع الأساسي الذي يدور حوله النص.
  2. تحليل طبيعي للقضايا والمسائل العلمية أو الفكرية التي يسلط الكتاب الضوء عليها.
  3. بيان الفائدة التحليلية للباحث والقارئ، وتوفير الكتاب للتحميل المباشر والقراءة عبر المكتبة.
`;
      styleInstructionEn = `
[Editorial Style 2: Analytical Content Focus]
- Editorial Character: Analytical, insightful, and focused on core thematic concepts and intellectual scope.
- Structure:
  1. Opening paragraph highlighting the core premise and thematic focus of the work.
  2. Thoughtful analysis of the subject matter, key questions, or principles addressed.
  3. Scholarly benefit for readers along with seamless PDF download and reading options.
`;
      break;

    case 2:
      // Style 3: التعريف بالقيمة العلمية والفائدة (Academic Value & Utility Focus)
      styleInstructionAr = `
[الأسلوب التحريري الثالث: التعريف بالقيمة العلمية والفائدة]
- الشخصية التحريرية: أسلوب أكاديمي محفز، يركز على قيمة الكتاب في باب العلوم وقدرته على خدمة الباحثين والطلاب.
- البناء التحريري:
  1. استهلال يبرز الأهمية العلمية للموضوع والمكانة التي يمثلها هذا المصنف لدارسي هذا الفن.
  2. توضيح ما يكتسبه القارئ والباحث من مطالعة هذا الكتاب وأبرز فوائده العلمية.
  3. خاتمة تبرز أهمية اقتناء هذه النسخة الإلكترونية المتاحة للتحميل والقراءة السريعة.
`;
      styleInstructionEn = `
[Editorial Style 3: Academic Value & Utility]
- Editorial Character: Educational and value-oriented, emphasizing research benefit and scholarly merit.
- Structure:
  1. Opening highlighting the academic relevance and importance of the subject matter.
  2. Detailed utility overview explaining what students and researchers gain from consulting this title.
  3. Closing sentence facilitating direct access for digital reading and PDF downloading.
`;
      break;

    case 3:
      // Style 4: وصف تحريري مرن وإيقاع متنوع (Flexible Narrative Style)
      styleInstructionAr = `
[الأسلوب التحريري الرابع: وصف تحريري مرن بأسلوب سلس]
- الشخصية التحريرية: أسلوب تحريري مرن وسلس، يبدأ من الفكرة البارزة في المصنف ثم ينتقل بإيقاع متجدد ومبسط بين أجزائه.
- البناء التحريري:
  1. مدخل تحريري جذاب ينطلق من فكرة جوهرية يطرحها موضوع الكتاب.
  2. التقال بأسلوب سردي طبيعي ومتنوع الجمل لتوضيح تفاصيل المادة ومحتواها.
  3. فقرة ختامية مشجعة توضح سهولة قراءة الكتاب أونلاين وتحميله بصيغة PDF.
`;
      styleInstructionEn = `
[Editorial Style 4: Flexible Narrative Description]
- Editorial Character: Dynamic, fluid, and narrative-driven with expressive sentence structure.
- Structure:
  1. Engaging introductory lead inspired by the central concept of the title.
  2. Fluid progression into the structural aspects and coverage of the topic.
  3. Inviting conclusion offering effortless reading and direct PDF download links.
`;
      break;
  }

  const prompt = isEnglish ? `
You are a senior digital library editor and SEO specialist. Write a comprehensive, highly professional, human-like SEO description for a book titled "${title}"${hasAuthor ? ` by author "${author}"` : ''}.

${styleInstructionEn}

${commonRulesEn}

Requirements:
- Length: 200 to 400 words.
- SEO Title: Suggest an authoritative title incorporating "Download & Read PDF" and the book title.
- Format: Return strictly JSON object format:
{
  "seoTitle": "Authoritative SEO Title Here",
  "description": "Full Description Here"
}
` : `
أنت رئيس تحرير مكتبة رقمية إسلامية وخبير SEO محترف. قم بكتابة وصف رصين ومحتوى متميز ومطابق للمعايير لكتاب بعنوان "${title}"${hasAuthor ? ` للمؤلف "${author}"` : ''}.

${styleInstructionAr}

${commonRulesAr}

المتطلبات:
- الطول: بين 200 و 400 كلمة.
- عنوان SEO: اقترح عنواناً جذاباً وموثوقاً يتضمن "تحميل وقراءة PDF" واسم الكتاب.
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
