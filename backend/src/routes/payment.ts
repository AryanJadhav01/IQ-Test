import { Router, Response } from 'express';
import crypto from 'crypto';
import { query } from '../config/db';
import { authenticateToken, AuthRequest, getOptionalUser } from '../middleware/auth';

const router = Router();

// 1. Apply Coupon API
router.post('/apply-coupon', async (req: AuthRequest, res: Response) => {
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ error: 'Coupon code is required.' });
  }

  try {
    const couponResult = await query(
      `SELECT * FROM coupon_codes 
       WHERE code = $1 AND active = 1 AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)`,
      [code.toUpperCase()]
    );

    if (couponResult.rowCount === 0) {
      return res.status(400).json({ error: 'Invalid or expired coupon code.' });
    }

    const coupon = couponResult.rows[0];
    if (coupon.current_uses >= coupon.max_uses) {
      return res.status(400).json({ error: 'Coupon usage limit has been reached.' });
    }

    res.json({
      success: true,
      code: coupon.code,
      discountPercent: coupon.discount_percent
    });
  } catch (error) {
    console.error('[Apply Coupon Error]:', error);
    res.status(500).json({ error: 'Failed to apply coupon.' });
  }
});

// 2. Create Order API (Bypasses Razorpay, Generates a Mock Order)
router.post('/create-order', getOptionalUser, async (req: AuthRequest, res: Response) => {
  const { assessmentId, planType, couponCode } = req.body;
  const userId = req.user?.id || null;

  if (!assessmentId || !planType) {
    return res.status(400).json({ error: 'Assessment ID and Plan Type are required.' });
  }

  // Base pricing: Basic = 99 INR, Premium = 149 INR
  let baseAmount = planType === 'premium' ? 149 : 99;
  let discountPercent = 0;

  try {
    // Validate Assessment
    const assessResult = await query('SELECT status, user_id FROM assessments WHERE id = $1', [assessmentId]);
    if (assessResult.rowCount === 0) {
      return res.status(404).json({ error: 'Assessment not found.' });
    }
    const assessment = assessResult.rows[0];
    const finalUserId = userId || assessment.user_id || 'anonymous';

    // Apply Coupon if present
    if (couponCode) {
      const couponResult = await query(
        `SELECT * FROM coupon_codes 
         WHERE code = $1 AND active = 1 AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)`,
        [couponCode.toUpperCase()]
      );

      if (couponResult.rowCount > 0) {
        const coupon = couponResult.rows[0];
        if (coupon.current_uses < coupon.max_uses) {
          discountPercent = coupon.discount_percent;
        }
      }
    }

    const discountAmount = Math.round((baseAmount * discountPercent) / 100);
    const finalAmount = Math.max(0, baseAmount - discountAmount);

    const mockPaymentId = 'pay_mock_' + crypto.randomBytes(8).toString('hex');
    const mockOrderId = 'order_mock_' + crypto.randomBytes(8).toString('hex');

    // If final amount is 0 (e.g. 100% discount coupon)
    if (finalAmount === 0) {
      // Create pre-approved payment in database
      await query(
        `INSERT INTO payments (id, user_id, assessment_id, razorpay_order_id, razorpay_payment_id, razorpay_signature, amount, status, plan_type)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [crypto.randomUUID(), finalUserId, assessmentId, mockOrderId, mockPaymentId, 'mock_free_signature_bypass', 0, 'captured', planType]
      );

      // Update assessment status to paid
      await query('UPDATE assessments SET status = $1 WHERE id = $2', ['paid', assessmentId]);
      
      // Update user ID on results if user was anonymous initially but is logged in now
      await query('UPDATE results SET user_id = $1 WHERE assessment_id = $2', [finalUserId, assessmentId]);

      // If coupon was used, increment usage
      if (couponCode) {
        await query('UPDATE coupon_codes SET current_uses = current_uses + 1 WHERE code = $1', [couponCode.toUpperCase()]);
      }

      return res.json({
        success: true,
        freeUnlock: true,
        message: 'Assessment unlocked for free.'
      });
    }

    // Record mock order in payments table
    await query(
      `INSERT INTO payments (id, user_id, assessment_id, razorpay_order_id, amount, status, plan_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [crypto.randomUUID(), finalUserId, assessmentId, mockOrderId, finalAmount, 'pending', planType]
    );

    // If coupon was used, increment usage
    if (couponCode) {
      await query('UPDATE coupon_codes SET current_uses = current_uses + 1 WHERE code = $1', [couponCode.toUpperCase()]);
    }

    res.json({
      success: true,
      freeUnlock: false,
      isMock: true,
      orderId: mockOrderId,
      amount: finalAmount,
      currency: 'INR'
    });
  } catch (error) {
    console.error('[Create Order Error]:', error);
    res.status(500).json({ error: 'Failed to initiate payment.' });
  }
});

// 3. Verify Payment API (Directly Approves the Mock Payments)
router.post('/verify', getOptionalUser, async (req: AuthRequest, res: Response) => {
  const { assessmentId, razorpayOrderId, razorpayPaymentId } = req.body;
  const userId = req.user?.id || null;

  if (!assessmentId || !razorpayOrderId) {
    return res.status(400).json({ error: 'Missing payment verification tokens.' });
  }

  try {
    const paymentId = razorpayPaymentId || 'pay_mock_' + crypto.randomBytes(8).toString('hex');
    const mockSignature = 'sig_mock_' + crypto.randomBytes(8).toString('hex');

    // Signature matches, update payment record
    await query(
      "UPDATE payments SET status = 'captured', razorpay_payment_id = $1, razorpay_signature = $2 WHERE razorpay_order_id = $3",
      [paymentId, mockSignature, razorpayOrderId]
    );

    // Fetch payment details to determine plan type
    const payResult = await query('SELECT user_id, plan_type FROM payments WHERE razorpay_order_id = $1', [razorpayOrderId]);
    const planType = payResult.rowCount > 0 ? payResult.rows[0].plan_type : 'basic';
    const paymentUserId = payResult.rowCount > 0 ? payResult.rows[0].user_id : userId;

    // Update assessment status to paid
    await query('UPDATE assessments SET status = $1 WHERE id = $2', ['paid', assessmentId]);
    
    // Update user ID on results
    if (paymentUserId) {
      await query('UPDATE results SET user_id = $1 WHERE assessment_id = $2', [paymentUserId, assessmentId]);
    }

    res.json({
      success: true,
      message: 'Mock Payment verified and report unlocked successfully.',
      planType
    });
  } catch (error) {
    console.error('[Verify Payment Error]:', error);
    res.status(500).json({ error: 'Failed to verify payment.' });
  }
});

export default router;
