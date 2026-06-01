import TextChunkModel from '../models/TextChunk.js';
import QAModel from '../models/QA.js';
import DocumentModel from '../models/Document.js';

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
  sources: SearchResult[];
  confidence: 'high' | 'medium' | 'low';
  type: 'exact_match' | 'document_based' | 'not_found';
}

export class QuestionAnsweringService {
  /**
   * Answer a question using the knowledge base
   */
  static async answerQuestion(question: string): Promise<AnswerResult> {
    // First, try to find an exact match in Q&A pairs
    const exactMatch = await this.findExactQAMatch(question);
    if (exactMatch) {
      return {
        answer: exactMatch.answer,
        sources: [],
        confidence: 'high',
        type: 'exact_match'
      };
    }

    // If no exact match, search in document chunks
    const relevantChunks = await this.searchRelevantChunks(question);
    
    if (relevantChunks.length === 0) {
      return {
        answer: "I couldn't find relevant information to answer your question. Please try rephrasing your question or check if the relevant documents have been uploaded.",
        sources: [],
        confidence: 'low',
        type: 'not_found'
      };
    }

    // Generate answer based on relevant chunks
    const answer = this.generateAnswerFromChunks(question, relevantChunks);
    
    return {
      answer,
      sources: relevantChunks,
      confidence: relevantChunks.length > 2 ? 'high' : 'medium',
      type: 'document_based'
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