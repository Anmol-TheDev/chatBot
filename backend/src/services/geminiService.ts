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
      // Use gemini-3.1-flash-lite as the primary model (most stable and available)
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite' });
    }

    return true;
  }

  /**
   * Check if Gemini is configured and available
   */
  static isAvailable(): boolean {
    return !!geminiConfig.GEMINI_API_KEY;
  }

  static async generateAnswerStream(
    question: string,
    documentChunks: Array<{ content: string; documentName: string; relevanceScore: number }>,
    qaPairs: Array<{ question: string; answer: string; similarity: number }>,
    onToken: (text: string) => void
  ): Promise<{ confidence: 'high' | 'medium' | 'low'; sources: string[] }> {
    if (!this.initialize()) {
      throw new Error('Gemini AI is not configured. Please add GEMINI_API_KEY to your environment variables.');
    }

    try {
      // Build context from available information
      const context = this.buildContext(documentChunks, qaPairs);
      
      // Create the prompt
      const prompt = this.createPrompt(question, context);

      // Try multiple models in sequence with better error handling
      const modelsToTry = ['gemini-3.1-flash-lite', 'gemini-2.5-flash', 'gemini-2.5-flash-lite'];
      let result;
      let successfulModel = null;

      for (const modelName of modelsToTry) {
        try {
          console.log(`Attempting to use model: ${modelName}`);
          this.model = this.genAI!.getGenerativeModel({ model: modelName });
          result = await this.model.generateContentStream(prompt);
          successfulModel = modelName;
          console.log(`Successfully connected to ${modelName}`);
          break;
        } catch (error: any) {
          console.error(`Model ${modelName} failed:`, error.message, `(Status: ${error.status || 'N/A'})`);
          
          // If it's the last model, throw the error
          if (modelName === modelsToTry[modelsToTry.length - 1]) {
            throw new Error(`All Gemini models failed. Last error: ${error.message} (Status: ${error.status || 'N/A'})`);
          }
          // Otherwise, continue to next model
        }
      }

      if (!result) {
        throw new Error('Failed to generate response from any available model');
      }

      // Stream the response
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        onToken(chunkText);
      }

      // Determine confidence based on available context
      const confidence = this.determineConfidence(documentChunks, qaPairs);

      // Extract sources
      const sources = this.extractSources(documentChunks, qaPairs);

      return {
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
      // If no context is available, provide a helpful but focused response
      return `You are a helpful chatbot assistant for a document-based Q&A system. The user asked: "${question}"

Currently, you don't have any documents or Q&A pairs in your knowledge base to answer this question.

Provide a brief, helpful response (2-3 sentences max) that:
1. Politely acknowledges you don't have information about this specific topic
2. Explains that you can answer questions once documents are uploaded or Q&A pairs are added
3. Stays professional and encouraging

Do NOT:
- Offer to help with unrelated topics
- Make up information
- Be overly chatty or offer services you can't provide
- Include phrases like "fun facts" or "recommendations"

Your response:`;
    }

    return `You are a focused chatbot assistant. Answer the user's question using ONLY the information provided below.

${context}

User Question: ${question}

Instructions:
1. Answer based ONLY on the provided information
2. Be direct and concise
3. If the information doesn't fully answer the question, acknowledge the limitation briefly
4. Do NOT mention "Q1/A1", "knowledge base", "document chunks", or technical terms
5. Write naturally as if you're having a conversation
6. Do NOT offer help with unrelated topics
7. Keep your response focused and under 4 sentences unless more detail is needed

Your response:`;
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
   * Generate a simple response without context (fallback)
   */
  static async generateSimpleResponse(question: string): Promise<string> {
    if (!this.initialize()) {
      throw new Error('Gemini AI is not configured');
    }

    const prompt = `You are a helpful chatbot assistant for a document Q&A system. The user said: "${question}"

You currently don't have any documents or Q&A pairs in your knowledge base.

Provide a brief, friendly response (1-2 sentences max) that:
1. Greets the user if they're saying hello/hi
2. Briefly mentions you can help answer questions once documents are uploaded
3. Keep it natural and conversational

Examples:
- For "hello": "Hello! I'm here to help answer questions. Once you upload some documents, I'll be able to assist you with information from them."
- For "hi": "Hi there! I can help answer questions based on uploaded documents. Feel free to upload some documents to get started."
- For other questions: "I don't have information about that yet. Upload some documents and I'll be able to help answer your questions."

Your response (keep it under 2 sentences):`;

    // Try multiple models in sequence
    const modelsToTry = ['gemini-3.1-flash-lite', 'gemini-2.5-flash', 'gemini-2.5-flash-lite'];
    
    for (const modelName of modelsToTry) {
      try {
        console.log(`Trying model: ${modelName}`);
        this.model = this.genAI!.getGenerativeModel({ model: modelName });
        const result = await this.model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().trim();
        console.log(`Successfully generated response with ${modelName}`);
        return text;
      } catch (error: any) {
        console.error(`Model ${modelName} failed:`, error.message, `(Status: ${error.status || 'N/A'})`);
        // Continue to next model
        if (modelName === modelsToTry[modelsToTry.length - 1]) {
          // Last model failed, return fallback
          console.error('All Gemini models failed, using fallback response');
          return "Hello! I'm here to help answer questions. Once you upload some documents, I'll be able to assist you with information from them.";
        }
      }
    }

    // Fallback if all models fail
    return "Hello! I'm here to help answer questions based on uploaded documents.";
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

    const modelsToTry = ['gemini-3.1-flash-lite', 'gemini-2.5-flash', 'gemini-2.5-flash-lite'];
    
    for (const modelName of modelsToTry) {
      try {
        console.log(`Testing connection with model: ${modelName}`);
        this.model = this.genAI!.getGenerativeModel({ model: modelName });
        const result = await this.model.generateContent('Hello, please respond with "Connection successful"');
        const response = await result.response;
        const text = response.text();
        
        return {
          success: true,
          message: `Gemini AI connected successfully with ${modelName}. Response: ${text.substring(0, 100)}...`
        };
      } catch (error: any) {
        console.error(`Model ${modelName} test failed:`, error.message, `(Status: ${error.status || 'N/A'})`);
        
        // If it's the last model, return failure
        if (modelName === modelsToTry[modelsToTry.length - 1]) {
          return {
            success: false,
            message: `All Gemini models failed. Last error: ${error.message || 'Unknown error'}. Status: ${error.status || 'N/A'}`
          };
        }
        // Otherwise, continue to next model
      }
    }

    return {
      success: false,
      message: 'Failed to connect to any Gemini model'
    };
  }
}