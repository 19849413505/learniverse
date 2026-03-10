import * as mammoth from 'mammoth';
import * as xlsx from 'xlsx';

export type SupportedImportFormat = 'md' | 'txt' | 'docx' | 'xlsx' | 'pdf' | 'image' | 'webpage' | 'unknown';

export interface ImportedDocument {
  title: string;
  content: string; // Markdown format
  sourceType: SupportedImportFormat;
  originalName: string;
}

/**
 * Detects the format based on file extension or mime type
 */
export function detectFormat(file: File): SupportedImportFormat {
  const name = file.name.toLowerCase();
  if (name.endsWith('.md')) return 'md';
  if (name.endsWith('.txt')) return 'txt';
  if (name.endsWith('.docx')) return 'docx';
  if (name.endsWith('.xlsx') || name.endsWith('.xls') || name.endsWith('.csv')) return 'xlsx';
  if (name.endsWith('.pdf')) return 'pdf';
  if (file.type.startsWith('image/')) return 'image';
  return 'unknown';
}

/**
 * Parses a plain text or markdown file.
 */
export async function parseText(file: File): Promise<string> {
  return await file.text();
}

/**
 * Parses a DOCX file using mammoth and returns markdown-ish text.
 */
export async function parseDocx(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

/**
 * Parses an XLSX/CSV file using SheetJS and returns a markdown table format.
 */
export async function parseXlsx(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = xlsx.read(arrayBuffer, { type: 'array' });

  let mdContent = '';
  for (const sheetName of workbook.SheetNames) {
    mdContent += `## Sheet: ${sheetName}\n\n`;
    const worksheet = workbook.Sheets[sheetName];
    // Convert to CSV first
    const csv = xlsx.utils.sheet_to_csv(worksheet);

    // Very basic CSV to Markdown table converter
    const lines = csv.split('\n').filter(line => line.trim());
    if (lines.length > 0) {
      const header = lines[0].split(',');
      mdContent += `| ${header.join(' | ')} |\n`;
      mdContent += `| ${header.map(() => '---').join(' | ')} |\n`;

      for (let i = 1; i < lines.length; i++) {
        mdContent += `| ${lines[i].split(',').join(' | ')} |\n`;
      }
    }
    mdContent += '\n\n';
  }
  return mdContent;
}

/**
 * Parses a PDF file using PDF.js and extracts text.
 */
export async function parsePdf(file: File): Promise<string> {
  // We dynamic import pdfjs so it doesn't break SSR (DOMMatrix is not defined in node)
  const pdfjsLib = await import('pdfjs-dist');
  if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
  }

  const arrayBuffer = await file.arrayBuffer();

  try {
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        // @ts-ignore
        .map(item => item.str)
        .join(' ');

      fullText += `### Page ${i}\n\n${pageText}\n\n`;
    }

    return fullText;
  } catch (err) {
    console.error("PDF Parsing Error", err);
    throw new Error("Failed to parse PDF file.");
  }
}

/**
 * Performs OCR on an image file using Tesseract.js.
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}

export async function parseImage(
  file: File,
  onProgress?: (progress: number) => void,
  ocrEngine: 'tesseract' | 'llm' = 'tesseract',
  apiConfig?: { key: string; baseUrl: string; model: string }
): Promise<string> {
  if (ocrEngine === 'llm' && apiConfig?.key) {
    if (onProgress) onProgress(0.5); // LLMs don't typically have granular progress

    try {
      const base64Image = await fileToBase64(file);
      const isOllama = apiConfig.baseUrl.includes('localhost') || apiConfig.baseUrl.includes('11434');

      const payload = {
        model: apiConfig.model,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "Please extract all the text from this image exactly as it appears. Output only the text, no explanations." },
              { type: "image_url", image_url: { url: base64Image } }
            ]
          }
        ]
      };

      const response = await fetch(`${apiConfig.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiConfig.key}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error?.message || `LLM OCR Error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (err) {
      console.warn("LLM OCR failed, falling back to Tesseract.", err);
      // Fallback to tesseract
    }
  }

  // Tesseract Fallback / Default
  const Tesseract = (await import('tesseract.js')).default;
  const worker = await Tesseract.createWorker('eng+chi_sim', 1, {
    logger: m => {
      if (m.status === 'recognizing text' && onProgress) {
        onProgress(m.progress);
      }
    }
  });

  const imageUrl = URL.createObjectURL(file);
  const { data: { text } } = await worker.recognize(imageUrl);

  await worker.terminate();
  URL.revokeObjectURL(imageUrl);

  return text;
}

/**
 * Fetches a webpage and extracts the main text using Cheerio.
 * Note: Due to CORS, this usually requires a backend proxy in production,
 * but we implement the logic here for when it's available or bypassed.
 */
