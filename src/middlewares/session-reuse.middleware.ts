import { wrapper } from '@jmrl23/express-helper';

export const [sessionReuseMiddleware] = wrapper(
  function (request, _response, next) {
    const [scheme, sessionId] =
      request.header('Authorization')?.split(' ') ?? [];

    if (scheme !== 'Bearer' || sessionId === request.sessionID) return next();

    request.sessionStore.get(sessionId, (error, session) => {
      if (error || !session) return next();
      request.sessionStore.destroy(request.sessionID);
      request.sessionStore.createSession(request, session);
      next();
    });
  },
);
