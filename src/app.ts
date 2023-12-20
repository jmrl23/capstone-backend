import env from 'env-var';
import express from 'express';
import { corsMiddleware } from './middlewares/cors.middleware';
import { join } from 'node:path';
import { yellow } from 'colorette';
import { logger } from './utils/logger';
import { morganMiddleware } from './middlewares/morgan.middleware';
import {
  errorHandler,
  registerControllers,
  vendors,
  wrapper,
} from '@jmrl23/express-helper';
import {
  bindUserSessionMiddleware,
  sessionMiddleware,
} from './middlewares/session.middleware';
import { Prisma } from '@prisma/client';
import { prismaError as PrismaError } from 'prisma-better-errors';
import { sessionReuseMiddleware } from './middlewares/session-reuse.middleware';

export const app = express();

// configurations
app.disable('x-powered-by');
app.set('trust proxy', 1);

// middlewares
app.use(
  morganMiddleware(),
  corsMiddleware({
    origin: (origin, next) => {
      const origins = env.get('CORS_ORIGIN').asArray();
      if (!origin) return next(null);
      if (!origins?.includes(origin))
        return next(new vendors.httpErrors.Unauthorized('Blocked by CORS'));
      next(null, origin);
    },
    credentials: true,
  }),
  express.json({
    strict: true,
  }),
  express.urlencoded({
    extended: true,
  }),
  sessionMiddleware,
  sessionReuseMiddleware,
  bindUserSessionMiddleware,
);

// public directory
app.use(express.static(join(__dirname, '../public')));

// controllers/ routes
const controllers = registerControllers(
  join(__dirname, './controllers'),
  '/',
  (controllers) => {
    for (const { filePath, controller } of controllers) {
      logger.info(
        `Controller ${yellow('Register')} {%s => %s}`,
        controller,
        filePath,
      );
    }
  },
);
app.use(controllers);

app.use(
  // 404 error
  wrapper((request) => {
    throw new vendors.httpErrors.NotFound(
      `Cannot ${request.method} ${request.path}`,
    );
  }),
  // custom error handler
  errorHandler((error, _request, _response, next) => {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      error = new PrismaError(error);
    }

    if (!(error instanceof vendors.httpErrors.HttpError)) {
      if (error instanceof Error) {
        if ('statusCode' in error && typeof error.statusCode === 'number') {
          error = vendors.httpErrors.createHttpError(
            error.statusCode,
            error.message,
          );
        }
      }
    }

    if (error instanceof Error) {
      logger.error(error.stack);
    }

    next(error);
  }),
);
