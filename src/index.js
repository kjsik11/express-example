import { MongoClient } from 'mongodb';
import app from './app.js';
import { port } from './config/config.js';
import { logger } from './config/logger.js';

const mongoUri = process.env.MONGODB_URI;
const mongoName = process.env.MONGODB_NAME;

if (!mongoUri) throw Error('There is no mongoUri');
if (!mongoName) throw Error('There is no mongoName');

MongoClient.connect(mongoUri)
  .then((client) => {
    app.locals.db = client.db(mongoName);

    const server = app.listen(port, () => {
      logger.info(`Listening to port ${port}`);
    });

    const unexpectedErrorHandler = (error) => {
      logger.error(error);
      if (server) {
        server.close(() => {
          logger.info('Server closed');
          process.exit(1);
        });
      } else {
        process.exit(1);
      }
    };

    process.on('uncaughtException', unexpectedErrorHandler);
    process.on('unhandledRejection', unexpectedErrorHandler);

    process.on('SIGTERM', () => {
      logger.info('SIGTERM received');
      if (server) {
        server.close();
      }
    });
  })
  .catch((err) => {
    console.error(err);
  });
