import QAModel, { IQA } from '../models/QA.js';

export class QAService {
  /**
   * Search Q&A pairs by question or answer content
   */
  static async searchQA(searchTerm: string, limit: number = 5): Promise<IQA[]> {
    return await QAModel.find({
      $or: [
        { question: { $regex: searchTerm, $options: 'i' } },
        { answer: { $regex: searchTerm, $options: 'i' } }
      ]
    })
    .sort({ createdAt: -1 })
    .limit(limit);
  }

  /**
   * Find similar questions using text search
   */
  static async findSimilarQuestions(question: string, limit: number = 3): Promise<IQA[]> {
    return await QAModel.find({
      $text: { $search: question }
    }, {
      score: { $meta: 'textScore' }
    })
    .sort({ score: { $meta: 'textScore' } })
    .limit(limit);
  }

  /**
   * Get Q&A statistics
   */
  static async getQAStats(): Promise<{
    total: number;
    recentCount: number;
    avgQuestionLength: number;
    avgAnswerLength: number;
  }> {
    const total = await QAModel.countDocuments();
    
    // Count Q&A pairs created in the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentCount = await QAModel.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });

    // Calculate average lengths
    const avgStats = await QAModel.aggregate([
      {
        $group: {
          _id: null,
          avgQuestionLength: { $avg: { $strLenCP: '$question' } },
          avgAnswerLength: { $avg: { $strLenCP: '$answer' } }
        }
      }
    ]);

    return {
      total,
      recentCount,
      avgQuestionLength: Math.round(avgStats[0]?.avgQuestionLength || 0),
      avgAnswerLength: Math.round(avgStats[0]?.avgAnswerLength || 0)
    };
  }

  /**
   * Bulk import Q&A pairs
   */
  static async bulkImportQA(qaPairs: Array<{ question: string; answer: string }>): Promise<{
    imported: number;
    skipped: number;
    errors: string[];
  }> {
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const pair of qaPairs) {
      try {
        // Check if question already exists
        const existing = await QAModel.findOne({
          question: { $regex: new RegExp(`^${pair.question.trim()}$`, 'i') }
        });

        if (existing) {
          skipped++;
          continue;
        }

        await QAModel.create({
          question: pair.question.trim(),
          answer: pair.answer.trim()
        });
        imported++;
      } catch (error: any) {
        errors.push(`Failed to import "${pair.question}": ${error.message}`);
      }
    }

    return { imported, skipped, errors };
  }
}