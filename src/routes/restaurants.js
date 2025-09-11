// src/routes/restaurants.js
import express from 'express';
import jwt from 'jsonwebtoken';
import Restaurant from '../models/restaurant.js'; // adjust extension if needed

const router = express.Router();

/**
 * Public: list restaurants (paged & searchable)
 */
router.get('/', async (req, res, next) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;
    const filter = q ? { name: { $regex: q, $options: 'i' } } : {};
    const skip = (Number(page) - 1) * Number(limit);
    const docs = await Restaurant.find(filter).skip(skip).limit(Number(limit));
    const total = await Restaurant.countDocuments(filter);
    res.json({ data: docs, meta: { total, page: Number(page), limit: Number(limit) } });
  } catch (err) {
    next(err);
  }
});

/**
 * Protected: create restaurant.
 * Inline JWT verification used to avoid middleware issues while we debug auth middleware.
 * Requires header: Authorization: Bearer <token>
 * Token payload must include role: 'admin' (or admin override).
 */
router.post('/', async (req, res, next) => {
  try {
    // --- Inline auth check (safe & explicit) ---
    const authHeader = req.headers?.authorization;
    if (!authHeader) return res.status(401).json({ msg: 'No authorization header' });

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ msg: 'Malformed authorization header' });

    const token = parts[1];
    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ msg: 'Invalid or expired token' });
    }

    // Check role
    if (!payload?.role || (payload.role !== 'admin' && payload.role !== 'restaurant')) {
      return res.status(403).json({ msg: 'Forbidden: insufficient role' });
    }
    // ------------------------------------------------

    // Validate body
    const { name, description = '', imageUrl = '', menu = [] } = req.body || {};
    if (!name) return res.status(400).json({ msg: 'Name is required' });

    const newRest = await Restaurant.create({
      name,
      description,
      imageUrl,
      menu: Array.isArray(menu) ? menu : []
    });

    return res.status(201).json(newRest);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ msg: 'Missing id param' });
    const r = await Restaurant.findById(id);
    if (!r) return res.status(404).json({ msg: 'Restaurant not found' });
    res.json(r);
  } catch (err) {
    // If invalid ObjectId format, return 400
    if (err.name === 'CastError') return res.status(400).json({ msg: 'Invalid id format' });
    next(err);
  }
});

export default router;
