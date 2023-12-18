import './init';
import env from 'env-var';
import detectPort from 'detect-port';
import { server } from './server';
import { underline } from 'colorette';
import { logger } from './utils/logger';
import { getURL } from './utils/server';
import { ws } from './ws';

async function main(): Promise<void> {
  const port = await detectPort(env.get('PORT').default(3001).asPortNumber());

  server.listen(port, async () => {
    await ws(server);

    logger.info(underline(getURL(server)));
  });
}

void main();
