import { GoogleGenerativeAI } from '@google/generative-ai';
import { geminiConfig } from '../config/env.js';

export interface GeminiResponse {
  answer: string;
  confidence: 'high' | 'medium' | 'low';
  sources: string[];
}

export class GeminiService {
  private static genAI: GoogleGenerativeAI | null = null;
  private static model: any = null;

  /**
   * Initialize Gemini AI with fallback models
   */
  private static initialize(): boolean {
    if (!geminiConfig.GEMINI_API_KEY) {
      console.warn('⚠️  Gemini API key not configured');
      return false;
    }

    if (!this.genAI) {
      this.genAI = new GoogleGenerativeAI(geminiConfig.GEMINI_API_KEY);
      // Use gemini-3.5-flash as the primary model
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });
    }

    return true;
  }

  /**
   * Check if Gemini is configured and available
   */
  static isAvailable(): boolean {
    return !!geminiConfig.GEMINI_API_KEY;
  }

  static async generateAnswer(
    question: string,
    documentChunks: Array<{ content: string; documentName: string; relevanceScore: number }>,
    qaPairs: Array<{ question: string; answer: string; similarity: number }>
  ): Promise<GeminiResponse> {
    if (!this.initialize()) {
      throw new Error('Gemini AI is not configured. Please add GEMINI_API_KEY to your environment variables.');
    }

    try {
      // Build context from available information
      const context = this.buildContext(documentChunks, qaPairs);
      
      // Create the prompt
      const prompt = this.createPrompt(question, context);

      // Generate response with retry logic
      let result;
      try {
        result = await this.model.generateContent(prompt);
      } catch (error: any) {
        // If the current model fails, try with fallback models
        if (error.status === 404) {
          console.log('Primary model (gemini-3.5-flash) failed, trying fallback models...');
          
          // Try gemini-1.5-flash first
          try {
            this.model = this.genAI!.getGenerativeModel({ model: 'gemini-1.5-flash' });
            result = await this.model.generateContent(prompt);
          } catch (fallbackError: any) {
            // If that fails, try gemini-pro
            console.log('gemini-1.5-flash failed, trying gemini-pro...');
            this.model = this.genAI!.getGenerativeModel({ model: 'gemini-pro' });
            result = await this.model.generateContent(prompt);
          }
        } else {
          throw error;
        }
      }

      const response = await result.response;
      const answer = response.text();

      // Determine confidence based on available context
      const confidence = this.determineConfidence(documentChunks, qaPairs);

      // Extract sources
      const sources = this.extractSources(documentChunks, qaPairs);

      return {
        answer: answer.trim(),
        confidence,
        sources
      };
    } catch (error: any) {
      console.error('Gemini AI error:', error);
      const errorMessage = error.message || 'Unknown error';
      const statusInfo = error.status ? ` (Status: ${error.status})` : '';
      throw new Error(`Failed to generate AI response: ${errorMessage}${statusInfo}`);
    }
  }

  /**
   * Build context string from document chunks and Q&A pairs
   */
  private static buildContext(
    documentChunks: Array<{ content: string; documentName: string; relevanceScore: number }>,
    qaPairs: Array<{ question: string; answer: string; similarity: number }>
  ): string {
    let context = '';

    // Add Q&A pairs context
    if (qaPairs.length > 0) {
      context += '## Existing Q&A Knowledge Base:\n\n';
      qaPairs.forEach((qa, index) => {
        context += `Q${index + 1}: ${qa.question}\n`;
        context += `A${index + 1}: ${qa.answer}\n\n`;
      });
    }

    // Add document chunks context
    if (documentChunks.length > 0) {
      context += '## Relevant Document Content:\n\n';
      documentChunks.forEach((chunk, index) => {
        context += `Document: ${chunk.documentName}\n`;
        context += `Content: ${chunk.content}\n\n`;
      });
    }

    return context;
  }

  /**
   * Create a comprehensive prompt for Gemini
   */
  private static createPrompt(question: string, context: string): string {
    return `You are an intelligent assistant helping users find answers based on a knowledge base of documents and Q&A pairs.

${context}

## User Question:
${question}

## Instructions:
1. Analyze the provided context carefully
2. If you find relevant information in the context, provide a comprehensive answer based on that information
3. If the context doesn't contain enough information, clearly state what information is missing
4. Be accurate and cite which sources you're using (Q&A pairs or specific documents)
5. If you're uncertain about something, express that uncertainty
6. Keep your answer concise but complete
7. Use a helpful and professional tone

## Your Response:`;
  }

  /**
   * Determine confidence level based on available context
   */
  private static determineConfidence(
    documentChunks: Array<{ content: string; documentName: string; relevanceScore: number }>,
    qaPairs: Array<{ question: string; answer: string; similarity: number }>
  ): 'high' | 'medium' | 'low' {
    // High confidence if we have exact Q&A matches
    if (qaPairs.length > 0 && qaPairs[0] && qaPairs[0].similarity > 0.8) {
      return 'high';
    }

    // Medium confidence if we have good document matches
    if (documentChunks.length > 2 || (documentChunks.length > 0 && documentChunks[0] && documentChunks[0].relevanceScore > 0.7)) {
      return 'medium';
    }

    // Low confidence if we have limited context
    return 'low';
  }

  /**
   * Extract source names from context
   */
  private static extractSources(
    documentChunks: Array<{ content: string; documentName: string; relevanceScore: number }>,
    qaPairs: Array<{ question: string; answer: string; similarity: number }>
  ): string[] {
    const sources: string[] = [];

    // Add Q&A sources
    if (qaPairs.length > 0) {
      sources.push('Knowledge Base Q&A');
    }

    // Add document sources
    const documentNames = [...new Set(documentChunks.map(chunk => chunk.documentName))];
    sources.push(...documentNames);

    return sources;
  }

  /**
   * Generate a simple response without context (fallback)
   */
  static async generateSimpleResponse(question: string): Promise<string> {
    if (!this.initialize()) {
      throw new Error('Gemini AI is not configured');
    }

    try {
      const prompt = `Please provide a helpful response to this question: ${question}

Note: This response is generated without access to specific documents or knowledge base. For more accurate answers, please ensure relevant documents are uploaded to the system.`;

      let result;
      try {
        result = await this.model.generateContent(prompt);
      } catch (error: any) {
        // If the current model fails, try with fallback models
        if (error.status === 404) {
          console.log('Primary model (gemini-3.5-flash) failed for simple response, trying fallback models...');
          
          // Try gemini-1.5-flash first
          try {
            this.model = this.genAI!.getGenerativeModel({ model: 'gemini-1.5-flash' });
            result = await this.model.generateContent(prompt);
          } catch (fallbackError: any) {
            // If that fails, try gemini-pro
            console.log('gemini-1.5-flash failed, trying gemini-pro...');
            this.model = this.genAI!.getGenerativeModel({ model: 'gemini-pro' });
            result = await this.model.generateContent(prompt);
          }
        } else {
          throw error;
        }
      }

      const response = await result.response;
      return response.text().trim();
    } catch (error: any) {
      console.error('Gemini simple response error:', error);
      const errorMessage = error.message || 'Unknown error';
      const statusInfo = error.status ? ` (Status: ${error.status})` : '';
      throw new Error(`Failed to generate AI response: ${errorMessage}${statusInfo}`);
    }
  }

  /**
   * Test Gemini connection
   */
  static async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.initialize()) {
      return {
        success: false,
        message: 'Gemini API key not configured'
      };
    }

    try {
      // Test with a simple generation
      const result = await this.model.generateContent('Hello, please respond with "Connection successful"');
      const response = await result.response;
      const text = response.text();
      
      return {
        success: true,
        message: `Gemini AI connected successfully with gemini-3.5-flash. Response: ${text.substring(0, 100)}...`
      };
    } catch (error: any) {
      // If gemini-3.5-flash fails, try with gemini-1.5-flash
      if (error.status === 404) {
        try {
          console.log('Trying alternative model: gemini-1.5-flash');
          this.model = this.genAI!.getGenerativeModel({ model: 'gemini-1.5-flash' });
          const result = await this.model.generateContent('Hello, please respond with "Connection successful"');
          const response = await result.response;
          const text = response.text();
          
          return {
            success: true,
            message: `Gemini AI connected with gemini-1.5-flash. Response: ${text.substring(0, 100)}...`
          };
        } catch (fallbackError: any) {
          // Try gemini-pro as final fallback
          try {
            console.log('Trying final fallback model: gemini-pro');
            this.model = this.genAI!.getGenerativeModel({ model: 'gemini-pro' });
            const result = await this.model.generateContent('Hello, please respond with "Connection successful"');
            const response = await result.response;
            const text = response.text();
            
            return {
              success: true,
              message: `Gemini AI connected with gemini-pro. Response: ${text.substring(0, 100)}...`
            };
          } catch (finalError) {
            console.error('All fallback models failed:', finalError);
          }
        }
      }

      return {
        success: false,
        message: `Gemini connection failed: ${error.message || 'Unknown error'}. Status: ${error.status || 'N/A'}`
      };
    }
  }
}