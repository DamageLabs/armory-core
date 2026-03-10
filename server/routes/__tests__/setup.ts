import express from 'express';

export function createApp(router: express.Router, prefix = '/api') {
  const app = express();
  app.use(express.json());
  app.use(prefix, router);
  return app;
}
