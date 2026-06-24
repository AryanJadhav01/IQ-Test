import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import axios from 'axios';
import { query } from '../config/db';
import { authenticateToken, AuthRequest, getOptionalUser } from '../middleware/auth';

const router = Router();
const ANALYTICS_SERVICE_URL = process.env.ANALYTICS_SERVICE_URL || 'http://localhost:8000';

// 1. Start Assessment Route
router.post('/start', getOptionalUser, async (req: AuthRequest, res: Response) => {
  const assessmentId = crypto.randomUUID();
  const userId = req.user?.id || null;

  try {
    // Fetch Easy Questions (Difficulty: 'easy')
    const easyResult = await query(
      "SELECT id, question, option_a, option_b, option_c, option_d, difficulty, category, image_url FROM questions WHERE difficulty = 'easy'"
    );
    // Fetch Medium Questions (Difficulty: 'medium')
    const mediumResult = await query(
      "SELECT id, question, option_a, option_b, option_c, option_d, difficulty, category, image_url FROM questions WHERE difficulty = 'medium'"
    );
    // Fetch Advanced Questions (Difficulty: 'advanced')
    const advancedResult = await query(
      "SELECT id, question, option_a, option_b, option_c, option_d, difficulty, category, image_url FROM questions WHERE difficulty = 'advanced'"
    );

    if (easyResult.rows.length < 20 || mediumResult.rows.length < 25 || advancedResult.rows.length < 15) {
      return res.status(500).json({
        error: 'Insufficient questions in question bank. Required: 20 Easy, 25 Medium, 15 Advanced.',
        counts: {
          easy: easyResult.rows.length,
          medium: mediumResult.rows.length,
          advanced: advancedResult.rows.length
        }
      });
    }

    // Helper to shuffle array and pick N elements
    const getRandomSample = (arr: any[], count: number) => {
      const shuffled = [...arr].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, count);
    };

    const selectedEasy = getRandomSample(easyResult.rows, 20);
    const selectedMedium = getRandomSample(mediumResult.rows, 25);
    const selectedAdvanced = getRandomSample(advancedResult.rows, 15);

    // Combine and shuffle the final list of 60 questions
    const final60 = [...selectedEasy, ...selectedMedium, ...selectedAdvanced].sort(() => 0.5 - Math.random());

    // Insert assessment
    await query(
      'INSERT INTO assessments (id, user_id, status, current_question_index) VALUES ($1, $2, $3, $4)',
      [assessmentId, userId, 'in_progress', 0]
    );

    // Populate answers table with blank entries to bind these questions to the assessment
    for (const q of final60) {
      const answerId = crypto.randomUUID();
      await query(
        'INSERT INTO answers (id, assessment_id, question_id, selected_option, marked_for_review) VALUES ($1, $2, $3, $4, $5)',
        [answerId, assessmentId, q.id, null, 0]
      );
    }

    res.json({
      assessmentId,
      questions: final60
    });
  } catch (error) {
    console.error('[Assessment Start Error]:', error);
    res.status(500).json({ error: 'Failed to start assessment.' });
  }
});

// 2. Fetch active assessment questions (in case user reloads)
router.get('/:assessmentId/questions', async (req: Request, res: Response) => {
  const { assessmentId } = req.params;
  try {
    const assessCheck = await query('SELECT status FROM assessments WHERE id = $1', [assessmentId]);
    if (assessCheck.rowCount === 0) {
      return res.status(404).json({ error: 'Assessment not found.' });
    }

    // Get selected questions for this assessment joined with question content
    const sql = `
      SELECT q.id, q.question, q.option_a, q.option_b, q.option_c, q.option_d, q.difficulty, q.category, q.image_url,
             a.selected_option, a.marked_for_review
      FROM answers a
      JOIN questions q ON a.question_id = q.id
      WHERE a.assessment_id = $1
    `;
    const questionsResult = await query(sql, [assessmentId]);
    
    res.json({
      status: assessCheck.rows[0].status,
      questions: questionsResult.rows
    });
  } catch (error) {
    console.error('[Fetch Assessment Questions Error]:', error);
    res.status(500).json({ error: 'Failed to retrieve assessment questions.' });
  }
});

