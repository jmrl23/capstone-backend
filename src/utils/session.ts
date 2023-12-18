import type { Session } from 'express-session';

export async function saveSession(session: Session): Promise<void> {
  new Promise((resolve) => {
    session.save((error) => {
      if (!error) {
        resolve(void 0);

        return;
      }

      if (error instanceof Error) throw Error;
      throw new Error('An error occurs');
    });
  });
}
