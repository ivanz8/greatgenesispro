// Vercel Serverless Entry Point
const path = require('path');
const Fastify = require('fastify');
const cors = require('@fastify/cors');
const fastifyStatic = require('@fastify/static');
const Engine = require('../src/services/algorithm.service');

// Initialize Fastify app
const app = Fastify({ 
  logger: process.env.NODE_ENV === 'development',
  trustProxy: true 
});

const engine = new Engine();

/* ===== FIREBASE CONFIGURATION ===== */
const FIREBASE_DB_URL = process.env.FIREBASE_DB_URL || 'https://algobusiness-default-rtdb.asia-southeast1.firebasedatabase.app';

/* ===== SIMPLE SESSION STORE ===== */
const validSessions = new Set();
const sessionUsers = new Map();

function generateSessionId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/* ===== FIREBASE HELPER FUNCTIONS ===== */
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

/* ===== REGISTER PLUGINS ===== */
app.register(cors, { 
  origin: true,
  credentials: true 
});

/* ===== API ROUTES ===== */

// Health check
app.get('/api/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Auth - Login
app.post('/api/auth/login', async (request) => {
  const { pin } = request.body || {};
  
  if (!pin || pin.length !== 6 || !/^\d{6}$/.test(pin)) {
    return { success: false, message: "Invalid PIN format. Must be 6 digits." };
  }
  
  const validation = await validatePin(pin);
  
  if (!validation.valid) {
    return { success: false, message: validation.message };
  }
  
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

// Auth - Validate Session
app.post('/api/auth/validate', async (request) => {
  const { sessionId } = request.body || {};
  
  if (!sessionId) {
    return { valid: false };
  }
  
  return { valid: validSessions.has(sessionId) };
});

// Auth - Logout
app.post('/api/auth/logout', async (request) => {
  const { sessionId } = request.body || {};
  
  if (sessionId && validSessions.has(sessionId)) {
    validSessions.delete(sessionId);
    sessionUsers.delete(sessionId);
    return { success: true, message: "Logged out successfully" };
  }
  
  return { success: false, message: "Invalid session" };
});

// Auth - Check Admin
app.post('/api/auth/check-admin', async (request) => {
  const { sessionId, pin } = request.body || {};
  
  if (!sessionId) {
    return { success: false, message: "No session provided" };
  }
  
  if (!validSessions.has(sessionId)) {
    return { success: false, message: "Invalid or expired session" };
  }
  
  const user = sessionUsers.get(sessionId);
  
  if (!user) {
    return { success: false, message: "User not found in session" };
  }
  
  const isAdmin = user.role === 'admin';
  
  if (pin) {
    const validation = await validatePin(pin);
    if (!validation.valid) {
      return { success: false, message: validation.message };
    }
    
    if (validation.user.role !== 'admin') {
      return { success: true, isAdmin: false, message: "Access denied. Admin role required." };
    }
    
    const adminSessionId = generateSessionId();
    validSessions.add(adminSessionId);
    sessionUsers.set(adminSessionId, { ...validation.user, isAdminSession: true });
    
    return { 
      success: true, 
      isAdmin: true, 
      adminSessionId: adminSessionId,
      user: validation.user
    };
  }
  
  if (!isAdmin) {
    return { success: true, isAdmin: false, message: "Access denied. Admin role required." };
  }
  
  const adminSessionId = generateSessionId();
  validSessions.add(adminSessionId);
  sessionUsers.set(adminSessionId, { ...user, isAdminSession: true });
  
  return { 
    success: true, 
    isAdmin: true, 
    adminSessionId: adminSessionId,
    user: user
  };
});

// Auth - Validate Admin
app.post('/api/auth/validate-admin', async (request) => {
  const { sessionId } = request.body || {};
  
  if (!sessionId) {
    return { success: false, message: "No session provided" };
  }
  
  if (!validSessions.has(sessionId)) {
    return { success: false, message: "Invalid or expired session" };
  }
  
  const user = sessionUsers.get(sessionId);
  
  if (!user) {
    return { success: false, message: "User not found in session" };
  }
  
  const isAdmin = user.role === 'admin';
  
  if (!isAdmin) {
    return { success: true, isAdmin: false, message: "Access denied. Admin role required." };
  }
  
  return { 
    success: true, 
    isAdmin: true,
    user: user
  };
});

// Auth - Get User Info
app.post('/api/auth/user-info', async (request) => {
  const { sessionId } = request.body || {};
  
  if (!sessionId || !validSessions.has(sessionId)) {
    return { valid: false };
  }
  
  const user = sessionUsers.get(sessionId);
  return { valid: true, user: user };
});

/* ===== ENGINE ROUTES ===== */

app.post('/api/engine/start', async (request) => {
  return engine.start(request.body);
});

app.post('/api/engine/stop', async () => {
  return engine.stop();
});

app.post('/api/engine/win', async () => {
  return engine.win();
});

app.post('/api/engine/lose', async () => {
  return engine.lose();
});

app.post('/api/engine/tie', async () => {
  return engine.tie();
});

/* ===== ADMIN PIN MANAGEMENT ROUTES ===== */

// Get all pins
app.get('/api/admin/pins', async () => {
  try {
    const response = await fetch(`${FIREBASE_DB_URL}/pins.json`);
    if (!response.ok) {
      throw new Error(`Firebase error: ${response.status}`);
    }
    const data = await response.json();
    
    const pins = data ? Object.entries(data).map(([pin, value]) => ({
      pin,
      ...value
    })) : [];
    
    return { success: true, pins };
  } catch (error) {
    console.error('Error fetching pins:', error);
    return { success: false, message: error.message };
  }
});

// Create PIN
app.post('/api/admin/pins/create', async (request) => {
  const { pin, name, role, active } = request.body || {};
  
  if (!pin || !/^\d{6}$/.test(pin)) {
    return { success: false, message: "Invalid PIN format. Must be 6 digits." };
  }
  
  if (!name) {
    return { success: false, message: "Name is required." };
  }
  
  try {
    const existing = await fetchPinFromFirebase(pin);
    if (existing) {
      return { success: false, message: "PIN already exists. Use update instead." };
    }
    
    const newPin = {
      id: `user_${Date.now()}`,
      name: name,
      role: role || 'user',
      active: active !== false,
      createdAt: new Date().toISOString()
    };
    
    const response = await fetch(`${FIREBASE_DB_URL}/pins/${pin}.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newPin)
    });
    
    if (!response.ok) {
      throw new Error(`Firebase error: ${response.status}`);
    }
    
    return { success: true, message: "PIN created successfully.", pin: newPin };
  } catch (error) {
    console.error('Error creating pin:', error);
    return { success: false, message: error.message };
  }
});

// Update PIN
app.post('/api/admin/pins/update', async (request) => {
  const { pin, name, role, active } = request.body || {};
  
  if (!pin || !/^\d{6}$/.test(pin)) {
    return { success: false, message: "Invalid PIN format. Must be 6 digits." };
  }
  
  try {
    const existing = await fetchPinFromFirebase(pin);
    if (!existing) {
      return { success: false, message: "PIN not found." };
    }
    
    const updatedPin = {
      ...existing,
      name: name || existing.name,
      role: role || existing.role,
      active: active !== undefined ? active : existing.active,
      updatedAt: new Date().toISOString()
    };
    
    const response = await fetch(`${FIREBASE_DB_URL}/pins/${pin}.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedPin)
    });
    
    if (!response.ok) {
      throw new Error(`Firebase error: ${response.status}`);
    }
    
    return { success: true, message: "PIN updated successfully.", pin: updatedPin };
  } catch (error) {
    console.error('Error updating pin:', error);
    return { success: false, message: error.message };
  }
});

// Revoke PIN
app.post('/api/admin/pins/revoke', async (request) => {
  const { pin } = request.body || {};
  
  if (!pin || !/^\d{6}$/.test(pin)) {
    return { success: false, message: "Invalid PIN format. Must be 6 digits." };
  }
  
  try {
    const existing = await fetchPinFromFirebase(pin);
    if (!existing) {
      return { success: false, message: "PIN not found." };
    }
    
    const response = await fetch(`${FIREBASE_DB_URL}/pins/${pin}.json`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: false, revokedAt: new Date().toISOString() })
    });
    
    if (!response.ok) {
      throw new Error(`Firebase error: ${response.status}`);
    }
    
    return { success: true, message: "PIN revoked successfully." };
  } catch (error) {
    console.error('Error revoking pin:', error);
    return { success: false, message: error.message };
  }
});

