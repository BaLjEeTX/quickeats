// src/middleware/auth.mjs
import jwt from 'jsonwebtoken';

export default function authMiddleware(req, res, next) {
  try {
    if (!req || !res) return next(new Error('Auth middleware used incorrectly'));
    const header = req.headers?.authorization;
    if (!header) return res.status(401).json({ msg: 'No authorization header' });

    const parts = header.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({ msg: 'Malformed authorization header' });
    }

    const token = parts[1];
    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
    } catch (err) {
      return res.status(401).json({ msg: 'Invalid or expired token' });
    }

    req.user = { id: payload.sub, role: payload.role };
    return next();
  } catch (err) {
    console.error('authMiddleware error:', err && err.message ? err.message : err);
    return res.status(500).json({ msg: 'Server auth error' });
  }
}
