import { Router, Response } from 'express';
import { query } from '../config/db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// 1. Get assessment result by assessment ID
router.get('/:assessmentId', async (req: AuthRequest, res: Response) => {
  const { assessmentId } = req.params;

  try {
    // Check assessment details
    const assessResult = await query('SELECT * FROM assessments WHERE id = $1', [assessmentId]);
    if (assessResult.rowCount === 0) {
      return res.status(404).json({ error: 'Assessment not found.' });
    }

    const assessment = assessResult.rows[0];
    if (assessment.status === 'in_progress') {
      return res.status(400).json({ error: 'Assessment is not completed yet.' });
    }

    // Fetch result data
    const resultQuery = await query('SELECT * FROM results WHERE assessment_id = $1', [assessmentId]);
    if (resultQuery.rowCount === 0) {
      return res.status(404).json({ error: 'Result not generated.' });
    }
    const result = resultQuery.rows[0];

    // Check payment status
    // If the assessment status is 'paid', query the payments table to see if it's basic or premium
    const isPaid = assessment.status === 'paid';
    let planType: 'basic' | 'premium' | null = null;

    if (isPaid) {
      const paymentResult = await query(
        "SELECT plan_type FROM payments WHERE assessment_id = $1 AND status = 'captured' ORDER BY created_at DESC LIMIT 1",
        [assessmentId]
      );
      if (paymentResult.rowCount > 0) {
        planType = paymentResult.rows[0].plan_type;
      } else {
        // Fallback in case of mock free unlock
        planType = 'premium';
      }
    }

    // If assessment is not paid, return locked result structure
    if (!isPaid) {
      return res.json({
        locked: true,
        planType: null,
        message: 'Assessment completed. Please purchase a report to unlock results.',
        resultPreview: {
          assessmentId,
          completedAt: assessment.completed_at,
          // Do not leak actual scores, just return categories and shape
          categories: [
            'Logical Reasoning',
            'Pattern Recognition',
            'Numerical Intelligence',
            'Verbal Reasoning',
            'Analytical Thinking',
            'Problem Solving'
          ]
        }
      });
    }

    // Fetch metrics statistics
    const statsResult = await query(
      `SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN selected_option IS NOT NULL AND selected_option != '' THEN 1 END) as attempted,
        COUNT(CASE WHEN selected_option = correct_answer THEN 1 END) as correct,
        COUNT(CASE WHEN selected_option IS NOT NULL AND selected_option != '' AND selected_option != correct_answer THEN 1 END) as wrong
      FROM answers a
      JOIN questions q ON a.question_id = q.id
      WHERE a.assessment_id = $1`,
      [assessmentId]
    );
    const stats = statsResult.rows[0] || { total: 60, attempted: 0, correct: 0, wrong: 0 };

    // If paid, filter results based on basic vs premium plans
    const fullResult = {
      locked: false,
      planType,
      assessmentId,
      completedAt: assessment.completed_at,
      overallIq: result.overall_iq,
      category: result.category,
      percentile: result.percentile,
      attemptedCount: Number(stats.attempted),
      correctCount: Number(stats.correct),
      wrongCount: Number(stats.wrong),
      totalCount: Number(stats.total),
      domainScores: {
        'Logical Reasoning': result.logical_score,
        'Pattern Recognition': result.pattern_score,
        'Numerical Intelligence': result.numerical_score,
        'Verbal Reasoning': result.verbal_score,
        'Analytical Thinking': result.analytical_score,
        'Problem Solving': result.problem_solving_score
      },
      // Premium-only fields:
      aiInsights: planType === 'premium' ? result.ai_insights : null,
      careers: planType === 'premium' ? JSON.parse(result.careers) : null,
      certificateUrl: planType === 'premium' ? `/api/certificate/download?assessmentId=${assessmentId}` : null
    };

    res.json(fullResult);
  } catch (error) {
    console.error('[Get Result Error]:', error);
    res.status(500).json({ error: 'Failed to retrieve assessment results.' });
  }
});

// 2. Fetch all history for logged-in user dashboard
router.get('/user/history', authenticateToken, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;

  try {
    // Get all assessments for the user
    const sql = `
      SELECT a.id as assessment_id, a.status, a.started_at, a.completed_at,
             r.overall_iq, r.category, r.percentile,
             p.plan_type, p.status as payment_status
      FROM assessments a
      LEFT JOIN results r ON a.id = r.assessment_id
      LEFT JOIN payments p ON a.id = p.assessment_id AND p.status = 'captured'
      WHERE a.user_id = $1
      ORDER BY a.started_at DESC
    `;
    const historyResult = await query(sql, [userId]);
    res.json(historyResult.rows);
  } catch (error) {
    console.error('[Get User History Error]:', error);
    res.status(500).json({ error: 'Failed to retrieve assessment history.' });
  }
});

export default router;
