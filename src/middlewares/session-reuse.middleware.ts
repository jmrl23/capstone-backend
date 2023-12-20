import { wrapper } from '@jmrl23/express-helper';

/**
 * HAX:
 *
 * This is just a "HAX" since I'm having a tough time in terms of
 * connecting/ sharing the session between frontend and backend.
 * cookies are acting strange, perhaps I don't understand it yet
 * that much. But yea, lets use this for now.
 *
 * It requires the frontend/ client-side to send the session id
 * used when they successfully logged in an account through
 * authorization header with a bearer scheme. Don't worry, this
 * about being insecure, when the user activates the logout endpoint,
 * the session will be destroyed also.
 */
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
