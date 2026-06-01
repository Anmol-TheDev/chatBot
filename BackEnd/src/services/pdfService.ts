import pdfParse from 'pdf-parse';

export interface PDFParseResult {
  text: string;
  pages: number;
  info: {
    title?: string;
    author?: string;
    subject?: string;
    creator?: string;
    producer?: string;
    creationDate?: Date;
    modificationDate?: Date;
  };
  metadata: {
    wordCount: number;
    characterCount: number;
    pageBreaks: number[];
  };
}

export class PDFService {
  /**
   * Extract text and metadata from PDF buffer
   */
  static async parsePDF(buffer: Buffer): Promise<PDFParseResult> {
    try {
      const data = await pdfParse(buffer);

      // Calculate additional metadata
      const wordCount = PDFService.countWords(data.text);
      const characterCount = data.text.length;
      const pageBreaks = PDFService.findPageBreaks(data.text);

      return {
        text: data.text,
        pages: data.numpages,
        info: {
          title: data.info?.Title,
          author: data.info?.Author,
          subject: data.info?.Subject,
          creator: data.info?.Creator,
          producer: data.info?.Producer,
          creationDate: data.info?.CreationDate ? new Date(data.info.CreationDate) : undefined,
          modificationDate: data.info?.ModDate ? new Date(data.info.ModDate) : undefined
        },
        metadata: {
          wordCount,
          characterCount,
          pageBreaks
        }
      };
    } catch (error) {
      console.error('PDF parsing error:', error);
      throw new Error(`Failed to parse PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract text from specific pages
   */
  static async parsePDFPages(buffer: Buffer, pageNumbers: number[]): Promise<string> {
    try {
      const data = await pdfParse(buffer);
      
      // This is a simplified implementation
      // For more advanced page-specific extraction, you'd need a more sophisticated PDF library
      const pages = data.text.split('\f'); // Form feed character often separates pages
      
      let extractedText = '';
      for (const pageNum of pageNumbers) {
        if (pageNum > 0 && pageNum <= pages.length) {
          extractedText += pages[pageNum - 1] + '\n\n';
        }
      }
      
      return extractedText.trim();
    } catch (error) {
      console.error('PDF page parsing error:', error);
      throw new Error(`Failed to parse PDF pages: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate PDF buffer
   */
  static validatePDF(buffer: Buffer): boolean {
    // Check for PDF signature
    const pdfSignature = buffer.subarray(0, 4);
    return pdfSignature.toString() === '%PDF';
  }

  /**
   * Count words in text
   */
  static countWords(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Find page break positions in text
   */
  static findPageBreaks(text: string): number[] {
    const pageBreaks: number[] = [];
    
    // Look for form feed characters (common page separators)
    for (let i = 0; i < text.length; i++) {
      if (text[i] === '\f') {
        pageBreaks.push(i);
      }
    }
    
    return pageBreaks;
  }

  /**
   * Clean and normalize PDF text
   */
  static cleanPDFText(text: string): string {
    return text
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Remove form feed characters
      .replace(/\f/g, '\n\n')
      // Remove other control characters except newlines and tabs
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      // Normalize line breaks
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      // Remove excessive newlines
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }
}