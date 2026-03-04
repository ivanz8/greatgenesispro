const path = require('path');
const fastify = require('fastify')({ logger: true });
const cors = require('@fastify/cors');
const Engine = require('./services/algorithm.service');

const engine = new Engine();

/* ===== FIREBASE CONFIGURATION ===== */
const FIREBASE_DB_URL = process.env.FIREBASE_DB_URL || 'https://algobusiness-default-rtdb.asia-southeast1.firebasedatabase.app';

/* ===== SIMPLE SESSION STORE ===== */
const validSessions = new Set();
const sessionUsers = new Map(); // sessionId -> user data

function generateSessionId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/* ===== FIREBASE HELPER FUNCTIONS ===== */

// Fetch PIN data from Firebase
async function fetchPinFromFirebase(pin) {
  try {
    const response = await fetch(`${FIREBASE_DB_URL}/pins/${pin}.json`);
    if (!response.ok) {
      throw new Error(`Firebase error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Firebase fetch error:', error);
    return null;
  }
}

// Validate PIN against Firebase
async function validatePin(pin) {
  const pinData = await fetchPinFromFirebase(pin);
  
  if (!pinData) {
    return { valid: false, message: "PIN not found in database" };
  }
  
  if (pinData.active === false) {
    return { valid: false, message: "PIN has been deactivated" };
  }
  
  return { 
    valid: true, 
    user: {
      id: pinData.id,
      name: pinData.name,
      role: pinData.role
    }
  };
}

/* ===== REGISTER CORS ===== */
fastify.register(cors, { 
  origin: true 
});

/* ===== AUTHENTICATION ENDPOINTS ===== */

// Login endpoint - validates 6-digit PIN via Firebase
fastify.post('/auth/login', async (request) => {
  const { pin } = request.body || {};
  
  if (!pin || pin.length !== 6 || !/^\d{6}$/.test(pin)) {
    return { success: false, message: "Invalid PIN format. Must be 6 digits." };
  }
  
  // Validate PIN against Firebase
  const validation = await validatePin(pin);
  
  if (!validation.valid) {
    return { success: false, message: validation.message };
  }
  
  // Create session
  const sessionId = generateSessionId();
  validSessions.add(sessionId);
  sessionUsers.set(sessionId, validation.user);
  
  return { 
    success: true, 
    message: "Login successful",
    sessionId: sessionId,
    user: validation.user
  };
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
    sessionUsers.delete(sessionId);
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