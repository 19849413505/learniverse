import { Injectable, Logger } from '@nestjs/common';
import * as tesseract from 'tesseract.js';
const ePub = require('epubjs');
const TurndownService = require('turndown');
import { JSDOM } from 'jsdom';

const pdfParse = require('pdf-parse');

@Injectable()
export class LibraryService {
  private readonly logger = new Logger(LibraryService.name);
  private turndownService: any;

  constructor() {
    this.turndownService = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
    });

    // Custom rule to retain LaTeX / MathML environments if present in EPUB/HTML
    this.turndownService.addRule('math', {
      filter: (node: any) => {
        // match nodes that look like equations, math-tex, or have katex classes
        const hasMathTag = node.nodeName.toLowerCase() === 'math';
        const hasMathClass = node.className && typeof node.className === 'string' &&
                             (node.className.includes('math') || node.className.includes('katex'));
        const hasTexAttribute = node.hasAttribute && node.hasAttribute('data-tex');
        return hasMathTag || hasMathClass || hasTexAttribute;
      },
      replacement: (content: any, node: any) => {
         // Try to extract original TeX source if provided via attributes
         const texSource = node.getAttribute('data-tex') || node.getAttribute('alt') || node.textContent;
         // Heuristics: if it's block display (div), use $$, if inline (span), use $
         const isBlock = node.nodeName.toLowerCase() === 'div' ||
                        (node.style && node.style.display === 'block') ||
                        (node.hasAttribute('display') && node.getAttribute('display') === 'block');

         if (isBlock) {
            return `\n$$\n${texSource.trim()}\n$$\n`;
         }
         return `$${texSource.trim()}$`;
      }
    });
  }

  async extractTextFromFile(file: Express.Multer.File): Promise<string> {
    const mimeType = file.mimetype;
    const extension = file.originalname.split('.').pop()?.toLowerCase();

    try {
      if (mimeType.includes('pdf') || extension === 'pdf') {
        this.logger.log(`Extracting text from PDF file: ${file.originalname}`);
        const pdfData = await pdfParse(file.buffer);
        // We rely on standard text extraction for PDF.
        // Note: Raw PDF parsing won't automatically wrap inline formulas with $,
        // but it will extract LaTeX source code if the PDF was generated with embedded source,
        // or just the raw math characters. For advanced PDF layout parsing with true math detection,
        // specialized deep learning layout models are needed. This provides MVP extraction.
        return pdfData.text;
      }

      if (mimeType.includes('epub') || extension === 'epub') {
        this.logger.log(`Extracting text and Markdown from EPUB file: ${file.originalname}`);
        return await this.extractEpub(file.buffer);
      }

      if (mimeType.includes('image')) {
        this.logger.log(`Running OCR on image file: ${file.originalname}`);
        const { data: { text } } = await tesseract.recognize(file.buffer, 'eng+chi_sim', {
          logger: m => this.logger.debug(m),
        });
        return text;
      }

      // Default fallback for txt files or unsupported
      this.logger.log(`Returning raw buffer as text for: ${file.originalname}`);
      return file.buffer.toString('utf-8');

    } catch (error: any) {
      this.logger.error(`Failed to extract text from ${file.originalname}`, error);
      throw new Error(`Failed to extract text from file: ${error?.message || error}`);
    }
  }

  private async extractEpub(buffer: Buffer): Promise<string> {
    try {
      const book = ePub(buffer.buffer as ArrayBuffer);
      await book.ready;

      let fullMarkdown = '';

      // Iterate through the spine (the reading order of the book)
      for (const item of book.spine.spineItems) {
        try {
           const chapter = await item.load(book.load.bind(book));

           if (!chapter) continue;

           // Parse the HTML content from the epub chapter
           const dom = new JSDOM(chapter.textContent || chapter.innerHTML || '');
           const document = dom.window.document;

           // Remove script, style, head, and other non-content tags
           const elementsToRemove = document.querySelectorAll('script, style, head, nav, footer, iframe, object');
           elementsToRemove.forEach(el => el.remove());

           const bodyContent = document.body.innerHTML;
           if (!bodyContent.trim()) continue;

           // Convert parsed HTML into clean Markdown preserving structure and our custom Math/LaTeX rules
           const markdown = this.turndownService.turndown(bodyContent);
           fullMarkdown += markdown + '\n\n---\n\n';

        } catch (chapterErr) {
           this.logger.warn(`Could not parse EPUB chapter: ${item.idref}`, chapterErr);
        }
      }

      return fullMarkdown.trim() || 'No text content could be extracted from this EPUB.';

    } catch (error) {
      this.logger.error('EPUB Parsing Error', error);
      throw new Error('Failed to parse EPUB file.');
    }
  }
}
