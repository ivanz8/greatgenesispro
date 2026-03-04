const path = require('path');
const fastify = require('fastify')({ logger: true });
const cors = require('@fastify/cors');
const Engine = require('./services/algorithm.service');

const engine = new Engine();

/* ===== DEMO USER PIN (6-digit) ===== */
const DEMO_USER_PIN = "123456";

/* ===== SIMPLE SESSION STORE ===== */
const validSessions = new Set();

function generateSessionId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/* ===== REGISTER CORS ===== */
fastify.register(cors, { 
  origin: true 
});

/* ===== AUTHENTICATION ENDPOINTS ===== */

// Login endpoint - validates 6-digit PIN
fastify.post('/auth/login', async (request) => {
  const { pin } = request.body || {};
  
  if (!pin || pin.length !== 6 || !/^\d{6}$/.test(pin)) {
    return { success: false, message: "Invalid PIN format. Must be 6 digits." };
  }
  
  if (pin === DEMO_USER_PIN) {
    const sessionId = generateSessionId();
    validSessions.add(sessionId);
    return { 
      success: true, 
      message: "Login successful",
      sessionId: sessionId
    };
  }
  
  return { success: false, message: "Invalid PIN" };
});

// Session validation endpoint
fastify.post('/auth/validate', async (request) => {
  const { sessionId } = request.body || {};
  
  if (!sessionId) {
    return { valid: false };
  }
  
  return { valid: validSessions.has(sessionId) };
});

// Logout endpoint
fastify.post('/auth/logout', async (request) => {
  const { sessionId } = request.body || {};
  
  if (sessionId && validSessions.has(sessionId)) {
    validSessions.delete(sessionId);
    return { success: true, message: "Logged out successfully" };
  }
  
  return { success: false, message: "Invalid session" };
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
  prefix: '/public',
});

fastify.listen({ port: 3000 }, (err) => {
  if (err) throw err;
  console.log('Server running at http://localhost:3000');
});