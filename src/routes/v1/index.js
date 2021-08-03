import { Router } from 'express';

const router = Router();

router.get('/', async (_req, res) => {
  res.json({ hello: 'world' });
});

router.post('/', async (req, res) => {
  const { db } = req.app.locals;

  const data = await db.collection('todo').find({ deleted: null }).toArray();

  res.json({ post: data });
});

export default router;
