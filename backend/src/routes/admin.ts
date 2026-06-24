import { Router, Response } from 'express';
import { query } from '../config/db';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// Apply auth + admin checks to all admin routes
router.use(authenticateToken);
router.use(requireAdmin);

// 1. Get Revenue & System Analytics Stats
router.get('/stats', async (req: AuthRequest, res: Response) => {
  try {
    const userCount = await query('SELECT COUNT(*) as count FROM users WHERE role = $1', ['user']);
    const assessCount = await query('SELECT COUNT(*) as count FROM assessments WHERE status = $1', ['completed']);
    const paidCount = await query('SELECT COUNT(*) as count FROM assessments WHERE status = $1', ['paid']);

    // Revenue calculation
    const revenueResult = await query(
      "SELECT SUM(amount) as total FROM payments WHERE status = 'captured'"
    );
    const totalRevenue = revenueResult.rows[0].total || 0;

    // Average IQ Score
    const avgIqResult = await query('SELECT AVG(overall_iq) as avg_iq FROM results');
    const averageIq = Math.round(avgIqResult.rows[0].avg_iq || 100);

    // Question bank distribution
    const bankStats = await query(
      'SELECT difficulty, COUNT(*) as count FROM questions GROUP BY difficulty'
    );

    // Category scores averages
    const categoryAverages = await query(`
      SELECT 
        AVG(logical_score) as logical,
        AVG(pattern_score) as pattern,
        AVG(numerical_score) as numerical,
        AVG(verbal_score) as verbal,
        AVG(analytical_score) as analytical,
        AVG(problem_solving_score) as problem_solving
      FROM results
    `);

    // Dynamic list of recent payments
    const recentPayments = await query(`
      SELECT p.amount, p.plan_type, p.created_at, u.full_name, u.email
      FROM payments p
      JOIN users u ON p.user_id = u.id
      WHERE p.status = 'captured'
      ORDER BY p.created_at DESC
      LIMIT 5
    `);

    res.json({
      metrics: {
        totalUsers: parseInt(userCount.rows[0].count),
        completedTests: parseInt(assessCount.rows[0].count) + parseInt(paidCount.rows[0].count),
        purchasedReports: parseInt(paidCount.rows[0].count),
        totalRevenue: parseFloat(totalRevenue),
        averageIq
      },
      questionBankDistribution: bankStats.rows,
      categoryAverages: categoryAverages.rows[0] || {
        logical: 50,
        pattern: 50,
        numerical: 50,
        verbal: 50,
        analytical: 50,
        problem_solving: 50
      },
      recentPayments: recentPayments.rows
    });
  } catch (error) {
    console.error('[Admin Get Stats Error]:', error);
    res.status(500).json({ error: 'Failed to retrieve admin dashboard metrics.' });
  }
});

// 2. Read Questions (with pagination/search)
router.get('/questions', async (req: AuthRequest, res: Response) => {
  try {
    const qResult = await query('SELECT * FROM questions ORDER BY id DESC');
    res.json(qResult.rows);
  } catch (error) {
    console.error('[Admin List Questions Error]:', error);
    res.status(500).json({ error: 'Failed to retrieve questions.' });
  }
});

// 3. Create Question
router.post('/questions', async (req: AuthRequest, res: Response) => {
  const { question, optionA, optionB, optionC, optionD, correctAnswer, difficulty, category, explanation, imageUrl } = req.body;

  if (!question || !optionA || !optionB || !optionC || !optionD || !correctAnswer || !difficulty || !category) {
    return res.status(400).json({ error: 'Missing required question fields.' });
  }

  try {
    await query(
      `INSERT INTO questions (question, option_a, option_b, option_c, option_d, correct_answer, difficulty, category, explanation, image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [question, optionA, optionB, optionC, optionD, correctAnswer.toUpperCase(), difficulty.toLowerCase(), category.toLowerCase(), explanation || null, imageUrl || null]
    );

    res.status(201).json({ success: true, message: 'Question added successfully.' });
  } catch (error) {
    console.error('[Admin Add Question Error]:', error);
    res.status(500).json({ error: 'Failed to add question.' });
  }
});

// 4. Update Question
router.put('/questions/:id', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { question, optionA, optionB, optionC, optionD, correctAnswer, difficulty, category, explanation, imageUrl } = req.body;

  try {
    const check = await query('SELECT id FROM questions WHERE id = $1', [id]);
    if (check.rowCount === 0) {
      return res.status(404).json({ error: 'Question not found.' });
    }

    await query(
      `UPDATE questions 
       SET question = $1, option_a = $2, option_b = $3, option_c = $4, option_d = $5,
           correct_answer = $6, difficulty = $7, category = $8, explanation = $9, image_url = $10
       WHERE id = $11`,
      [question, optionA, optionB, optionC, optionD, correctAnswer.toUpperCase(), difficulty.toLowerCase(), category.toLowerCase(), explanation || null, imageUrl || null, id]
    );

    res.json({ success: true, message: 'Question updated successfully.' });
  } catch (error) {
    console.error('[Admin Update Question Error]:', error);
    res.status(500).json({ error: 'Failed to update question.' });
  }
});

// 5. Delete Question
router.delete('/questions/:id', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const check = await query('SELECT id FROM questions WHERE id = $1', [id]);
    if (check.rowCount === 0) {
      return res.status(404).json({ error: 'Question not found.' });
    }

    await query('DELETE FROM questions WHERE id = $1', [id]);
    res.json({ success: true, message: 'Question deleted successfully.' });
  } catch (error) {
    console.error('[Admin Delete Question Error]:', error);
    res.status(500).json({ error: 'Failed to delete question.' });
  }
});

// 6. Bulk Upload Questions
router.post('/questions/bulk-upload', async (req: AuthRequest, res: Response) => {
  const { questions } = req.body; // Expecting array of question items

  if (!questions || !Array.isArray(questions)) {
    return res.status(400).json({ error: 'Invalid payload. Expecting a list of questions.' });
  }

  try {
    for (const q of questions) {
      if (!q.question || !q.optionA || !q.optionB || !q.optionC || !q.optionD || !q.correctAnswer || !q.difficulty || !q.category) {
        continue; // Skip invalid items
      }
      await query(
        `INSERT INTO questions (question, option_a, option_b, option_c, option_d, correct_answer, difficulty, category, explanation, image_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [q.question, q.optionA, q.optionB, q.optionC, q.optionD, q.correctAnswer.toUpperCase(), q.difficulty.toLowerCase(), q.category.toLowerCase(), q.explanation || null, q.imageUrl || null]
      );
    }

    res.json({ success: true, message: `Successfully bulk uploaded ${questions.length} questions.` });
  } catch (error) {
    console.error('[Admin Bulk Upload Questions Error]:', error);
    res.status(500).json({ error: 'Failed to bulk upload questions.' });
  }
});

export default router;
