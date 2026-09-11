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
      `STYLE PERSPECTIVE 1: Direct Subject Synthesis.
Present the factual content directly using the available source metadata and verified background facts.`,
      `STYLE PERSPECTIVE 2: Context & Domain Focus.
Situate the book cleanly within its field based exclusively on the provided metadata.`,
      `STYLE PERSPECTIVE 3: Factual Material Breakdown.
Focus strictly on the verified subject elements without speculative extrapolations.`,
      `STYLE PERSPECTIVE 4: Concise Informative Overview.
Provide a clear, objective summary reflecting only the confirmed source details.`
    ];

    return `
You are a professional scholarly book editor for a digital library catalog. Your objective is to write an authentic, natural, and strictly factual SEO book description based EXCLUSIVELY on the provided source metadata.

SOURCE METADATA:
- Book Title: "${payload.title}"
${validAuthor ? `- Author: "${validAuthor}"` : ''}
${validEditor ? `- Editor/Translator: "${validEditor}"` : ''}
${categoryContext ? `- Category/Field: "${categoryContext}"` : ''}
${existingDesc ? `- Original Source Metadata from Archive.org:\n"""${existingDesc.substring(0, 500)}"""` : ''}
${snippetsText ? `- Verified Search Results Background:\n"""${snippetsText}"""` : ''}

${englishStyles[styleIndex]}

STRICT ANTI-HALLUCINATION & EDITORIAL RULES:
1. STRICT SOURCE GROUNDING & NO EXTRAPOLATION:
   - Base your description strictly on the provided metadata and verified search results above.
   - NEVER extrapolate or speculate the following from the book title or category alone:
     * Specific chapters, sections, or table of contents.
     * The author's specific methodology, objectives, or opinions.
     * Historical context, sources, or theological/juridical schools discussed.
     * Detailed contents not explicitly confirmed in the source text.
2. FLEXIBLE LENGTH & NO FLUFF:
   - Target 150-220 words ONLY when source metadata is rich.
   - If available source information is limited, write a concise, accurate, short summary (60-100 words). Do NOT pad the text with generic filler or false statements to reach 150 words.
3. BANNED CLICHÉS & REPETITIVE FORMULAS:
   - DO NOT use generic boilerplate such as "This book explores...", "Highlights the...", "Offers readers...", "This valuable reference...", "Serves as an essential guide...", "Scientific methodology...", "Written by...".
   - Vary sentence structures and paragraph openers naturally.
4. SEMANTIC SEO & PDF MENTIONS:
   - Incorporate relevant discipline terms naturally from the factual metadata.
   - Mention "PDF download" or "read online" AT MOST ONCE naturally if appropriate. Never make it the focus.
5. UNKNOWN AUTHOR HANDLING:
   - ${validAuthor ? `Include author "${validAuthor}" naturally.` : `Do NOT mention that the author is unknown or omitted. Focus entirely on the confirmed text content.`}
6. SEO TITLE: Suggest a clean, authoritative SEO title suitable for a library catalog entry.

Format response strictly as JSON:
{
  "seoTitle": "SEO Title here",
  "description": "Full description here"
}
`;
  } else {
    const arabicStyles = [
      `طريقة التقديم الأولى: العرض المباشر للحقائق المصدرية.
ابسط المادة العلمية المؤكدة مباشرة استناداً إلى بيانات الكتاب المتاحة والنتائج الموثوقة.`,
      `طريقة التقديم الثانية: التأصيل الموضوعي ضمن المجال.
ضع الكتاب في نطاقه العلمي بأسلوب فصيح يعتمد حصراً على المعلومات الجوهرية المتوفرة.`,
      `طريقة التقديم الثالثة: الإيجاز المعرفي المباشر.
ركز على العرض الموضوعي الدقيق للبيانات المؤكدة دون افتراض أو تخمين.`,
      `طريقة التقديم الرابعة: التركيز السياقي المستند للبيانات.
قدم ملخصاً صادقاً وموضوعياً يعبر عن محتوى السفر بناءً على المعطيات المصدرية فقط.`
    ];

    return `
أنت محرر كتب محترف وموثوق في مكتبة علمية. مهمتك كتابة وصف دقيق، بليغ، وأصيل لكتاب بناءً حصراً على البيانات الحقيقية المتاحة.

المعطيات المصدرية المتاحة:
- عنوان الكتاب: "${payload.title}"
${validAuthor ? `- المؤلف: "${validAuthor}"` : ''}
${validEditor ? `- المحقق/المترجم: "${validEditor}"` : ''}
${categoryContext ? `- المجال/التصنيف: "${categoryContext}"` : ''}
${existingDesc ? `- النص/الوصف الأصلي المتوفر من Archive.org:\n"""${existingDesc.substring(0, 500)}"""` : ''}
${snippetsText ? `- نتائج البحث الموثوقة من الويب المرتبطة بالكتاب:\n"""${snippetsText}"""` : ''}

${arabicStyles[styleIndex]}

قواعد صارمة لمنع التخمين والهلوسة والصياغات الآلية:
1. المصدرية الحصرية والامتناع التام عن التخمين:
   - بيانات Archive.org ونتائج البحث المؤكدة أعلاه هي المصدر الأساسي والوحيد للوصف.
   - يمنع منعاً باتاً استنتاج أو افتراض أي من الآتي من عنوان الكتاب أو تصنيفه وحدهما:
     * أبواب أو فصول أو أجزاء غير مذكورة صراحة.
     * منهج المؤلف أو أهدافه أو آراؤه الخاصة.
     * مصادر الكتاب أو المذاهب والمدارس التي يناقشها.
     * تفاصيل تاريخية أو سياقية لم تثبت في البيانات أعلاه.
   (مثال: إذا كان عنوان الكتاب "مختصر في العقيدة"، فلا تذكر أنه يتناول توحيد الربوبية أو الأسماء والصفات ما لم يكن ذلك مذكوراً صراحة في البيانات أعلاه).

2. مرونة الطول وتجنب الحشو:
   - إذا كانت البيانات المتاحة غنية، استهدف من 150 إلى 220 كلمة.
   - إذا كانت البيانات المتاحة قليلة، اكتب وصفاً قصيراً ومباشراً ودقيقاً (دون إجبار النص على الوصول إلى 150 كلمة بحشو أو كلام إنشائي).

3. التنويع ومنع العبارات المكررة:
   - يمنع استخدام القوالب المتكررة مثل: ("يتناول الكتاب...", "يسلط الضوء...", "يتيح للقارئ...", "يُعد مرجعًا...", "منهجية علمية...", "مرجع لا غنى عنه"، "كنز علمي").
   - نوّع بدايات الجمل وبنية الفقرات بأسلوب عربي فصيح وطبيعي.

4. SEO الدلالي والتنزيل:
   - ادمج المصطلحات العلمية الحقيقية الواردة في المادة بأسلوب طبيعي.
   - لا تجعل "تحميل PDF" أو "قراءة أونلاين" محور الوصف، ويمكن ذكرهما مرة واحدة فقط بأسلوب غير متكلف.

5. اسم المؤلف:
   - ${validAuthor ? `أدرج اسم المؤلف "${validAuthor}" بأسلوب سلس.` : `إذا كان اسم المؤلف غير معروف أو مفقوداً، فلا تذكر مطلقاً أنه غير معروف، بل ركز الوصف بالكامل على المادة المعرفية للكتاب.`}

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
