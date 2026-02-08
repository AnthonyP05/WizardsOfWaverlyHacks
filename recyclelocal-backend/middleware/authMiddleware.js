/**
 * JWT Authentication Middleware
 * 
 * Verifies the Bearer token from the Authorization header.
 * Attach to any route that requires a logged-in user:
 *
 *   router.get('/profile', authMiddleware, (req, res) => {
 *     // req.user has { id, username }
 *   });
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'recyclelocal-dev-secret-change-in-production';

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided. Send Authorization: Bearer <token>' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // Attach user info to the request for downstream handlers
    req.user = { id: decoded.id, username: decoded.username };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = authMiddleware;
