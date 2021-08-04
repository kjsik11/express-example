import { Router } from 'express';

import tradeRouter from './trade.js';

const router = Router();

// v1
// routers
router.use('/trade', tradeRouter);

export default router;
