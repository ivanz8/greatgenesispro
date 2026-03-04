const path = require('path');
const fastify = require('fastify')({ logger: true });
const cors = require('@fastify/cors');
const Engine = require('./services/algorithm.service');

const engine = new Engine();

/* ===== REGISTER CORS ===== */
fastify.register(cors, { 
  origin: true 
});

/* ===== REGISTER API ROUTES FIRST ===== */

fastify.post('/engine/start', async (request) => {
  return engine.start(request.body);
});

fastify.post('/engine/stop', async () => {
  return engine.stop();
});

fastify.post('/engine/win', async () => {
  return engine.win();
});

fastify.post('/engine/lose', async () => {
  return engine.lose();
});

fastify.post('/engine/tie', async () => {
  return engine.tie();
});

/* ===== THEN REGISTER STATIC FILES ===== */

fastify.register(require('@fastify/static'), {
  root: path.join(__dirname, '../public'),
  prefix: '/',
});

/* ===== START SERVER ===== */

fastify.listen({ port: 3000 }, (err) => {
  if (err) throw err;
  console.log('Server running at http://localhost:3000');
});