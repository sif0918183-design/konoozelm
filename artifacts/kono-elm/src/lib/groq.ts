import { cleanBookTitle } from './openai';
import { fetchBookOcrSample } from './archive-api';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

let globalStyleCounter = 0;

export interface BookMetadataPayload {
  title: string;
  author?: string;
  category?: string;
  editor?: string;
  description?: string;
  ocrSample?: string;
  webSnippets?: string[];
  lang?: 'ar' | 'en';
}

/**
 * Safely fetches top 2-3 search snippets for the specific book (title + author) with strict relevancy matching and a 3.5s timeout.
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

    // Words from title to verify relevancy
    const titleWords = title.split(/\s+/).filter(w => w.length > 2);

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
        // Verify snippet has at least one significant title word to ensure direct relevancy
        const isRelevant = titleWords.some(w => text.toLowerCase().includes(w.toLowerCase()));
        if (isRelevant) {
          snippets.push(text);
        }
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
  const ocrText = payload.ocrSample ? payload.ocrSample.trim() : null;
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

SOURCE DATA:
- Title: "${payload.title}"
${validAuthor ? `- Author: "${validAuthor}"` : ''}
${validEditor ? `- Editor/Translator: "${validEditor}"` : ''}
${categoryContext ? `- Category: "${categoryContext}"` : ''}
${existingDesc ? `- Original Source Desc: "${existingDesc.substring(0, 300)}"` : ''}
${ocrText ? `- Verified Book Content & Table of Contents:\n"""${ocrText}"""` : ''}
${snippetsText ? `- Web Search Snippets:\n"""${snippetsText}"""` : ''}

${englishStyles[styleIndex]}

STRICT RULES:
1. SOURCE FIDELITY & NO EXTRAPOLATION: Focus strictly on explicit facts in source metadata, description, and headings/TOC. Do NOT invent or infer author objectives, methodology, target audience, speculative conclusions, publication details, or unconfirmed chapters.
2. INTEGRATE TOPICS NATURALLY (NO META/OCR MENTIONS): Incorporate section topics, headings, and table of contents naturally into the prose. Do NOT mention "OCR", "extracted from OCR", "text recognition", "scanned text", or any processing source in the description.
3. NO EVALUATIVE CLAIMS OR MARKETING: Do NOT use phrases like "important reference", "reliable source", "pioneering study", "essential reading", or any site features like "download PDF", "read online", "PDF format". Focus 100% on the textual content of the book.
4. FLEXIBLE LENGTH & ACCURACY: Rich data -> ~150-220 words. Moderate/Limited data -> concise, accurate description (60-100 words). Delete doubtful information.
5. AUTHOR: ${validAuthor ? `Include author "${validAuthor}" naturally.` : `Do NOT mention that author is unknown or missing.`}

JSON format strictly:
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
أنت محرر كتب محترف في مكتبة علمية. مهمتك كتابة وصف دقيق، بليغ، وأصيل لكتاب استناداً إلى الحقائق المصدرية المتاحة حصراً.

المعطيات المصدرية:
- عنوان الكتاب: "${payload.title}"
${validAuthor ? `- المؤلف: "${validAuthor}"` : ''}
${validEditor ? `- المحقق/المترجم: "${validEditor}"` : ''}
${categoryContext ? `- المجال: "${categoryContext}"` : ''}
${existingDesc ? `- الوصف الأصلي: "${existingDesc.substring(0, 300)}"` : ''}
${ocrText ? `- محتوى وفهرس الكتاب:\n"""${ocrText}"""` : ''}
${snippetsText ? `- نتائج الويب المطابقة:\n"""${snippetsText}"""` : ''}

${arabicStyles[styleIndex]}

ضوابط صريحة ومصدرية صارمة:
1. الالتزام الحصري بالمصادر والامتناع عن التخمين: التزم فقط بالحقائق المذكورة صراحة في بيانات الكتاب، أو الوصف الأصلي، أو الفهرس والمحتوى المتاح، أو نتائج الويب. يمنع منعاً باتاً استنتاج أهداف الكتاب، أو منهجه، أو الفئة المستهدفة، أو نتائجه، أو معلومات نشر غير مؤكدة. عند وجود أي معلومة غير مؤكدة يجب حذفها فوراً.
2. استغلال الفهرس والعناوين بأسلوب طبيعي (منع إشارات OCR): استخدم عناوين الأبواب والفصول والفهرس لبسط محتوى الكتاب المعرفي بأسلوب فصيح وطبيعي. يُمنع منعاً باتاً ذكر مصطلحات مثل ("OCR"، "مستخلص من OCR"، "بحسب النص الضوئي"، "النص المستخرج") أو أي إشارة تقنية لطريقة جلب البيانات، بل صَغ الموضوعات كجزء أصيل من محتوى الكتاب.
3. منع الأحكام التقييمية وإشارات الموقع: يمنع منعاً باتاً استخدام عبارات مثل ("مرجع مهم"، "مصدر موثوق"، "دراسة رائدة"، "لا غنى عنه"). كما يُمنع مطلقاً التحدث عن "تحميل PDF"، "قراءة أونلاين"، "تحميل مجاني" أو أي من خصائص الموقع والملفات، فالوصف مخصص لمحتوى الكتاب المعرفي فقط.
4. مرونة الطول والدقة: معلومات غنية -> ~150-220 كلمة؛ معلومات محدودة -> وصف قصير ودقيق (60-100 كلمة). الدقة والتثبت أولوية قصوى.
5. المؤلف: ${validAuthor ? `أدرج اسم المؤلف "${validAuthor}" بأسلوب طبيعي وسلس.` : `لا تذكر مطلقاً أن المؤلف غير معروف أو مفقود، بل ركز الوصف بالكامل على المادة المعرفية.`}

تنسيق JSON حصراً:
{
  "seoTitle": "عنوان SEO هنا",
  "description": "الوصف الكامل هنا"
}
`;
  }
}

/**
 * Generates SEO description for a book using Groq (openai/gpt-oss-120b) with dynamic 4-style rotation, targeted OCR sampling, and cost-optimized prompts.
 */
