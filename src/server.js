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

// Check admin role endpoint - validates session and verifies admin role from Firebase
fastify.post('/auth/check-admin', async (request) => {
  const { sessionId, pin } = request.body || {};
  
  if (!sessionId) {
    return { success: false, message: "No session provided" };
  }
  
  // Check if session is valid
  if (!validSessions.has(sessionId)) {
    return { success: false, message: "Invalid or expired session" };
  }
  
  // Get user from session
  const user = sessionUsers.get(sessionId);
  
  if (!user) {
    return { success: false, message: "User not found in session" };
  }
  
  // Check if user has admin role
  const isAdmin = user.role === 'admin';
  
  // If PIN is provided, also validate it against Firebase
  if (pin) {
    const validation = await validatePin(pin);
    if (!validation.valid) {
      return { success: false, message: validation.message };
    }
    
    // Check if the PIN belongs to an admin user
    if (validation.user.role !== 'admin') {
      return { success: true, isAdmin: false, message: "Access denied. Admin role required." };
    }
    
    // Generate admin session
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
  
  // If no PIN, just check role from session
  if (!isAdmin) {
    return { success: true, isAdmin: false, message: "Access denied. Admin role required." };
  }
  
  // Generate admin session for existing admin user
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

// Validate admin session endpoint (for route protection - no PIN required)
fastify.post('/auth/validate-admin', async (request) => {
  const { sessionId } = request.body || {};
  
  if (!sessionId) {
    return { success: false, message: "No session provided" };
  }
  
  // Check if session is valid
  if (!validSessions.has(sessionId)) {
    return { success: false, message: "Invalid or expired session" };
  }
  
  // Get user from session
  const user = sessionUsers.get(sessionId);
  
  if (!user) {
    return { success: false, message: "User not found in session" };
  }
  
  // Check if user has admin role
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

// Get user info endpoint
fastify.post('/auth/user-info', async (request) => {
  const { sessionId } = request.body || {};
  
  if (!sessionId || !validSessions.has(sessionId)) {
    return { valid: false };
  }
  
  const user = sessionUsers.get(sessionId);
  return { valid: true, user: user };
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

/* ===== ADMIN PIN MANAGEMENT ENDPOINTS ===== */

// Get all pins from Firebase
fastify.get('/admin/pins', async (request) => {
  try {
    const response = await fetch(`${FIREBASE_DB_URL}/pins.json`);
    if (!response.ok) {
      throw new Error(`Firebase error: ${response.status}`);
    }
    const data = await response.json();
    
    // Convert object to array
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

// Create new PIN
fastify.post('/admin/pins/create', async (request) => {
  const { pin, name, role, active } = request.body || {};
  
  // Validate required fields
  if (!pin || !/^\d{6}$/.test(pin)) {
    return { success: false, message: "Invalid PIN format. Must be 6 digits." };
  }
  
  if (!name) {
    return { success: false, message: "Name is required." };
  }
  
  try {
    // Check if pin already exists
    const existing = await fetchPinFromFirebase(pin);
    if (existing) {
      return { success: false, message: "PIN already exists. Use update instead." };
    }
    
    // Create new pin entry
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

// Update PIN details
fastify.post('/admin/pins/update', async (request) => {
  const { pin, name, role, active } = request.body || {};
  
  if (!pin || !/^\d{6}$/.test(pin)) {
    return { success: false, message: "Invalid PIN format. Must be 6 digits." };
  }
  
  try {
    // Check if pin exists
    const existing = await fetchPinFromFirebase(pin);
    if (!existing) {
      return { success: false, message: "PIN not found." };
    }
    
    // Update fields
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

// Revoke PIN (set active to false)
fastify.post('/admin/pins/revoke', async (request) => {
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

// Unrevoke PIN (set active to true)
fastify.post('/admin/pins/unrevoke', async (request) => {
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
fastify.delete('/admin/pins/:pin', async (request) => {
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

fastify.register(require('@fastify/static'), {
  root: path.join(__dirname, '../public'),
  prefix: '/public',
});

fastify.listen({ port: 3000 }, (err) => {
  if (err) throw err;
  console.log('Server running at http://localhost:3000');
});