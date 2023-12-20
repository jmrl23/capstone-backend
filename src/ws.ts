import { type Server as HttpServer } from 'node:http';
import { Server as SocketIoServer } from 'socket.io';
import { client as mqtt } from './mqtt';
import { UserService } from './services/user.service';
import { DeviceService } from './services/device.service';
import { TOPICS } from './utils/constants';
import { default as env } from 'env-var';
import { vendors } from '@jmrl23/express-helper';

export async function ws(httpServer: HttpServer) {
  const io = new SocketIoServer(httpServer, {
    serveClient: false,
    cors: {
      origin: (origin, next) => {
        const origins = env.get('CORS_ORIGIN').asArray();
        if (!origin) return next(null);
        if (!origins?.includes(origin))
          return next(new vendors.httpErrors.Unauthorized('Blocked by CORS'));
        next(null, origin);
      },
    },
  });
  const userService = await UserService.getInstance();
  const deviceService = await DeviceService.getInstance();

  io.on('connection', async function (socket) {
    const userId = socket.handshake.auth.userId;
    const user = await userService.getUserById(userId);

    if (!user) {
      socket.disconnect(true);
      return;
    }

    socket.on('mqtt:subscribe', async (topic: string) => {
      const [, key] = topic.split(':');
      const devices = await deviceService.getDevicesByUserId(user.id);
      const keys = devices.map((device) => device.deviceKey);

      if (!keys.includes(key)) return;

      mqtt.subscribe(topic);
    });

    socket.on('mqtt:unsubscribe', async (topic: string) => {
      const [, key] = topic.split(':');
      const devices = await deviceService.getDevicesByUserId(user.id);
      const keys = devices.map((device) => device.deviceKey);

      if (!keys.includes(key)) return;

      mqtt.unsubscribe(topic);
    });

    socket.on('mqtt:publish', async (topic: string, message: string) => {
      const [, key] = topic.split(':');
      const devices = await deviceService.getDevicesByUserId(user.id);
      const keys = devices.map((device) => device.deviceKey);

      if (!keys.includes(key)) return;

      mqtt.publish(topic, message);
    });
  });

  // Note: Only subscribed topics through the application will be captured
  mqtt.on('message', async (_topic, payload) => {
    const [topic, key] = _topic.split(':');
    const message = payload.toString();
    const device = await deviceService.getDeviceByKey(key);

    if (!device) return;

    switch (topic) {
      case TOPICS.B_SYNC: {
        mqtt.publish(
          `${TOPICS.I_SYNC}:${key}`,
          device.DeviceData.isRinging ? '1' : '0',
        );
        mqtt.publish(`${TOPICS.A_SYNC}:${key}`, '');
        break;
      }

      case TOPICS.I_PRESS: {
        await deviceService.addDeviceDataPress(device.id);
        mqtt.publish(`${TOPICS.B_SYNC}:${key}`, '');
        break;
      }

      case TOPICS.A_RING: {
        const states = ['OFF', 'ON'];
        const index = states.indexOf(message);
        const state = Boolean(index);
        if (index < 0) return;
        await deviceService.toggleAlarmById(device.id, state);
        mqtt.publish(`${TOPICS.B_SYNC}:${key}`, '');
        break;
      }
    }

    if (topic !== TOPICS.A_SYNC) return;

    for (const [, socket] of io.sockets.sockets) {
      const userId = socket.handshake.auth.userId;
      const user = await userService.getUserById(userId);

      if (!user) continue;

      const devices = await deviceService.getDevicesByUserId(user.id);
      const device = devices.find((device) => device.deviceKey === key);

      if (!device) continue;

      const data = {
        timestamp: Date.now(),
        topic: {
          raw: _topic,
          parsed: topic,
        },
        message,
        device,
      };

      socket.emit('mqtt:message', data);
    }
  });
}
