/**
 * Main Server Entry Point
 * Clean Architecture: This is the Infrastructure/Presentation layer
 */

const path = require('path');
const fastify = require('fastify')({ logger: true });
const cors = require('@fastify/cors');

// Import services and controllers
const Engine = require('./services/algorithm.service');
const authController = require('./controllers/auth.controller');
const adminController = require('./controllers/admin.controller');

// Initialize engine
const engine = new Engine();

/* ===== REGISTER CORS ===== */
fastify.register(cors, { 
  origin: true 
});

/* ===== AUTHENTICATION ENDPOINTS ===== */

// Login endpoint - validates 6-digit PIN via Firebase
fastify.post('/auth/login', async (request) => {
  return authController.login(request.body);
});

// Session validation endpoint
fastify.post('/auth/validate', async (request) => {
  return authController.validateSession(request.body);
});

// Logout endpoint
fastify.post('/auth/logout', async (request) => {
  return authController.logout(request.body);
});

// Check admin role endpoint
fastify.post('/auth/check-admin', async (request) => {
  return authController.checkAdmin(request.body);
});

// Validate admin session endpoint
fastify.post('/auth/validate-admin', async (request) => {
  return authController.validateAdmin(request.body);
});

// Get user info endpoint
fastify.post('/auth/user-info', async (request) => {
  return authController.getUserInfo(request.body);
});

/* ===== ENGINE ENDPOINTS ===== */

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

/* ===== ADMIN PIN MANAGEMENT ENDPOINTS ===== */

// Get all pins from Firebase
fastify.get('/admin/pins', async (request) => {
  return adminController.getAllPins();
});

// Create new PIN
fastify.post('/admin/pins/create', async (request) => {
  return adminController.createPin(request.body);
});

// Update PIN details
fastify.post('/admin/pins/update', async (request) => {
  return adminController.updatePin(request.body);
});

// Revoke PIN
fastify.post('/admin/pins/revoke', async (request) => {
  return adminController.revokePin(request.body);
});

// Unrevoke PIN
fastify.post('/admin/pins/unrevoke', async (request) => {
  return adminController.unrevokePin(request.body);
});

// Delete PIN
fastify.delete('/admin/pins/:pin', async (request) => {
  return adminController.deletePin(request.params.pin);
});

/* ===== STATIC FILES ===== */

fastify.register(require('@fastify/static'), {
  root: path.join(__dirname, '../public'),
  prefix: '/public',
});

/* ===== START SERVER ===== */

fastify.listen({ port: 3000 }, (err) => {
  if (err) throw err;
  console.log('Server running at http://localhost:3000');
});
