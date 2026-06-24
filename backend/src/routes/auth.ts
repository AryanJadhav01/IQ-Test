import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { query } from '../config/db';
import { AuthRequest } from '../middleware/auth';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'college_simplified_super_secret_jwt_key_2026';

// Register Route
router.post('/register', async (req: AuthRequest, res: Response) => {
  const { fullName, email, password, assessmentId, university, platformRole, phone, age } = req.body;

  if (!fullName || !email || !password) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  try {
    // Check if user already exists
    const userCheck = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (userCheck.rowCount > 0) {
      return res.status(400).json({ error: 'User with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const userId = crypto.randomUUID();

    // Determine role (default is user, first user is admin or we can check special domain)
    // For local convenience, let's make admin@collegesimplified.in or similar admin by default
    const role = email.toLowerCase().endsWith('@collegesimplified.in') || email.toLowerCase() === 'admin@gmail.com' ? 'admin' : 'user';

    await query(
      'INSERT INTO users (id, full_name, email, password_hash, role, university, platform_role, phone, age) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
      [userId, fullName, email.toLowerCase(), passwordHash, role, university || null, platformRole || null, phone || null, age ? Number(age) : null]
    );

    // Bind anonymous assessment if assessmentId is passed
    if (assessmentId) {
      await query('UPDATE assessments SET user_id = $1 WHERE id = $2', [userId, assessmentId]);
      await query('UPDATE results SET user_id = $1 WHERE assessment_id = $2', [userId, assessmentId]);
    }

    // Generate JWT token
    const token = jwt.sign({ id: userId, email: email.toLowerCase(), role }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'Account created successfully.',
      token,
      user: { 
        id: userId, 
        fullName, 
        email: email.toLowerCase(), 
        role,
        university: university || null,
        platformRole: platformRole || null,
        phone: phone || null,
        age: age ? Number(age) : null
      }
    });
  } catch (error) {
    console.error('[Auth Register Error]:', error);
    res.status(500).json({ error: 'Failed to create account.' });
  }
});

// Login Route
router.post('/login', async (req: AuthRequest, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const userResult = await query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    if (userResult.rowCount === 0) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    const user = userResult.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Login successful.',
      token,
      user: { 
        id: user.id, 
        fullName: user.full_name, 
        email: user.email, 
        role: user.role,
        university: user.university || null,
        platformRole: user.platform_role || null,
        phone: user.phone || null,
        age: user.age ? Number(user.age) : null
      }
    });
  } catch (error) {
    console.error('[Auth Login Error]:', error);
    res.status(500).json({ error: 'Internal server error during login.' });
  }
});

export default router;
