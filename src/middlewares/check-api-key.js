import { Router } from 'express';
import httpStatus from 'http-status';

import ApiError from '../utils/api-error.js';

const adminKey = process.env.ADMIN_KEY;
if (!adminKey) throw Error('No Such Admin-Key');

const router = Router();

router.all('/', async (req, _res, next) => {
  if (adminKey !== req.headers.authorization) {
    next(new ApiError(httpStatus.UNAUTHORIZED, 'Check your request authorization header.'));
  }

  next();
});

export default router;
