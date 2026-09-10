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
  webSnippets?: string[];
  lang?: 'ar' | 'en';
}

/**
 * Safely fetches top 2-3 search snippets for the specific book (title + author) with a strict 3.5s timeout.
 */
export async function fetchWebSnippets(title: string, author?: string, lang: 'ar' | 'en' = 'ar'): Promise<string[]> {
  const isEnglish = lang === 'en';
  const cleanAuthor = author && author !== 'Unknown' && author !== 'غير معروف' && author !== 'null' ? author : '';
  const searchKeyword = isEnglish ? 'book' : 'كتاب';
  const query = `"${title}" ${cleanAuthor ? `"${cleanAuthor}"` : ''} ${searchKeyword}`.trim();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3500);

  try {
    const url = 'https://html.duckduckgo.com/html/?q=' + encodeURIComponent(query);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': isEnglish ? 'en-US,en;q=0.9' : 'ar-SA,ar;q=0.9,en;q=0.8'
      }
    });
    clearTimeout(timeoutId);

    if (!res.ok) return [];

    const html = await res.text();
    const snippets: string[] = [];
    const regex = /<a\s+class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(html)) !== null && snippets.length < 3) {
      let text = match[1]
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#x27;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/\s+/g, ' ')
        .trim();

      if (text.length > 20) {
        snippets.push(text);
      }
    }

    return snippets;
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn('[Web Search Fallback] Could not retrieve snippets, proceeding with metadata:', err);
    return [];
  }
}

/**
 * Constructs dynamic prompt for Groq with 4 rotated structural perspectives, comprehensive metadata, and web search enrichment.
 */
export function buildGroqDynamicPrompt(payload: BookMetadataPayload) {
  const lang = payload.lang || 'ar';
  const isEnglish = lang === 'en';
  const validAuthor = payload.author && payload.author !== 'Unknown' && payload.author !== 'غير معروف' && payload.author !== 'null' ? payload.author : null;
  const categoryContext = payload.category && payload.category !== 'عام' && payload.category !== 'General' ? payload.category : null;
  const validEditor = payload.editor && payload.editor !== 'Unknown' && payload.editor !== 'غير معروف' ? payload.editor : null;
  const existingDesc = payload.description ? payload.description.trim() : null;
  const snippetsText = payload.webSnippets && payload.webSnippets.length > 0 ? payload.webSnippets.join('\n- ') : null;

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
${snippetsText ? `Verified Search Results Background:\n- ${snippetsText}` : ''}

${englishStyles[styleIndex]}

STRICT ANTI-HALLUCINATION & GUIDELINES (INFORMATION FIRST, SEO SECOND):
1. NO HALLUCINATION RULE: Do NOT extrapolate chapters, detailed content, methodology, or historical facts from the book title alone. Do NOT include any detailed fact unless it is explicitly present in the book metadata or directly supported by verified search results.
2. NATIVE ENGLISH PROSE: Write naturally as an English scholarly editor. Avoid translationese, rigid formulas, or marketing tone.
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
${snippetsText ? `نتائج البحث المؤكدة عن الكتاب:\n- ${snippetsText}` : ''}

${arabicStyles[styleIndex]}

قواعد وضوابط كتابة الوصف ومنع الهلوسة (المعلومات أولاً، SEO ثانياً، والتسويق في الحد الأدنى):
1. قاعدة منع الهلوسة القاطعة: «لا تستنتج محتوى أو فصولًا أو منهجًا أو معلومات تاريخية من عنوان الكتاب وحده. لا تضف أي معلومة تفصيلية إلا إذا كانت موجودة في بيانات الكتاب أو مدعومة بنتيجة بحث موثوقة مرتبطة مباشرة بالكتاب.»
2. أسلوب عربي أصيل: اكتب بلغة عربية فصيحة وسليمة وبناء تعبيري متنوع ومستقل، بعيداً عن القوالب الجاهزة أو الصياغات الآلية.
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
 * Generates SEO description for a book using Groq (openai/gpt-oss-120b) with dynamic 4-style rotation, web search enrichment, and strict anti-hallucination rules.
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

  // Perform web search enrichment for the book with strict 3.5s timeout and fallback
  let webSnippets: string[] = [];
  try {
    webSnippets = await fetchWebSnippets(cleanedTitle, author, lang);
  } catch (searchError) {
    console.warn('[Groq Generator] Web search failed, proceeding with metadata:', searchError);
  }

  const prompt = buildGroqDynamicPrompt({
    title: cleanedTitle,
    author,
    category,
    editor,
    description: existingDescription,
    webSnippets,
    lang
  });

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'openai/gpt-oss-120b',
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
