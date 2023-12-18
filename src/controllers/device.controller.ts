import { Router } from 'express';
import { sessionRequired } from '../middlewares/session.middleware';
import { DeviceRegisterDto } from '../dtos/DeviceRegister.dto';
import { validate, wrapper } from '@jmrl23/express-helper';
import { DeviceService } from '../services/device.service';
import { ParamIdDto } from '../dtos/ParamId.dto';

export const controller = Router();

(async function () {
  const deviceService = await DeviceService.getInstance();

  controller

    .use(sessionRequired)

    /**
     * @openapi
     *
     * /device/register:
     *  post:
     *    tags:
     *      - device
     *    summary: register device
     *    requestBody:
     *      content:
     *        application/json:
     *          schema:
     *            type: object
     *            properties:
     *              device_key:
     *                type: string
     *                required: true
     *            example:
     *              device_key: "EIOT-0000000001"
     *    responses:
     *      '200':
     *        description: Successful response
     *        content:
     *          application/json: {}
     */

    .post(
      '/register',
      validate('BODY', DeviceRegisterDto),
      wrapper(async function (request) {
        const userId = request.user?.id;
        const device = await deviceService.register(
          userId!,
          request.body.device_key,
        );

        return {
          device,
        };
      }),
    )

    /**
     * @openapi
     *
     * /device/unregister/{id}:
     *  delete:
     *    tags:
     *      - device
     *    summary: unregister device from a user
     *    parameters:
     *      - in: path
     *        name: id
     *        schema:
     *          type: string
     *          format: uuid
     *          required: true
     *    responses:
     *      '200':
     *        description: Successful response
     *        content:
     *          application/json: {}
     */

    .delete(
      '/unregister/:id',
      validate('PARAMS', ParamIdDto),
      wrapper(async function (request) {
        const userId = request.user?.id;
        const device = await deviceService.unregister(
          request.params.id,
          userId!,
        );

        return {
          device,
        };
      }),
    )

    /**
     * @openapi
     *
     * /device/list:
     *  get:
     *    tags:
     *      - device
     *    summary: get device list
     *    responses:
     *      '200':
     *        description: Successful response
     *        content:
     *          application/json: {}
     */

    .get(
      '/list',
      wrapper(async function (request) {
        const userId = request.user?.id;
        const devices = await deviceService.getDevicesByUserId(userId!);

        return {
          devices,
        };
      }),
    );
})();
