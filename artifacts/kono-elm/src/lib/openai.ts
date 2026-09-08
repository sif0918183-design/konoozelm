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

  // Common mandatory safety, grounding, and style guidelines
  const commonRulesAr = `
قواعد وأحكام إلزامية حاسمة (الانضباط بالحقائق والدقة التحريرية):
1. الحقائق أولاً: اعتمد حصراً وبشكل مطلق على بيانات الكتاب الحقيقية المتوفرة ("${title}"${hasAuthor ? ` للمؤلف "${author}"` : ''}).
2. يُمنع منعاً باتاً التخمين أو اختلاق: فصول غير معروفة، أجزاء، منهج المؤلف، مذهبه، آراؤه، تقييمات، دار نشر، أو محقق ما لم ترد صراحة في البيانات. مجرد وجود عنوان لا يعني جواز اختراع محتواه المفترض.
3. ${!hasAuthor ? 'اسم المؤلف غير متوفر؛ يُمنع منعاً باتاً كتابة "المؤلف غير معروف" أو أي جملة تشير لغيابه. ركز الوصف بالكامل وبشكل طبيعي على متن الكتاب وموضوعه.' : 'اذكر اسم المؤلف بشكل طبيعي وسلس دون تكرار أو مبالغة.'}
4. منع الحشو والدعاية والتسويق للموقع: الوصف خاص بـ "الكتاب فقط". يمنع ختم الوصف بعبارات دعاية للموقع مثل "يمكن تحميله PDF"، "قراءته أونلاين"، "تتيح المكتبة"، "في المكتبة الإسلامية الرقمية".
5. حظر العبارات المستهلكة والقوالب الآلية: تجنب قدر الإمكان عبارات النمطية مثل ("مرجع مهم"، "مرجع قيم"، "مرجع علمي متميز"، "إضافة قيمة"، "إضافة مهمة للمكتبة"، "الباحثين والطلاب والمهتمين"، "بأسلوب علمي رصين"، "تعميق الفهم"، "إثراء المكتبة").
6. تنويع الجمل والتركيب: تجنب التكرار الآلي لافتتاحيات مثل ("يُعد..."، "يعتبر..."، "يتناول...") أو نهايات نمطية مثل ("مما يجعله إضافة قيمة...").
7. الطول والتقسيم: اكتب وصفاً يتراوح بين 100 إلى 180 كلمة تقريباً (أقصر بحدود 80-120 كلمة إن كانت البيانات محدودة). لا تجعل عدد الفقرات قالباً ثابتاً (يمكن فقرة أو فقرتين أو ثلاث حسب الحجم والمعلومات).
8. مراجعة تحريرية داخلية قبل إخراج الناتج: قبل إخراج النص النهائي، راجع الوصف ذهنياً للتأكد من خلوه تماماً من التخمين أو الحشو أو العبارات التسويقية المكررة، واقتطع أي جملة لا تقدم فائدة حقيقية عن الكتاب.
`;

  const commonRulesEn = `
CRITICAL MANDATORY RULES (Fact-based Grounding & Editorial Discipline):
1. FACTS FIRST: Rely STRICTLY and SOLELY on real provided book data ("${title}"${hasAuthor ? ` by "${author}"` : ''}).
2. ABSOLUTELY PROHIBITED: Do NOT guess or fabricate table of contents, unverified volume counts, author methodology, school of thought, or publisher details not present in the data.
3. ${!hasAuthor ? 'Author is unavailable; DO NOT write "Unknown Author" or mention missing author info. Focus entirely on the book itself.' : 'Mention the author naturally without repetitive praise.'}
4. NO MARKETING/LIBRARY FILLER: Do not convert the description into website promo or append boilerplate endings like "Download PDF here", "Read online in our library", or "Islamic digital library".
5. BAN AI CLICHÉS & REPETITIVE PHRASES: Avoid overused clichés like ("important reference", "valuable addition", "for researchers and students", "deepening understanding", "enriching the library").
6. VARY SENTENCE STRUCTURE: Do not rely on repetitive sentence openers ("This book is considered...", "It deals with...") or predictable boilerplate conclusions.
7. LENGTH & STRUCTURE: Keep between 100 to 180 words (or shorter, 80-120 words, if data is sparse). Use 1 to 3 natural paragraphs.
8. INTERNAL EDITORIAL CHECK: Review the draft before output. Strip away any marketing fluff, ungrounded assumptions, or AI noise.
`;

  // 4 Re-formulated Editorial Styles
  let styleInstructionAr = '';
  let styleInstructionEn = '';

  switch (styleIndex) {
    case 0:
      // Style 1: الوصف الببليوغرافي التحريري (Bibliographical Editorial Overview)
      styleInstructionAr = `
[الأسلوب التحريري الأول: الوصف الببليوغرافي التحريري]
- الشخصية التحريرية: أسلوب هادئ وموضوعي ومباشر، ينطلق من تعريف ببليوغرافي رصين بطبيعة الكتاب ومجاله العلمي، دون مبالغة أو لغة دعائية.
- التناول والتنظيم:
  * ابدأ من هوية الكتاب وعنوانه بأسلوب طبيعي ومختلف (تجنب البدء بـ "يُعد كتاب...").
  * انتقل إلى بيان موضوعه ومجاله بناءً على البيانات المتوفرة فقط.
  * اختم بعبارة موضوعية موجزة تلخص الفن المعرفي أو المجال الذي ينتمي إليه.
`;
      styleInstructionEn = `
[Editorial Style 1: Bibliographical Editorial Overview]
- Editorial Character: Calm, objective, and bibliographical. Introduces the work and its academic genre straightforwardly without hype.
- Structure:
  * Begin naturally with the book's identity and subject matter (avoid generic "This book is considered...").
  * Outline the core scope based strictly on available metadata.
  * Conclude with a concise summary of the field or domain it addresses.
`;
      break;

    case 1:
      // Style 2: الفكرة المركزية (Central Thematic Core)
      styleInstructionAr = `
[الأسلوب التحريري الثاني: الفكرة المركزية]
- الشخصية التحريرية: أسلوب تحريري يبدأ من القضية المحورية أو الفكرة الرئيسية التي يستهدفها العنوان والموضوع، وربطها بالكتاب ومؤلفه بشكل سلس.
- التناول والتنظيم:
  * ابدأ ببيان القضية أو الموضوع الأساسي الذي تدور حوله مادة الكتاب (إذا كانت واضحة من البيانات).
  * اربط الفكرة بعنوان الكتاب ووسمه العلمي.
  * قدم صياغة تحريرية متناسقة توضح أبعاد هذا الموضوع بأسلوب محرر خبير، دون تحويل النص إلى بطاقة بيانات جافة.
`;
      styleInstructionEn = `
[Editorial Style 2: Central Thematic Core]
- Editorial Character: Conceptual lead. Begins with the main question or central topic indicated by the title and subject.
- Structure:
  * Open with the core subject matter or theme the work centers around.
  * Connect the theme directly to the title and author.
  * Provide a fluid editorial presentation of the topic without robotic listing.
`;
      break;

    case 2:
      // Style 3: عرض المحتوى والبنية (Content & Scope Focus)
      styleInstructionAr = `
[الأسلوب التحريري الثالث: عرض المحتوى والبنية]
- الشخصية التحريرية: أسلوب عملي مركز يجيب القارئ بشكل مباشر عن سؤال: "ما الذي يقدمه هذا الكتاب؟"، بالاعتماد حصراً على المعطيات المؤكدة.
- التناول والتنظيم:
  * ركز على مادة الكتاب ونوع المحتوى والموضوعات المعالجة فيه وفق ما توضحه البيانات.
  * صغ استعراضاً محددًا للمحتوى بأسلوب واضح ومباشر بعيداً عن المبالغة.
  * تجنب تماماً اختلاق أبواب أو فصول لم تذكر في البيانات، واجعل التركيز على النطاق العلمي الفعلي.
`;
      styleInstructionEn = `
[Editorial Style 3: Content & Scope Focus]
- Editorial Character: Informative and structural. Directly answers "What does this book contain?" based purely on verified facts.
- Structure:
  * Focus on the material and subject coverage verified in the metadata.
  * Present a clear, well-structured summary of the subject matter.
  * Strictly avoid inventing table of contents or missing chapters.
`;
      break;

    case 3:
      // Style 4: الوصف التحريري المرن (Flexible Narrative Style)
      styleInstructionAr = `
[الأسلوب التحريري الرابع: الوصف التحريري المرن]
- الشخصية التحريرية: أسلوب مرن ومتجدد في صياغته وإيقاع جمله، يبدو وكأنه بقلم محرر مستقل يفضل المدخل التحريري غير القالبي.
- التناول والتنظيم:
  * اختر زاوية تناول مختلفة (مدخل من جانب بارز في عنوان الكتاب، أو السياق الموضوعي، أو تنوع طبيعي في بناء الجمل).
  * تنقل بين المعطيات بانسيابية وسلاسة وبنية لغوية متجددة تعطي النص نفساً بشرياً ذايةً.
  * حافظ على الدقة والتوازن التام دون الخروج عن البيانات المتوفرة.
`;
      styleInstructionEn = `
[Editorial Style 4: Flexible Narrative Style]
- Editorial Character: Fluid, natural, and expressive. Distinctive phrasing that reads like an independent editorial piece.
- Structure:
  * Choose a dynamic entry angle derived from the title or thematic context.
  * Transition smoothly between details with varied sentence lengths and structure.
  * Maintain strict fidelity to real metadata while offering a fresh reading flow.
`;
      break;
  }

  const prompt = isEnglish ? `
You are a senior library editor. Write a natural, highly professional, fact-grounded book description for "${title}"${hasAuthor ? ` by "${author}"` : ''}.

${styleInstructionEn}

${commonRulesEn}

Requirements:
- Length: 100 to 180 words (or 80 to 120 words if data is sparse).
- SEO Title: Suggest a concise title incorporating "Download & Read PDF" and the book title.
- Format: Return strictly JSON object format:
{
  "seoTitle": "SEO Title Here",
  "description": "Full Description Here"
}
` : `
أنت رئيس تحرير مكتبة رقمية متخصصة. قم بكتابة وصف تحريري دقيق، طبيعي، ومستند إلى الحقائق لكتاب بعنوان "${title}"${hasAuthor ? ` للمؤلف "${author}"` : ''}.

${styleInstructionAr}

${commonRulesAr}

المتطلبات:
- الطول: بين 100 و 180 كلمة تقريباً (أو 80-120 كلمة إذا كانت البيانات محدودة).
- عنوان SEO: اقترح عنواناً ورصيناً يتضمن "تحميل وقراءة PDF" واسم الكتاب.
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