// 3. Save Answer Route
router.post('/save-answer', async (req: Request, res: Response) => {
  const { assessmentId, questionId, selectedOption, markedForReview } = req.body;

  if (!assessmentId || questionId === undefined) {
    return res.status(400).json({ error: 'Assessment ID and Question ID are required.' });
  }

  try {
    // Check if assessment is still in progress
    const assess = await query('SELECT status FROM assessments WHERE id = $1', [assessmentId]);
    if (assess.rowCount === 0) {
      return res.status(404).json({ error: 'Assessment not found.' });
    }
    if (assess.rows[0].status !== 'in_progress') {
      return res.status(400).json({ error: 'Assessment is already submitted/completed.' });
    }

    const reviewValue = markedForReview ? 1 : 0;
    await query(
      'UPDATE answers SET selected_option = $1, marked_for_review = $2, saved_at = CURRENT_TIMESTAMP WHERE assessment_id = $3 AND question_id = $4',
      [selectedOption || null, reviewValue, assessmentId, questionId]
    );

    res.json({ success: true, message: 'Answer saved.' });
  } catch (error) {
    console.error('[Save Answer Error]:', error);
    res.status(500).json({ error: 'Failed to save answer.' });
  }
});

// 4. Submit Assessment Route
router.post('/submit', getOptionalUser, async (req: AuthRequest, res: Response) => {
  const { assessmentId, studentName } = req.body;

  if (!assessmentId) {
    return res.status(400).json({ error: 'Assessment ID is required.' });
  }

  try {
    const assessResult = await query('SELECT * FROM assessments WHERE id = $1', [assessmentId]);
    if (assessResult.rowCount === 0) {
      return res.status(404).json({ error: 'Assessment not found.' });
    }

    const assessment = assessResult.rows[0];
    if (assessment.status !== 'in_progress') {
      return res.status(400).json({ error: 'Assessment has already been submitted.' });
    }

    // Get all user answers joined with question correct keys
    const answersQuery = `
      SELECT a.question_id, a.selected_option, q.correct_answer, q.category, q.difficulty
      FROM answers a
      JOIN questions q ON a.question_id = q.id
      WHERE a.assessment_id = $1
    `;
    const userAnswers = await query(answersQuery, [assessmentId]);

    // Format for Python FastAPI Scoring Service
    const answersPayload = userAnswers.rows.map(row => ({
      question_id: row.question_id,
      selected_option: row.selected_option,
      correct_answer: row.correct_answer,
      category: row.category,
      difficulty: row.difficulty
    }));

    // Fallback student name if guest
    let name = studentName || 'Guest Candidate';
    if (assessment.user_id) {
      const userResult = await query('SELECT full_name FROM users WHERE id = $1', [assessment.user_id]);
      if (userResult.rowCount > 0) {
        name = userResult.rows[0].full_name;
      }
    }

    // Send payload to FastAPI Python service
    console.log(`[Assessment] Sending answers to FastAPI scoring service: ${ANALYTICS_SERVICE_URL}/score`);
    const scoringResponse = await axios.post(`${ANALYTICS_SERVICE_URL}/score`, {
      student_name: name,
      answers: answersPayload
    });

    const scores = scoringResponse.data;

    // Create a result entry
    const resultId = crypto.randomUUID();
    const boundUserId = req.user?.id || assessment.user_id || 'anonymous';

    await query(
      `INSERT INTO results (
        id, assessment_id, user_id, overall_iq, category, percentile,
        logical_score, pattern_score, numerical_score, verbal_score, analytical_score, problem_solving_score,
        ai_insights, careers
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [
        resultId,
        assessmentId,
        boundUserId,
        scores.overall_iq,
        scores.category,
        scores.percentile,
        scores.domain_scores['Logical Reasoning'] || 0,
        scores.domain_scores['Pattern Recognition'] || 0,
        scores.domain_scores['Numerical Intelligence'] || 0,
        scores.domain_scores['Verbal Reasoning'] || 0,
        scores.domain_scores['Analytical Thinking'] || 0,
        scores.domain_scores['Problem Solving'] || 0,
        scores.ai_insights,
        JSON.stringify(scores.careers)
      ]
    );

    // Update assessment status
    await query(
      'UPDATE assessments SET status = $1, completed_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['completed', assessmentId]
    );

    res.json({
      success: true,
      message: 'Assessment completed and scores generated.',
      assessmentId,
      resultId
    });
  } catch (error: any) {
    console.error('[Assessment Submit Error]:', error.message || error);
    res.status(500).json({ error: 'Failed to process assessment scoring.' });
  }
});

export default router;