export async function parseWebpage(url: string): Promise<{title: string, content: string}> {
  try {
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.statusText}`);
    }
    const result = await response.json();
    const html = result.contents;

    // Use Readability and Turndown (like siyuan-chrome logic) for high-quality article extraction
    // Since we might be in the browser or node, we dynamically import jsdom/readability for node,
    // but here we just rely on DOMParser if in browser.

    let articleTitle = url;
    let articleHtml = html;
    let markdown = '';

    if (typeof window !== 'undefined') {
      const { Readability } = await import('@mozilla/readability');
      const TurndownService = (await import('turndown')).default;

      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      const reader = new Readability(doc);
      const article = reader.parse();

      if (article) {
        articleTitle = article.title || url;
        articleHtml = article.content;
      }

      const turndownService = new TurndownService({
        headingStyle: 'atx',
        codeBlockStyle: 'fenced'
      });
      // Additional rules for better markdown (like gfm)
      turndownService.addRule('strikethrough', {
        filter: ['del', 's', 'strike'] as any,
        replacement: function (content) { return '~' + content + '~'; }
      });

      markdown = turndownService.turndown(articleHtml);

    } else {
      // Node fallback (just in case this runs server-side)
      const { JSDOM } = await import('jsdom');
      const { Readability } = await import('@mozilla/readability');
      const TurndownService = (await import('turndown')).default;

      const dom = new JSDOM(html, { url });
      const reader = new Readability(dom.window.document);
      const article = reader.parse();

      if (article) {
        articleTitle = article.title || url;
        articleHtml = article.content;
      }

      const turndownService = new TurndownService({
        headingStyle: 'atx',
        codeBlockStyle: 'fenced'
      });
      markdown = turndownService.turndown(articleHtml);
    }

    return {
      title: articleTitle,
      content: `# ${articleTitle}\n\n[Source](${url})\n\n${markdown}`
    };
  } catch (err: any) {
    console.error("Webpage Fetch Error", err);
    throw new Error(err.message || "Failed to fetch webpage.");
  }
}

/**
 * Main coordinator function to process a file and return normalized Markdown.
 */
export async function processFile(
  file: File,
  onProgress?: (msg: string, progress?: number) => void,
  ocrConfig?: { engine: 'tesseract' | 'llm', key: string; baseUrl: string; model: string }
): Promise<ImportedDocument> {
  const format = detectFormat(file);
  let content = '';

  try {
    switch (format) {
      case 'md':
      case 'txt':
        if (onProgress) onProgress('Reading text file...');
        content = await parseText(file);
        break;
      case 'docx':
        if (onProgress) onProgress('Extracting text from DOCX...');
        content = await parseDocx(file);
        break;
      case 'xlsx':
        if (onProgress) onProgress('Extracting data from Spreadsheet...');
        content = await parseXlsx(file);
        break;
      case 'pdf':
        if (onProgress) onProgress('Extracting text from PDF (this might take a moment)...');
        content = await parsePdf(file);
        break;
      case 'image':
        if (onProgress) onProgress(`Running OCR on image (${ocrConfig?.engine === 'llm' ? 'Online LLM' : 'Offline'})...`);
        content = await parseImage(
          file,
          (p) => { if (onProgress) onProgress(`Running OCR on image...`, p); },
          ocrConfig?.engine,
          ocrConfig
        );
        break;
      default:
        throw new Error(`Unsupported file format: ${file.name}`);
    }

    // Strip extension for title
    const title = file.name.replace(/\.[^/.]+$/, "");

    return {
      title,
      content,
      sourceType: format,
      originalName: file.name
    };
  } catch (error: any) {
    throw new Error(`Failed to process ${file.name}: ${error.message}`);
  }
}