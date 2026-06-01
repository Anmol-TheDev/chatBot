import TextChunkModel from '../models/TextChunk.js';
import QAModel from '../models/QA.js';
import DocumentModel from '../models/Document.js';
import { GeminiService } from './geminiService.js';

export interface SearchResult {
  chunk: {
    id: string;
    content: string;
    documentId: string;
    documentName: string;
    chunkIndex: number;
    relevanceScore: number;
  };
}

export interface AnswerResult {
  answer: string;
  sources: SearchResult[] | string[];
  confidence: 'high' | 'medium' | 'low';
  type: 'exact_match' | 'document_based' | 'ai_generated' | 'not_found';
  aiGenerated?: boolean;
}

export class QuestionAnsweringService {
  /**
   * Answer a question using the knowledge base with AI enhancement
   */
  static async answerQuestion(question: string): Promise<AnswerResult> {
    // First, try to find an exact match in Q&A pairs
    const exactMatch = await this.findExactQAMatch(question);
    if (exactMatch) {
      return {
        answer: exactMatch.answer,
        sources: [],
        confidence: 'high',
        type: 'exact_match',
        aiGenerated: false
      };
    }

    // Search for relevant chunks and similar Q&A pairs
    const [relevantChunks, similarQAs] = await Promise.all([
      this.searchRelevantChunks(question),
      this.getSimilarQuestions(question, 3)
    ]);

    // If we have context and Gemini is available, use AI to generate answer
    if (GeminiService.isAvailable() && (relevantChunks.length > 0 || similarQAs.length > 0)) {
      try {
        // Prepare context for Gemini
        const documentChunks = relevantChunks.map(result => ({
          content: result.chunk.content,
          documentName: result.chunk.documentName,
          relevanceScore: result.chunk.relevanceScore
        }));

        const qaPairs = similarQAs.map(qa => ({
          question: qa.question,
          answer: qa.answer,
          similarity: qa.similarity
        }));

        // Generate AI response
        const aiResponse = await GeminiService.generateAnswer(question, documentChunks, qaPairs);

        return {
          answer: aiResponse.answer,
          sources: aiResponse.sources,
          confidence: aiResponse.confidence,
          type: 'ai_generated',
          aiGenerated: true
        };
      } catch (error) {
        console.error('AI generation failed, falling back to traditional method:', error);
        // Fall back to traditional method if AI fails
      }
    }

    // Traditional fallback method
    if (relevantChunks.length === 0) {
      // If Gemini is available but no context, try simple AI response
      if (GeminiService.isAvailable()) {
        try {
          const simpleResponse = await GeminiService.generateSimpleResponse(question);
          return {
            answer: simpleResponse,
            sources: [],
            confidence: 'low',
            type: 'ai_generated',
            aiGenerated: true
          };
        } catch (error) {
          console.error('Simple AI response failed:', error);
        }
      }

      return {
        answer: "I couldn't find relevant information to answer your question. Please try rephrasing your question or check if the relevant documents have been uploaded.",
        sources: [],
        confidence: 'low',
        type: 'not_found',
        aiGenerated: false
      };
    }

    // Generate answer based on relevant chunks (traditional method)
    const answer = this.generateAnswerFromChunks(question, relevantChunks);
    
    return {
      answer,
      sources: relevantChunks,
      confidence: relevantChunks.length > 2 ? 'high' : 'medium',
      type: 'document_based',
      aiGenerated: false
    };
  }

  /**
   * Find exact match in Q&A pairs
   */
  private static async findExactQAMatch(question: string): Promise<{ answer: string } | null> {
    // Try exact match first
    let qa: any = await QAModel.findOne({
      question: { $regex: new RegExp(`^${question.trim()}$`, 'i') }
    });

    if (!qa) {
      // Try fuzzy match using text search
      const results = await QAModel.find({
        $text: { $search: question }
      }, {
        score: { $meta: 'textScore' }
      })
      .sort({ score: { $meta: 'textScore' } })
      .limit(1);

      if (results.length > 0 && (results[0] as any).score > 0.8) {
        qa = results[0] || null;
      }
    }

    return qa ? { answer: qa.answer } : null;
  }

  /**
   * Search for relevant text chunks
   */
  private static async searchRelevantChunks(question: string, limit: number = 5): Promise<SearchResult[]> {
    // Use MongoDB text search to find relevant chunks
    const chunks = await TextChunkModel.find({
      $text: { $search: question }
    }, {
      score: { $meta: 'textScore' }
    })
    .populate('documentId', 'fileName')
    .sort({ score: { $meta: 'textScore' } })
    .limit(limit);

    // Convert to SearchResult format
    const results: SearchResult[] = [];
    
    for (const chunk of chunks) {
      const document = chunk.documentId as any;
      results.push({
        chunk: {
          id: chunk._id.toString(),
          content: chunk.content,
          documentId: chunk.documentId.toString(),
          documentName: document?.fileName || 'Unknown Document',
          chunkIndex: chunk.chunkIndex,
          relevanceScore: (chunk as any).score || 0
        }
      });
    }

    return results;
  }

  /**
   * Generate answer from relevant chunks
   */
  private static generateAnswerFromChunks(_question: string, chunks: SearchResult[]): string {
    if (chunks.length === 0) {
      return "No relevant information found.";
    }

    // Simple answer generation - combine most relevant chunks
    const topChunks = chunks.slice(0, 3);
    const combinedContent = topChunks.map(result => result.chunk.content).join(' ');

    // For now, return the combined content with some context
    // In a production system, you would use an LLM to generate a proper answer
    return `Based on the available documents: ${combinedContent.substring(0, 500)}${combinedContent.length > 500 ? '...' : ''}`;
  }

  /**
   * Get similar questions from Q&A pairs
   */
  static async getSimilarQuestions(question: string, limit: number = 3): Promise<Array<{
    question: string;
    answer: string;
    similarity: number;
  }>> {
    const results = await QAModel.find({
      $text: { $search: question }
    }, {
      score: { $meta: 'textScore' }
    })
    .sort({ score: { $meta: 'textScore' } })
    .limit(limit);

    return results.map(qa => ({
      question: qa.question,
      answer: qa.answer,
      similarity: (qa as any).score || 0
    }));
  }

  /**
   * Get document statistics for knowledge base
   */
  static async getKnowledgeBaseStats(): Promise<{
    totalDocuments: number;
    totalChunks: number;
    totalQAPairs: number;
    avgChunksPerDocument: number;
  }> {
    const [totalDocuments, totalChunks, totalQAPairs] = await Promise.all([
      DocumentModel.countDocuments(),
      TextChunkModel.countDocuments(),
      QAModel.countDocuments()
    ]);

    return {
      totalDocuments,
      totalChunks,
      totalQAPairs,
      avgChunksPerDocument: totalDocuments > 0 ? Math.round(totalChunks / totalDocuments) : 0
    };
  }
}