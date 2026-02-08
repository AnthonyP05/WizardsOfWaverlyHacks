/**
 * Auth Routes — Register, Login, Profile
 * 
 * POST /api/auth/register  — Create a new account
 * POST /api/auth/login     — Get a JWT token
 * GET  /api/auth/profile   — Get logged-in user info (requires token)
 * PUT  /api/auth/profile   — Update zip code (requires token)
 */

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'recyclelocal-dev-secret-change-in-production';
const JWT_EXPIRES_IN = '7d'; // Token valid for 7 days
const BCRYPT_ROUNDS = 10;

// ============================================
// POST /register — Create a new user
// ============================================
router.post('/register', async (req, res) => {
  try {
    const { username, password, zip_code } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    if (username.length < 3 || username.length > 50) {
      return res.status(400).json({ error: 'Username must be 3-50 characters' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if username already taken
    const [existing] = await pool.execute(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // Insert the user
    const [result] = await pool.execute(
      'INSERT INTO users (username, password_hash, zip_code) VALUES (?, ?, ?)',
      [username, passwordHash, zip_code || null]
    );

    // Generate JWT
    const token = jwt.sign(
      { id: result.insertId, username },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(201).json({
      message: 'Account created',
      token,
      user: {
        id: result.insertId,
        username,
        zip_code: zip_code || null
      }
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// ============================================
// POST /login — Authenticate and get token
// ============================================
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Find user
    const [rows] = await pool.execute(
      'SELECT id, username, password_hash, zip_code FROM users WHERE username = ?',
      [username]
    );
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const user = rows[0];

    // Compare password with stored hash
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        zip_code: user.zip_code
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ============================================
// GET /profile — Get current user info
// ============================================
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, username, zip_code, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: rows[0] });
  } catch (err) {
    console.error('Profile error:', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// ============================================
// PUT /profile — Update zip code
// ============================================
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { zip_code } = req.body;

    await pool.execute(
      'UPDATE users SET zip_code = ? WHERE id = ?',
      [zip_code || null, req.user.id]
    );

    res.json({ message: 'Profile updated', zip_code });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

module.exports = router;
