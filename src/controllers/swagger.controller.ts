import { Router } from 'express';
import { serve, setup } from 'swagger-ui-express';
import { default as swaggerJsDoc, type OAS3Options } from 'swagger-jsdoc';
import { default as env } from 'env-var';

export const controller = Router();

(async function () {
  const swaggerSpec = swaggerJsDoc({
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Capstone backend server',
        version: '1.0.0',
      },
      servers: [
        {
          url: 'http://localhost:3001',
          description: 'Local development',
        },
        {
          url: env
            .get('RENDER_URL')
            .default('https://example.onrender.com')
            .asString(),
          description: 'Render',
        },
      ],
      // HAX:
      // Giving the option to test the apis through our HAX (:
      security: [
        {
          bearerAuth: [],
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
          },
        },
      },
      // ----
      tags: [
        {
          name: 'user',
        },
        {
          name: 'device',
        },
      ],
    },
    apis: ['./src/controllers/**/*.ts'],
  } satisfies OAS3Options);

  controller

    .use(serve)

    .get('/', setup(swaggerSpec))

    .get('/data', () => {
      return swaggerSpec;
    });
})();
