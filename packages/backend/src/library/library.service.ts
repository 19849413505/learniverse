import { Injectable, Logger } from '@nestjs/common';
import * as tesseract from 'tesseract.js';
const pdfParse = require('pdf-parse');

@Injectable()
export class LibraryService {
  private readonly logger = new Logger(LibraryService.name);

  async extractTextFromFile(file: Express.Multer.File): Promise<string> {
    const mimeType = file.mimetype;

    try {
      if (mimeType.includes('pdf')) {
        this.logger.log(`Extracting text from PDF file: ${file.originalname}`);
        const pdfData = await pdfParse(file.buffer);
        return pdfData.text;
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
}
