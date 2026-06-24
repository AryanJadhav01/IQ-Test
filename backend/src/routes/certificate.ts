import { Router, Response } from 'express';
import PDFDocument from 'pdfkit';
import { query } from '../config/db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// Optional auth so the endpoint works both for logged-in users and authenticated download links
router.get('/download', async (req: AuthRequest, res: Response) => {
  const { assessmentId } = req.query;

  if (!assessmentId) {
    return res.status(400).json({ error: 'Assessment ID is required.' });
  }

  try {
    // 1. Fetch assessment details
    const assessResult = await query('SELECT * FROM assessments WHERE id = $1', [assessmentId as string]);
    if (assessResult.rowCount === 0) {
      return res.status(404).json({ error: 'Assessment not found.' });
    }
    const assessment = assessResult.rows[0];

    // 2. Verify payment status (Must be paid)
    if (assessment.status !== 'paid') {
      return res.status(403).json({ error: 'Payment required to download certificate.' });
    }

    // 3. Verify plan type is Premium
    const paymentResult = await query(
      "SELECT plan_type FROM payments WHERE assessment_id = $1 AND status = 'captured' ORDER BY created_at DESC LIMIT 1",
      [assessmentId as string]
    );
    const planType = paymentResult.rowCount > 0 ? paymentResult.rows[0].plan_type : 'premium';
    if (planType !== 'premium') {
      return res.status(403).json({ error: 'Premium Plan required for certificate downloads.' });
    }

    // 4. Fetch results and user information
    const resultResult = await query('SELECT * FROM results WHERE assessment_id = $1', [assessmentId as string]);
    if (resultResult.rowCount === 0) {
      return res.status(404).json({ error: 'Results not found.' });
    }
    const result = resultResult.rows[0];

    let studentName = (req.query.studentName as string) || 'Valued Student';
    if (studentName === 'Valued Student' && assessment.user_id && assessment.user_id !== 'anonymous') {
      const userResult = await query('SELECT full_name FROM users WHERE id = $1', [assessment.user_id]);
      if (userResult.rowCount > 0) {
        studentName = userResult.rows[0].full_name;
      }
    }

    const statsResult = await query(
      `SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN selected_option IS NOT NULL AND selected_option != '' THEN 1 END) as attempted,
        COUNT(CASE WHEN selected_option = correct_answer THEN 1 END) as correct,
        COUNT(CASE WHEN selected_option IS NOT NULL AND selected_option != '' AND selected_option != correct_answer THEN 1 END) as wrong
      FROM answers a
      JOIN questions q ON a.question_id = q.id
      WHERE a.assessment_id = $1`,
      [assessmentId as string]
    );
    const stats = statsResult.rows[0] || { total: 60, attempted: 0, correct: 0, wrong: 0 };

    // 5. Generate and insert certificate entry if not exists
    const certCheck = await query('SELECT * FROM certificates WHERE result_id = $1', [result.id]);
    let certId = '';
    let issueDate = new Date();

    if (certCheck.rowCount > 0) {
      certId = certCheck.rows[0].certificate_uuid;
      issueDate = new Date(certCheck.rows[0].issue_date);
    } else {
      certId = 'CS-IQ-' + Math.random().toString(36).substring(2, 8).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
      await query(
        'INSERT INTO certificates (id, user_id, result_id, certificate_uuid, issue_date) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)',
        [crypto.randomUUID(), assessment.user_id || 'anonymous', result.id, certId]
      );
    }

    // Format Date
    const formattedDate = issueDate.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    // 6. Build PDF in memory and stream
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=CS_IQ_Certificate_${studentName.replace(/\s+/g, '_')}.pdf`);

    // Create PDF document in Landscape
    const doc = new PDFDocument({
      size: 'A4',
      layout: 'landscape',
      margins: { top: 40, bottom: 40, left: 40, right: 40 }
    });

    doc.pipe(res);

    // BACKGROUND FRAME BORDERS
    // Main outer border
    doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40)
       .lineWidth(3)
       .stroke('#E53935'); // College Simplified Primary Red

    // Inner thin border
    doc.rect(26, 26, doc.page.width - 52, doc.page.height - 52)
       .lineWidth(1)
       .stroke('#E53935');

    // Decorative corner shapes
    doc.rect(20, 20, 20, 20).fill('#E53935');
    doc.rect(doc.page.width - 40, 20, 20, 20).fill('#E53935');
    doc.rect(20, doc.page.height - 40, 20, 20).fill('#E53935');
    doc.rect(doc.page.width - 40, doc.page.height - 40, 20, 20).fill('#E53935');

    // LOGO/HEADER
    doc.moveDown(2);
    doc.font('Helvetica-Bold')
       .fontSize(22)
       .fillColor('#E53935')
       .text('COLLEGE SIMPLIFIED', { align: 'center' });

    doc.font('Helvetica')
       .fontSize(10)
       .fillColor('#111827')
       .text('Simplifying Academic and Cognitive Transitions', { align: 'center' });

    doc.moveDown(2);

    // CERTIFICATE TITLE
    doc.font('Times-Roman')
       .fontSize(34)
       .fillColor('#111827')
       .text('CERTIFICATE OF COGNITIVE VALOR', { align: 'center' });

    doc.moveDown(0.5);

    doc.font('Helvetica-Oblique')
       .fontSize(12)
       .fillColor('#4B5563')
       .text('This is proudly awarded to', { align: 'center' });

    doc.moveDown(0.8);

    // STUDENT NAME
    doc.font('Times-Bold')
       .fontSize(28)
       .fillColor('#E53935')
       .text(studentName, { align: 'center' });

    // Underline name
    doc.moveTo(150, doc.y + 4)
       .lineTo(doc.page.width - 150, doc.y + 4)
       .lineWidth(1.5)
       .stroke('#E53935');

    doc.moveDown(1.5);

    // ACHIEVEMENT STATEMENTS
    doc.font('Helvetica')
       .fontSize(12)
       .fillColor('#111827')
       .text('for successfully completing the College Simplified Advanced Cognitive Assessment', { align: 'center' });

    doc.moveDown(0.5);

    doc.font('Helvetica-Bold')
       .fontSize(14)
       .text(`IQ SCORE: ${result.overall_iq}   |   CATEGORY: ${result.category.toUpperCase()}`, { align: 'center' });

    doc.moveDown(0.25);

    doc.font('Helvetica-Bold')
       .fontSize(10)
       .fillColor('#4B5563')
       .text(`Attempted: ${stats.attempted}/${stats.total}   |   Correct: ${stats.correct}   |   Incorrect: ${stats.wrong}`, { align: 'center' });

    doc.moveDown(0.25);

    doc.font('Helvetica-Oblique')
       .fontSize(11)
       .fillColor('#4B5563')
       .text(`Demonstrating cognitive strength in ${result.logical_score >= result.pattern_score ? 'Logical Reasoning' : 'Pattern Recognition'}`, { align: 'center' });

    // SIGNATURES & VERIFICATION METADATA
    doc.moveDown(3);

    const bottomY = doc.y;

    // Left Column: Issue Date
    doc.font('Helvetica')
       .fontSize(10)
       .fillColor('#111827')
       .text('DATE OF EVALUATION', 80, bottomY, { width: 200, align: 'center' });
    
    doc.font('Helvetica-Bold')
       .fontSize(11)
       .text(formattedDate, 80, bottomY + 15, { width: 200, align: 'center' });

    // Center: Official Seal or Logo
    // Let's draw a nice vector seal since we don't have images
    const centerX = doc.page.width / 2;
    doc.circle(centerX, bottomY + 10, 25)
       .lineWidth(1)
       .stroke('#E53935')
       .fill('#FEE2E2');
       
    doc.font('Helvetica-Bold')
       .fontSize(7)
       .fillColor('#E53935')
       .text('VERIFIED', centerX - 20, bottomY + 7, { width: 40, align: 'center' });

    // Right Column: Authority Signature
    doc.font('Times-BoldItalic')
       .fontSize(16)
       .fillColor('#111827')
       .text('College Simplified Board', doc.page.width - 280, bottomY - 5, { width: 200, align: 'center' });
       
    doc.moveTo(doc.page.width - 250, bottomY + 13)
       .lineTo(doc.page.width - 90, bottomY + 13)
       .lineWidth(0.5)
       .stroke('#9CA3AF');

    doc.font('Helvetica')
       .fontSize(9)
       .fillColor('#4B5563')
       .text('COGNITIVE ASSESSMENT REGULATOR', doc.page.width - 280, bottomY + 18, { width: 200, align: 'center' });

    // Footer metadata (UUID)
    doc.fontSize(8)
       .fillColor('#9CA3AF')
       .text(`Certificate ID: ${certId}  |  Verify online at collegesimplified.in/verify`, 40, doc.page.height - 35, { align: 'center' });

    doc.end();
  } catch (error) {
    console.error('[Download Certificate Error]:', error);
    res.status(500).json({ error: 'Failed to generate certificate PDF.' });
  }
});

export default router;
