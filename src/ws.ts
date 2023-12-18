import { type Server as HttpServer } from 'node:http';
import { Server as SocketIoServer } from 'socket.io';
import { client as mqtt } from './mqtt';
import { sessionMiddleware } from './middlewares/session.middleware';
import { UserService } from './services/user.service';
import { DeviceService } from './services/device.service';
import { TOPICS } from './utils/constants';
import { default as env } from 'env-var';

export async function ws(httpServer: HttpServer) {
  const io = new SocketIoServer(httpServer, {
    serveClient: false,
    cors: {
      origin: env.get('CORS_ORIGIN').asString(),
      credentials: true,
    },
  });
  const userService = await UserService.getInstance();
  const deviceService = await DeviceService.getInstance();

  io.engine.use(sessionMiddleware);

  io.on('connection', async function (socket) {
    const request = socket.request as unknown as Express.Request;
    const user = await userService.getUserById(request.session.userId ?? '');

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

    socket.on('mqtt:publish', async (topic: string, message: string) => {
      const [, key] = topic.split(':');
      const devices = await deviceService.getDevicesByUserId(user.id);
      const keys = devices.map((device) => device.deviceKey);

      if (!keys.includes(key)) return;

      mqtt.publish(topic, message);
    });

    // Note: Only subscribed topics through the application will be captured
    mqtt.on('message', async (_topic, payload) => {
      const [topic, key] = _topic.split(':');
      const message = payload.toString();
      const device = await deviceService.getDeviceByKey(key);

      switch (topic) {
        case TOPICS.I_PRESS: {
          await deviceService.addDeviceDataPress(device.id);
          mqtt.publish(`${TOPICS.A_SYNC}:${key}`, '');
          mqtt.publish(
            `${TOPICS.I_SYNC}:${key}`,
            device.DeviceData.isRinging ? '1' : '0',
          );
          break;
        }

        case TOPICS.A_RING: {
          const states = ['OFF', 'ON'];
          const index = states.indexOf(message);
          const state = Boolean(index);
          if (index < 0) return;
          await deviceService.toggleAlarmById(device.id, state);
          mqtt.publish(`${TOPICS.A_SYNC}:${key}`, '');
          mqtt.publish(
            `${TOPICS.I_SYNC}:${key}`,
            device.DeviceData.isRinging ? '1' : '0',
          );
          break;
        }
      }

      for (const [, socket] of io.sockets.sockets) {
        const request = socket.request as unknown as Express.Request;
        const user = await userService.getUserById(
          request.session.userId ?? '',
        );

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
  });
}
