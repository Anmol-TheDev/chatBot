import * as XLSX from 'xlsx';

export interface ExcelParseResult {
  text: string;
  sheets: Array<{
    name: string;
    data: any[][];
    text: string;
    rowCount: number;
    columnCount: number;
  }>;
  metadata: {
    totalSheets: number;
    totalRows: number;
    totalCells: number;
    wordCount: number;
  };
}

export class ExcelService {
  /**
   * Extract text and data from Excel buffer
   */
  static async parseExcel(buffer: Buffer): Promise<ExcelParseResult> {
    try {
      // Read the workbook
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      
      const sheets: ExcelParseResult['sheets'] = [];
      let totalText = '';
      let totalRows = 0;
      let totalCells = 0;

      // Process each sheet
      for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        
        if (!worksheet) {
          console.warn(`Worksheet "${sheetName}" not found`);
          continue;
        }
        
        // Convert sheet to array of arrays
        const sheetData = XLSX.utils.sheet_to_json(worksheet, { 
          header: 1,
          defval: '',
          raw: false // Get formatted values as strings
        }) as any[][];

        // Extract text from sheet
        const sheetText = this.extractTextFromSheetData(sheetData);
        
        // Calculate sheet statistics
        const rowCount = sheetData.length;
        const columnCount = Math.max(...sheetData.map(row => row.length), 0);
        const cellCount = sheetData.reduce((sum, row) => sum + row.filter(cell => cell !== '').length, 0);

        sheets.push({
          name: sheetName,
          data: sheetData,
          text: sheetText,
          rowCount,
          columnCount
        });

        totalText += `\n\n=== Sheet: ${sheetName} ===\n${sheetText}`;
        totalRows += rowCount;
        totalCells += cellCount;
      }

      const wordCount = this.countWords(totalText);

      return {
        text: this.cleanExcelText(totalText),
        sheets,
        metadata: {
          totalSheets: workbook.SheetNames.length,
          totalRows,
          totalCells,
          wordCount
        }
      };
    } catch (error) {
      console.error('Excel parsing error:', error);
      throw new Error(`Failed to parse Excel: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Parse specific sheets from Excel
   */
  static async parseExcelSheets(buffer: Buffer, sheetNames: string[]): Promise<ExcelParseResult> {
    try {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      
      const sheets: ExcelParseResult['sheets'] = [];
      let totalText = '';
      let totalRows = 0;
      let totalCells = 0;

      // Process only specified sheets
      for (const sheetName of sheetNames) {
        if (!workbook.SheetNames.includes(sheetName)) {
          console.warn(`Sheet "${sheetName}" not found in workbook`);
          continue;
        }

        const worksheet = workbook.Sheets[sheetName];
        
        if (!worksheet) {
          console.warn(`Worksheet "${sheetName}" not found`);
          continue;
        }
        
        const sheetData = XLSX.utils.sheet_to_json(worksheet, { 
          header: 1,
          defval: '',
          raw: false
        }) as any[][];

        const sheetText = this.extractTextFromSheetData(sheetData);
        const rowCount = sheetData.length;
        const columnCount = Math.max(...sheetData.map(row => row.length), 0);
        const cellCount = sheetData.reduce((sum, row) => sum + row.filter(cell => cell !== '').length, 0);

        sheets.push({
          name: sheetName,
          data: sheetData,
          text: sheetText,
          rowCount,
          columnCount
        });

        totalText += `\n\n=== Sheet: ${sheetName} ===\n${sheetText}`;
        totalRows += rowCount;
        totalCells += cellCount;
      }

      const wordCount = this.countWords(totalText);

      return {
        text: this.cleanExcelText(totalText),
        sheets,
        metadata: {
          totalSheets: sheets.length,
          totalRows,
          totalCells,
          wordCount
        }
      };
    } catch (error) {
      console.error('Excel sheets parsing error:', error);
      throw new Error(`Failed to parse Excel sheets: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Convert Excel to CSV format
   */
  static async excelToCSV(buffer: Buffer, sheetName?: string): Promise<string> {
    try {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      
      // Use first sheet if no sheet name specified
      const targetSheet = sheetName || workbook.SheetNames[0];
      
      if (!targetSheet || !workbook.Sheets[targetSheet]) {
        throw new Error(`Sheet "${targetSheet}" not found`);
      }

      const worksheet = workbook.Sheets[targetSheet];
      return XLSX.utils.sheet_to_csv(worksheet);
    } catch (error) {
      console.error('Excel to CSV conversion error:', error);
      throw new Error(`Failed to convert Excel to CSV: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate Excel buffer
   */
  static validateExcel(buffer: Buffer): boolean {
    try {
      // Try to read the buffer as an Excel file
      XLSX.read(buffer, { type: 'buffer' });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Extract text from sheet data array
   */
  private static extractTextFromSheetData(sheetData: any[][]): string {
    const textLines: string[] = [];
    
    for (const row of sheetData) {
      const rowText = row
        .filter(cell => cell !== null && cell !== undefined && cell !== '')
        .map(cell => String(cell).trim())
        .join(' | ');
      
      if (rowText) {
        textLines.push(rowText);
      }
    }
    
    return textLines.join('\n');
  }

  /**
   * Count words in text
   */
  private static countWords(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Clean and normalize Excel text
   */
  static cleanExcelText(text: string): string {
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
   * Get Excel file info
   */
  static getExcelInfo(buffer: Buffer): {
    sheetNames: string[];
    totalSheets: number;
    fileSize: number;
  } {
    try {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      
      return {
        sheetNames: workbook.SheetNames,
        totalSheets: workbook.SheetNames.length,
        fileSize: buffer.length
      };
    } catch (error) {
      console.error('Excel info extraction error:', error);
      throw new Error(`Failed to get Excel info: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}