import { Router } from 'express';
import tradeRouter from './trade.js';

const router = Router();

router.get('/', async (_req, res) => {
  res.json({ hello: 'test' });
});

router.post('/', async (req, res) => {
  const { db } = req.app.locals;

  const data = await db.collection('todo').find({ deleted: null }).toArray();

  res.json({ post: data });
});

router.use('/trade', tradeRouter);

export default router;
