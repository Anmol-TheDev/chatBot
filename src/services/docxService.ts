import mammoth from 'mammoth';

export interface DOCXParseResult {
  text: string;
  html: string;
  metadata: {
    wordCount: number;
    characterCount: number;
    paragraphCount: number;
  };
  messages: string[];
}

export class DOCXService {
  /**
   * Extract text and metadata from DOCX buffer
   */
  static async parseDOCX(buffer: Buffer): Promise<DOCXParseResult> {
    try {
      // Extract plain text
      const textResult = await mammoth.extractRawText({ buffer });
      
      // Extract HTML (useful for preserving some formatting)
      const htmlResult = await mammoth.convertToHtml({ buffer });

      // Calculate metadata
      const wordCount = this.countWords(textResult.value);
      const characterCount = textResult.value.length;
      const paragraphCount = this.countParagraphs(textResult.value);

      // Combine messages from both extractions
      const allMessages = [
        ...textResult.messages.map(m => `Text: ${m.message}`),
        ...htmlResult.messages.map(m => `HTML: ${m.message}`)
      ];

      return {
        text: this.cleanDOCXText(textResult.value),
        html: htmlResult.value,
        metadata: {
          wordCount,
          characterCount,
          paragraphCount
        },
        messages: allMessages
      };
    } catch (error) {
      console.error('DOCX parsing error:', error);
      throw new Error(`Failed to parse DOCX: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract text with custom style mapping
   */
  static async parseDOCXWithStyles(buffer: Buffer): Promise<DOCXParseResult> {
    try {
      const options = {
        styleMap: [
          // Map heading styles
          "p[style-name='Heading 1'] => h1:fresh",
          "p[style-name='Heading 2'] => h2:fresh",
          "p[style-name='Heading 3'] => h3:fresh",
          // Map other styles
          "p[style-name='Quote'] => blockquote:fresh",
          "p[style-name='Code'] => pre:fresh"
        ]
      };

      const textResult = await mammoth.extractRawText({ buffer });
      const htmlResult = await mammoth.convertToHtml({ buffer, ...options });

      const wordCount = this.countWords(textResult.value);
      const characterCount = textResult.value.length;
      const paragraphCount = this.countParagraphs(textResult.value);

      return {
        text: this.cleanDOCXText(textResult.value),
        html: htmlResult.value,
        metadata: {
          wordCount,
          characterCount,
          paragraphCount
        },
        messages: [
          ...textResult.messages.map(m => `Text: ${m.message}`),
          ...htmlResult.messages.map(m => `HTML: ${m.message}`)
        ]
      };
    } catch (error) {
      console.error('DOCX with styles parsing error:', error);
      throw new Error(`Failed to parse DOCX with styles: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract only images from DOCX
   */
  static async extractDOCXImages(buffer: Buffer): Promise<Array<{
    contentType: string;
    buffer: Buffer;
  }>> {
    try {
      const result = await mammoth.images.imgElement(img => {
        return img.read("base64").then(imageBuffer => {
          return {
            src: `data:${img.contentType};base64,${imageBuffer}`,
            contentType: img.contentType,
            buffer: Buffer.from(imageBuffer, 'base64')
          };
        });
      });

      // This is a simplified approach - mammoth's image handling is more complex
      return [];
    } catch (error) {
      console.error('DOCX image extraction error:', error);
      return [];
    }
  }

  /**
   * Validate DOCX buffer
   */
  static validateDOCX(buffer: Buffer): boolean {
    // DOCX files are ZIP archives, check for ZIP signature
    const zipSignature = buffer.subarray(0, 4);
    return zipSignature[0] === 0x50 && zipSignature[1] === 0x4B && 
           (zipSignature[2] === 0x03 || zipSignature[2] === 0x05 || zipSignature[2] === 0x07);
  }

  /**
   * Count words in text
   */
  private static countWords(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Count paragraphs in text
   */
  private static countParagraphs(text: string): number {
    return text.split(/\n\s*\n/).filter(para => para.trim().length > 0).length;
  }

  /**
   * Clean and normalize DOCX text
   */
  static cleanDOCXText(text: string): string {
    return text
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Normalize line breaks
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      // Remove excessive newlines
      .replace(/\n{3,}/g, '\n\n')
      // Remove control characters
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      .trim();
  }

  /**
   * Extract headings from DOCX text
   */
  static extractHeadings(html: string): Array<{
    level: number;
    text: string;
    position: number;
  }> {
    const headings: Array<{ level: number; text: string; position: number }> = [];
    const headingRegex = /<h([1-6])[^>]*>(.*?)<\/h[1-6]>/gi;
    let match;
    
    while ((match = headingRegex.exec(html)) !== null) {
      headings.push({
        level: parseInt(match[1]),
        text: match[2].replace(/<[^>]*>/g, '').trim(),
        position: match.index
      });
    }
    
    return headings;
  }
}