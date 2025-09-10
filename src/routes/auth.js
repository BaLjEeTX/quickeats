import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/user.js'; // ensure `.js` extension in ESM imports

const authRouter = express.Router();

authRouter.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ msg: 'Missing fields' });
  }

  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(400).json({ msg: 'Email exists' });
  }

  const hash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, passwordHash: hash });

  res.status(201).json({ id: user._id, email: user.email });
});

authRouter.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    return res.status(401).json({ msg: 'Invalid credentials' });
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return res.status(401).json({ msg: 'Invalid credentials' });
  }

  const accessToken = jwt.sign(
    { sub: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { sub: user._id },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({ accessToken, refreshToken });
});

export default authRouter;
