import env from 'env-var';
import { connect } from 'mqtt';
import { logger } from './utils/logger';

export const brokerURL = env
  .get('MQTT_BROKER_URL')
  .default('mqtt://test.mosquitto.org')
  .asString();

const username = env.get('MQTT_AUTH_USERNAME').asString();
const password = env.get('MQTT_AUTH_PASSWORD').asString();

export const client = connect(brokerURL, {
  username,
  password,
});

// loggers
client.on('message', (topic, buffer) => {
  const message = buffer.toString();

  logger.debug('MQTT message: %s', JSON.stringify({ topic, message }));
});

client.on('disconnect', (packet) => {
  logger.debug(`MQTT disconnected: ${packet.reasonCode}`);
});
