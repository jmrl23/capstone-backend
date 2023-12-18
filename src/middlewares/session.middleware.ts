import { vendors, wrapper } from '@jmrl23/express-helper';
import { UserService } from '../services/user.service';
import expressSession from 'express-session';
import env from 'env-var';
import RedisStore from 'connect-redis';
import { createClient } from 'redis';

const redisClient = createClient({
  url: env.get('REDIS_URL').default('redis://').asString(),
});

redisClient.connect().catch(console.error);

const redisStore = new RedisStore({
  client: redisClient,
  prefix: 'session:',
});

export const sessionMiddleware = expressSession({
  secret: env.get('SESSION_SECRET').default('').asString(),
  store: redisStore,
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure:
      env.get('NODE_ENV').default('development').asString() === 'production',
  },
});

export const [bindUserSessionMiddleware] = wrapper(
  async function (request, _response, next) {
    const userId = request.session.userId;

    if (!userId) {
      next();

      return;
    }

    const userService = await UserService.getInstance();
    const user = await userService.getUserById(userId);

    request.user = user;

    next();
  },
);

export const [sessionRequired] = wrapper(function (request, _response, next) {
  if (!request.user)
    throw new vendors.httpErrors.Unauthorized('Session required');

  next();
});
