import { Router } from 'express';
import { UserService } from '../services/user.service';
import { validate, vendors, wrapper } from '@jmrl23/express-helper';
import { saveSession } from '../utils/session';
import { UserRegisterDto } from '../dtos/UserRegister.dto';
import { UserLoginDto } from '../dtos/UserLogin.dto';
import { sessionRequired } from '../middlewares/session.middleware';
import { UserUpdateDto } from '../dtos/UserUpdate.dto';

export const controller = Router();

(async function () {
  const userService = await UserService.getInstance();

  controller

    /**
     * @openapi
     *
     * /user/session:
     *  get:
     *    tags:
     *      - user
     *    summary: get user session
     *    responses:
     *      '200':
     *        description: Successful response
     *        content:
     *          application/json: {}
     */

    .get(
      '/session',
      wrapper(function (request) {
        const user = request.user ?? null;

        return {
          user,
        };
      }),
    )

    /**
     * @openapi
     *
     * /user/register:
     *  post:
     *    tags:
     *      - user
     *    summary: register user
     *    requestBody:
     *      content:
     *        application/json:
     *          schema:
     *            type: object
     *            properties:
     *              username:
     *                type: string
     *                required: true
     *              password:
     *                type: string
     *                format: password
     *                required: true
     *            example:
     *              username: "user1"
     *              password: "password1"
     *    responses:
     *      '200':
     *        description: Successful response
     *        content:
     *          application/json: {}
     */

    .post(
      '/register',
      validate('BODY', UserRegisterDto),
      wrapper(async function (request) {
        const user = await userService.register(
          request.body.username,
          request.body.password,
          request.body.image_url,
          request.body.display_name,
        );

        return {
          user,
        };
      }),
    )

    /**
     * @openapi
     *
     * /user/login:
     *  post:
     *    tags:
     *      - user
     *    summary: login user
     *    requestBody:
     *      content:
     *        application/json:
     *          schema:
     *            type: object
     *            properties:
     *              username:
     *                type: string
     *                required: true
     *              password:
     *                type: string
     *                format: password
     *                required: true
     *            example:
     *              username: "user1"
     *              password: "password1"
     *    responses:
     *      '200':
     *        description: Successful response
     *        content:
     *          application/json: {}
     */

    .post(
      '/login',
      validate('BODY', UserLoginDto),
      wrapper(async function (request) {
        const user = await userService.login(
          request.body.username,
          request.body.password,
        );

        request.session.userId = user.id;

        await saveSession(request.session);

        return {
          cid: request.sessionID,
        };
      }),
    )

    /**
     * @openapi
     *
     * /user/update:
     *  patch:
     *    tags:
     *      - user
     *    summary: update user
     *    requestBody:
     *      content:
     *        application/json:
     *          schema:
     *            type: object
     *            properties:
     *              old_password:
     *                type: string
     *                format: password
     *              password:
     *                type: string
     *                format: password
     *              image_url:
     *                type: string
     *              display_name:
     *                type: string
     *            example:
     *              image_url: "https://makeplaceholder.com/?size=150x150"
     *    responses:
     *      '200':
     *        description: Successful response
     *        content:
     *          application/json: {}
     */

    .patch(
      '/update',
      sessionRequired,
      validate('BODY', UserUpdateDto),
      wrapper(async function (request) {
        const userId = request.user?.id;
        const user = await userService.update(
          userId!,
          request.body.old_password,
          request.body.password,
          request.body.image_url,
          request.body.display_name,
        );

        return {
          user,
        };
      }),
    )

    /**
     * @openapi
     *
     * /user/logout:
     *  delete:
     *    tags:
     *      - user
     *    summary: logout user
     *    responses:
     *      '200':
     *        description: Successful response
     *        content:
     *          application/json: {}
     */

    .delete(
      '/logout',
      sessionRequired,
      wrapper(async function (request) {
        return new Promise<{ success: boolean }>((resolve) => {
          request.session.destroy((error) => {
            if (!error) return resolve({ success: true });
            throw new vendors.httpErrors.BadRequest();
          });
        });
      }),
    );
})();
