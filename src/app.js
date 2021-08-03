import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import cors from 'cors';
import httpStatus from 'http-status';
import xss from 'xss-clean';

import { successLogger, errorLogger } from './config/morgan.js';
import { env } from './config/config.js';
import routes from './routes/v1/index.js';
import ApiError from './utils/api-error.js';
import { errorConverter, errorHandler } from './middlewares/error.js';

const app = express();

if (env !== 'test') {
  app.use(successLogger);
  app.use(errorLogger);
}

// middlewares
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(xss());
app.use(compression());
app.use(express.static('public'));
app.use(cors());
app.options('*', cors());

if (env === 'production') {
  // TODO: api limiter ??
}

// Api routes
app.use('/v1', routes);
// 404 error
app.use((_req, _res, next) => {
  next(new ApiError(httpStatus.NOT_FOUND, 'Not found'));
});

// Convert error to ApiError, if needed.
app.use(errorConverter);

// Handle uncaught error.
app.use(errorHandler);

export default app;