export async function generateBookDescription(
  title: string,
  author: string,
  lang: 'ar' | 'en' = 'ar',
  category?: string,
  editor?: string,
  existingDescription?: string,
  archiveId?: string
) {
  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not defined');
  }

  const cleanedTitle = cleanBookTitle(title);

  // 1. Fetch OCR text sample from Archive.org if archiveId is available
  let ocrSample: string | undefined;
  if (archiveId) {
    try {
      const ocrResult = await fetchBookOcrSample(archiveId);
      if (ocrResult) ocrSample = ocrResult;
    } catch (ocrErr) {
      console.warn('[Groq Generator] OCR fetch fallback triggered:', ocrErr);
    }
  }

  // 2. Conditional Web Search: only as a fallback if both existing description and OCR sample are sparse
  let webSnippets: string[] = [];
  const needsWebSearch = (!existingDescription || existingDescription.length < 50) && (!ocrSample || ocrSample.length < 100);
  if (needsWebSearch) {
    try {
      webSnippets = await fetchWebSnippets(cleanedTitle, author, lang);
    } catch (searchError) {
      console.warn('[Groq Generator] Web search failed, proceeding with metadata:', searchError);
    }
  }

  const prompt = buildGroqDynamicPrompt({
    title: cleanedTitle,
    author,
    category,
    editor,
    description: existingDescription,
    ocrSample,
    webSnippets,
    lang
  });

  // Call Groq API with automatic retry on Rate Limit (429 / TPM) and OpenAI gpt-4o-mini fallback
  let attempts = 0;
  const maxAttempts = 5;

  while (attempts < maxAttempts) {
    attempts++;
    try {
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

      if (response.status === 429) {
        const errorData = await response.json().catch(() => ({}));
        const retryMsg = errorData.error?.message || '';
        console.warn(`[Groq API Rate Limit] 429 hit on attempt ${attempts}/${maxAttempts}. Msg: ${retryMsg}`);

        if (attempts < maxAttempts) {
          // Parse dynamic wait time from Groq's error message e.g. "Please try again in 3.9375s."
          let waitMs = 4000;
          const match = retryMsg.match(/try again in ([0-9.]+)\s*s/i);
          if (match && match[1]) {
            const parsedSec = parseFloat(match[1]);
            if (!isNaN(parsedSec)) {
              waitMs = Math.ceil(parsedSec * 1000) + 500; // Add 500ms safety buffer
            }
          }
          console.log(`[Groq Rate Limit Backoff] Waiting ${waitMs}ms before retry ${attempts + 1}...`);
          await new Promise(r => setTimeout(r, waitMs));
          continue;
        }
      } else if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Groq API error (${response.status}): ${errorData.error?.message || response.statusText}`);
      } else {
        const data = await response.json();
        const content = JSON.parse(data.choices[0].message.content);
        return content as { seoTitle: string; description: string };
      }
    } catch (err: any) {
      if (attempts >= maxAttempts) {
        console.warn('[Groq Generator] Max Groq retries reached, attempting OpenAI fallback:', err.message);
        break;
      }
    }
  }

  // Fallback to OpenAI gpt-4o-mini if Groq is rate limited or unavailable
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    try {
      console.log('[Groq Generator Fallback] Executing OpenAI gpt-4o-mini fallback...');
      const openAiRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
        }),
      });

      if (openAiRes.ok) {
        const openAiData = await openAiRes.json();
        const content = JSON.parse(openAiData.choices[0].message.content);
        return content as { seoTitle: string; description: string };
      }
    } catch (openAiErr: any) {
      console.error('[Groq Generator Fallback] OpenAI fallback also failed:', openAiErr.message);
    }
  }

  throw new Error('Failed to generate description via Groq API (Rate limit / TPM exhausted) and fallback failed.');
}