// Unrevoke PIN
app.post('/api/admin/pins/unrevoke', async (request) => {
  const { pin } = request.body || {};
  
  if (!pin || !/^\d{6}$/.test(pin)) {
    return { success: false, message: "Invalid PIN format. Must be 6 digits." };
  }
  
  try {
    const existing = await fetchPinFromFirebase(pin);
    if (!existing) {
      return { success: false, message: "PIN not found." };
    }
    
    const response = await fetch(`${FIREBASE_DB_URL}/pins/${pin}.json`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: true, unrevokedAt: new Date().toISOString() })
    });
    
    if (!response.ok) {
      throw new Error(`Firebase error: ${response.status}`);
    }
    
    return { success: true, message: "PIN restored successfully." };
  } catch (error) {
    console.error('Error unrevoking pin:', error);
    return { success: false, message: error.message };
  }
});

// Delete PIN
app.delete('/api/admin/pins/:pin', async (request) => {
  const { pin } = request.params || {};
  
  if (!pin || !/^\d{6}$/.test(pin)) {
    return { success: false, message: "Invalid PIN format. Must be 6 digits." };
  }
  
  try {
    const response = await fetch(`${FIREBASE_DB_URL}/pins/${pin}.json`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      throw new Error(`Firebase error: ${response.status}`);
    }
    
    return { success: true, message: "PIN deleted successfully." };
  } catch (error) {
    console.error('Error deleting pin:', error);
    return { success: false, message: error.message };
  }
});

/* ===== STATIC FILES ===== */
app.register(fastifyStatic, {
  root: path.join(__dirname, '../public'),
  prefix: '/',
  wildcard: false
});

/* ===== SPA FALLBACK ===== */
// Serve index.html for root path
app.get('/', async (request, reply) => {
  return reply.sendFile('index.html');
});

// Export handler for Vercel
module.exports = async (req, res) => {
  await app.ready();
  app.server.emit('request', req, res);
};
