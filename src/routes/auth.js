// src/routes/auth.js
import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/user.js';

const router = express.Router();

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS || 10);
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

router.post('/signup', async (req, res, next) => {
  try {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password) return res.status(400).json({ msg: 'Missing fields' });

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ msg: 'Email exists' });

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await User.create({ name, email, passwordHash, role: 'user' });
    return res.status(201).json({ id: user._id, email: user.email });
  } catch (err) {
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ msg: 'Missing credentials' });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ msg: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.passwordHash || '');
    if (!ok) return res.status(401).json({ msg: 'Invalid credentials' });

    const accessToken = jwt.sign({ sub: user._id.toString(), role: user.role }, JWT_SECRET, { expiresIn: '1h' });
    const refreshToken = jwt.sign({ sub: user._id.toString() }, JWT_SECRET, { expiresIn: '7d' });

    return res.json({ accessToken, refreshToken });
  } catch (err) {
    next(err);
  }
});

export default router;
