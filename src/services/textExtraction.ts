import path from 'path';
import { CloudinaryService } from './cloudinaryService.js';
import { PDFService } from './pdfService.js';
import { DOCXService } from './docxService.js';
import { ExcelService } from './excelService.js';

export interface TextChunk {
  content: string;
  wordCount: number;
  startPosition: number;
  endPosition: number;
  pageNumber?: number;
}

export interface ExtractionResult {
  fullText: string;
  chunks: TextChunk[];
  metadata: {
    fileType: string;
    wordCount: number;
    characterCount: number;
    pages?: number;
    sheets?: number;
    processingTime: number;
    extractionMethod: string;
  };
}

export class TextExtractionService {
  /**
   * Extract text from uploaded file and create chunks
   */
  static async extractTextAndChunk(fileUrl: string, fileType: string, originalName: string): Promise<ExtractionResult> {
    const startTime = Date.now();
    
    try {
      const fileExtension = path.extname(originalName).toLowerCase();
      let fullText = '';
      let extractionMethod = 'unknown';
      let additionalMetadata: any = {};
      
      // Download file from Cloudinary
      const buffer = await CloudinaryService.downloadFile(fileUrl);
      
      switch (fileExtension) {
        case '.txt':
        case '.md':
          fullText = buffer.toString('utf-8');
          extractionMethod = 'text-direct';
          break;
          
        case '.pdf':
          const pdfResult = await PDFService.parsePDF(buffer);
          fullText = PDFService.cleanPDFText(pdfResult.text);
          extractionMethod = 'pdf-parse';
          additionalMetadata = {
            pages: pdfResult.pages,
            pdfInfo: pdfResult.info
          };
          break;
          
        case '.doc':
        case '.docx':
          const docxResult = await DOCXService.parseDOCX(buffer);
          fullText = docxResult.text;
          extractionMethod = 'mammoth-docx';
          additionalMetadata = {
            paragraphCount: docxResult.metadata.paragraphCount,
            messages: docxResult.messages
          };
          break;
          
        case '.xls':
        case '.xlsx':
          const excelResult = await ExcelService.parseExcel(buffer);
          fullText = excelResult.text;
          extractionMethod = 'xlsx-parser';
          additionalMetadata = {
            sheets: excelResult.metadata.totalSheets,
            totalRows: excelResult.metadata.totalRows,
            totalCells: excelResult.metadata.totalCells,
            sheetNames: excelResult.sheets.map(s => s.name)
          };
          break;
          
        default:
          fullText = `[Text extraction not supported for file type: ${fileExtension}]`;
          extractionMethod = 'unsupported';
      }

      // Create chunks from the extracted text
      const chunks = this.createTextChunks(fullText);
      const processingTime = Date.now() - startTime;
      
      return {
        fullText,
        chunks,
        metadata: {
          fileType: fileExtension.substring(1),
          wordCount: this.countWords(fullText),
          characterCount: fullText.length,
          processingTime,
          extractionMethod,
          ...additionalMetadata
        }
      };
    } catch (error) {
      console.error('Text extraction error:', error);
      const processingTime = Date.now() - startTime;
      
      return {
        fullText: `[Error extracting text from file: ${originalName}. Error: ${error instanceof Error ? error.message : 'Unknown error'}]`,
        chunks: [],
        metadata: {
          fileType: path.extname(originalName).substring(1),
          wordCount: 0,
          characterCount: 0,
          processingTime,
          extractionMethod: 'error'
        }
      };
    }
  }

  /**
   * Create text chunks from full text
   */
  static createTextChunks(text: string, maxChunkSize: number = 1500): TextChunk[] {
    if (!text || text.trim().length === 0) {
      return [];
    }

    const chunks: TextChunk[] = [];
    const sentences = this.splitIntoSentences(text);
    
    let currentChunk = '';
    let currentPosition = 0;
    let chunkStartPosition = 0;
    
    for (const sentence of sentences) {
      const sentenceWithSpace = sentence + ' ';
      
      // If adding this sentence would exceed the chunk size, save current chunk
      if (currentChunk.length + sentenceWithSpace.length > maxChunkSize && currentChunk.length > 0) {
        chunks.push({
          content: currentChunk.trim(),
          wordCount: this.countWords(currentChunk),
          startPosition: chunkStartPosition,
          endPosition: currentPosition - 1
        });
        
        // Start new chunk
        currentChunk = sentenceWithSpace;
        chunkStartPosition = currentPosition;
      } else {
        currentChunk += sentenceWithSpace;
      }
      
      currentPosition += sentenceWithSpace.length;
    }
    
    // Add the last chunk if it has content
    if (currentChunk.trim().length > 0) {
      chunks.push({
        content: currentChunk.trim(),
        wordCount: this.countWords(currentChunk),
        startPosition: chunkStartPosition,
        endPosition: currentPosition - 1
      });
    }
    
    return chunks;
  }

  /**
   * Split text into sentences
   */
  private static splitIntoSentences(text: string): string[] {
    // Improved sentence splitting with better handling of abbreviations
    return text
      .split(/(?<=[.!?])\s+(?=[A-Z])/)
      .map(sentence => sentence.trim())
      .filter(sentence => sentence.length > 0);
  }

  /**
   * Count words in text
   */
  private static countWords(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }
  
  /**
   * Get file type from file extension
   */
  static getFileType(filename: string): string {
    const extension = path.extname(filename).toLowerCase();
    
    switch (extension) {
      case '.pdf':
        return 'pdf';
      case '.doc':
        return 'doc';
      case '.docx':
        return 'docx';
      case '.txt':
        return 'txt';
      case '.md':
        return 'md';
      case '.xls':
        return 'xls';
      case '.xlsx':
        return 'xlsx';
      default:
        return 'unknown';
    }
  }

  /**
   * Validate file before processing
   */
  static async validateFile(buffer: Buffer, fileType: string): Promise<{
    isValid: boolean;
    error?: string;
  }> {
    try {
      switch (fileType) {
        case 'pdf':
          if (!PDFService.validatePDF(buffer)) {
            return { isValid: false, error: 'Invalid PDF file format' };
          }
          break;
          
        case 'docx':
          if (!DOCXService.validateDOCX(buffer)) {
            return { isValid: false, error: 'Invalid DOCX file format' };
          }
          break;
          
        case 'xlsx':
        case 'xls':
          if (!ExcelService.validateExcel(buffer)) {
            return { isValid: false, error: 'Invalid Excel file format' };
          }
          break;
          
        case 'txt':
        case 'md':
          // Basic text validation
          try {
            buffer.toString('utf-8');
          } catch {
            return { isValid: false, error: 'Invalid text file encoding' };
          }
          break;
      }
      
      return { isValid: true };
    } catch (error) {
      return { 
        isValid: false, 
        error: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }
}