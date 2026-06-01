import { GoogleGenerativeAI } from '@google/generative-ai';
import { geminiConfig } from '../config/env.js';
import QAModel from '../models/QA.js';
import DocumentModel from '../models/Document.js';

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

      // Validate the response to ensure it's using the context
      const validatedAnswer = this.validateAndCleanResponse(answer, documentChunks, qaPairs);

      // Determine confidence based on available context
      const confidence = this.determineConfidence(documentChunks, qaPairs);

      // Extract sources
      const sources = this.extractSources(documentChunks, qaPairs);

      return {
        answer: validatedAnswer,
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
    if (!context.trim()) {
      // If no context is available, be more focused
      return `You are a specialized chatbot assistant. The user asked: "${question}"

You don't have specific information about this topic. Respond politely but stay focused on your role as an information assistant.

Guidelines:
- Don't offer help with random topics you can't actually assist with
- Be polite but direct about your limitations
- Suggest they ask questions related to topics you might have information about
- Keep it brief and professional

Example response: "I don't have information about that topic. I'm designed to help with specific questions based on available information. Is there something else I can help you with?"`;
    }

    return `You are a focused chatbot assistant. Answer the user's question using the information provided below.

${context}

User Question: ${question}

Instructions:
1. Use the provided information to give accurate answers
2. Stay focused on the information you have
3. Don't offer help with topics outside your scope
4. Be helpful but professional
5. If the information is limited, acknowledge it briefly
6. Don't make promises about helping with unrelated topics

Your focused response:`;
  }

  /**
   * Validate and clean the AI response to keep it focused
   */
  private static validateAndCleanResponse(
    answer: string,
    documentChunks: Array<{ content: string; documentName: string; relevanceScore: number }>,
    qaPairs: Array<{ question: string; answer: string; similarity: number }>
  ): string {
    const cleanAnswer = answer.trim();
    
    // Check for overly helpful responses to out-of-context questions
    const overlyHelpfulPhrases = [
      'That sounds cozy',
      'fun facts about',
      'recommendations',
      'I\'m here to help you with any questions',
      'just let me know how I can assist',
      'sleepwear recommendations',
      'anything else today'
    ];

    const isOverlyHelpful = overlyHelpfulPhrases.some(phrase => 
      cleanAnswer.toLowerCase().includes(phrase.toLowerCase())
    );

    // If it's being overly helpful with out-of-context topics and we have no relevant context
    if (isOverlyHelpful && documentChunks.length === 0 && qaPairs.length === 0) {
      return "I don't have specific information about that topic. I'm designed to help with questions based on available information. Is there something else I can help you with?";
    }

    // Remove technical and document-related phrases
    const technicalPhrases = [
      'Based on the provided knowledge base (Q1/A1)',
      'According to the context above',
      'From the Q&A pairs',
      'The knowledge base indicates',
      'Based on the document chunks',
      'you can upload documents',
      'upload a document',
      'upload some documents',
      'upload relevant documents',
      'if you upload',
      'document you\'d like to get started with',
      'Let me know if you have a document'
    ];

    let naturalAnswer = cleanAnswer;

    // Replace or remove technical phrases
    technicalPhrases.forEach(phrase => {
      const regex = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      naturalAnswer = naturalAnswer.replace(regex, '');
    });

    // Remove references to Q1/A1, Q2/A2, etc.
    naturalAnswer = naturalAnswer.replace(/\(Q\d+\/A\d+\)/g, '');
    naturalAnswer = naturalAnswer.replace(/Q\d+\/A\d+[,\s]*/g, '');

    // Clean up overly helpful phrases
    naturalAnswer = naturalAnswer.replace(/That sounds cozy\./gi, '');
    naturalAnswer = naturalAnswer.replace(/fun facts about.*?,/gi, '');
    naturalAnswer = naturalAnswer.replace(/recommendations.*?,/gi, '');
    naturalAnswer = naturalAnswer.replace(/just let me know how I can assist you!/gi, '');

    // Check for generic Gemini responses
    const genericResponses = [
      'I am Gemini',
      'I am a large language model',
      'created by Google',
      'How can I help you today',
      'I\'m designed to be a helpful assistant'
    ];

    const isGenericResponse = genericResponses.some(phrase => 
      naturalAnswer.toLowerCase().includes(phrase.toLowerCase())
    );

    if (isGenericResponse) {
      return "I'm designed to help with specific questions based on available information. What can I help you with?";
    }

    // Clean up any remaining technical language
    naturalAnswer = naturalAnswer.replace(/knowledge base/gi, 'available information');
    naturalAnswer = naturalAnswer.replace(/based on the context/gi, 'from what I know');
    naturalAnswer = naturalAnswer.replace(/document-based question answering/gi, 'answering questions');

    // Remove extra whitespace and clean up
    naturalAnswer = naturalAnswer.replace(/\s+/g, ' ').trim();
    
    // If the answer is too short or empty after cleaning, provide a focused fallback
    if (naturalAnswer.length < 20) {
      if (documentChunks.length > 0 || qaPairs.length > 0) {
        return "I can help answer questions based on available information. What would you like to know?";
      } else {
        return "I don't have specific information about that topic. Is there something else I can help you with?";
      }
    }

    return naturalAnswer;
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
   * Get sample questions from available data (prioritizing DB questions)
   */
  private static async getSampleQuestions(limit: number = 5): Promise<string[]> {
    try {
      const sampleQuestions: string[] = [];

      // PRIORITY 1: Get actual questions from Q&A database (most important)
      const qaQuestions = await QAModel.find()
        .select('question')
        .limit(limit) // Get up to the full limit from Q&A
        .sort({ createdAt: -1 });

      // Add all available Q&A questions first
      qaQuestions.forEach(qa => {
        sampleQuestions.push(qa.question);
      });

      // PRIORITY 2: Only if we don't have enough Q&A questions, add document-based questions
      if (sampleQuestions.length < limit) {
        const remainingSlots = limit - sampleQuestions.length;
        const documents = await DocumentModel.find()
          .select('fileName')
          .limit(remainingSlots)
          .sort({ uploadedAt: -1 });

        documents.forEach(doc => {
          if (sampleQuestions.length < limit) {
            const fileName = doc.fileName.replace(/\.[^/.]+$/, ""); // Remove extension
            sampleQuestions.push(`What is ${fileName} about?`);
          }
        });
      }

      // PRIORITY 3: Only if we still don't have enough, add generic questions
      if (sampleQuestions.length < limit) {
        const genericQuestions = [
          "What information do you have available?",
          "What topics can you help me with?",
          "What documents have been uploaded?",
          "Can you summarize the available information?",
          "What questions can I ask you?"
        ];

        genericQuestions.forEach(q => {
          if (sampleQuestions.length < limit && !sampleQuestions.includes(q)) {
            sampleQuestions.push(q);
          }
        });
      }

      return sampleQuestions.slice(0, limit);
    } catch (error) {
      console.error('Error getting sample questions:', error);
      return [
        "What information do you have available?",
        "What topics can you help me with?",
        "What can I ask you about?"
      ];
    }
  }

  /**
   * Generate a simple response without context (fallback)
   */
  static async generateSimpleResponse(question: string): Promise<string> {
    if (!this.initialize()) {
      throw new Error('Gemini AI is not configured');
    }

    try {
      // Return a clean response without embedded questions
      return "I don't have specific information about that topic. You can try asking one of the suggested questions below.";
    } catch (error: any) {
      console.error('Gemini simple response error:', error);
      return "I don't have information about that topic. Please try one of the suggested questions.";
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