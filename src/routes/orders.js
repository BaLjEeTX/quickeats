// src/routes/orders.js  (ESM-safe)
import express from 'express';
const router = express.Router();

let auth = null;
let _importErrors = [];

async function loadAuthMiddleware() {
  // Try mjs first, then js (CommonJS compiled-to-ESM default), then fallback
  const candidates = [
    '../middleware/auth.mjs',
    '../middleware/auth.js',
    '../middleware/auth.cjs',
    '../middleware/auth' // last-ditch
  ];

  for (const path of candidates) {
    try {
      // dynamic import returns a module object; prefer default export if present
      const mod = await import(path);
      auth = mod.default ?? mod;
      if (typeof auth === 'function') {
        console.log(`[orders] loaded auth middleware from ${path} (type=${typeof auth})`);
        return;
      } else {
        _importErrors.push({ path, type: typeof auth, note: 'not a function' });
      }
    } catch (e) {
      _importErrors.push({ path, error: e && e.message ? e.message : String(e) });
    }
  }

  // final fallback: middleware that returns 500 with debug details
  auth = (req, res, next) => {
    console.error('[orders] AUTH MIDDLEWARE MISSING', _importErrors);
    return res.status(500).json({ msg: 'Server misconfigured: auth middleware not found', info: _importErrors });
  };
}

// Ensure middleware is loaded before routes use it
await loadAuthMiddleware();

// Models (use your existing model files)
import Restaurant from '../models/restaurant.js';
import Order from '../models/order.js';

// Create order
router.post('/', auth, async (req, res, next) => {
  try {
    const { restaurantId, items } = req.body;
    if (!restaurantId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ msg: 'Invalid payload' });
    }

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) return res.status(404).json({ msg: 'Restaurant not found' });

    let total = 0;
    const orderItems = items.map(i => {
      const menuItem = restaurant.menu.find(m => m._id.toString() === i.itemId);
      if (!menuItem) throw new Error(`Menu item not found: ${i.itemId}`);
      const qty = Number(i.qty) || 1;
      const price = Number(menuItem.price) || 0;
      total += price * qty;
      return { itemId: menuItem._id, name: menuItem.name, price, qty };
    });

    const order = await Order.create({
      userId: req.user.id,
      restaurantId,
      items: orderItems,
      total,
      status: 'placed'
    });

    res.status(201).json(order);
  } catch (err) {
    if (err.message && err.message.startsWith('Menu item not found')) {
      return res.status(400).json({ msg: err.message });
    }
    next(err);
  }
});

// List orders for logged-in user
router.get('/', auth, async (req, res, next) => {
  try {
    const orders = await Order.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(50);
    res.json(orders);
  } catch (err) {
    next(err);
  }
});

// Get single order (only owner or admin)
router.get('/:id', auth, async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ msg: 'Order not found' });
    if (order.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Forbidden' });
    }
    res.json(order);
  } catch (err) {
    next(err);
  }
});

export default router;
