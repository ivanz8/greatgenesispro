/**
 * Auth Controller - Handles authentication endpoints
 * Clean Architecture: This is a Controller layer
 */

const sessionService = require('../services/session.service');
const pinService = require('../services/pin.service');

/**
 * Validate PIN format
 * @param {string} pin - PIN to validate
 * @returns {boolean} - True if valid
 */
function isValidPinFormat(pin) {
  return pin && pin.length === 6 && /^\d{6}$/.test(pin);
}

/**
 * Handle login request
 * @param {Object} body - Request body
 * @returns {Object} - Response
 */
async function login(body) {
  const { pin } = body || {};
  
  if (!isValidPinFormat(pin)) {
    return { success: false, message: "Invalid PIN format. Must be 6 digits." };
  }
  
  // Validate PIN against Firebase
  const validation = await pinService.validatePin(pin);
  
  if (!validation.valid) {
    return { success: false, message: validation.message };
  }
  
  // Create session
  const { sessionId, user } = sessionService.createSession(validation.user);
  
  return { 
    success: true, 
    message: "Login successful",
    sessionId,
    user
  };
}

/**
 * Handle session validation request
 * @param {Object} body - Request body
 * @returns {Object} - Response
 */
function validateSession(body) {
  const { sessionId } = body || {};
  
  if (!sessionId) {
    return { valid: false };
  }
  
  return { valid: sessionService.isValidSession(sessionId) };
}

/**
 * Handle logout request
 * @param {Object} body - Request body
 * @returns {Object} - Response
 */
function logout(body) {
  const { sessionId } = body || {};
  
  if (sessionId && sessionService.destroySession(sessionId)) {
    return { success: true, message: "Logged out successfully" };
  }
  
  return { success: false, message: "Invalid session" };
}

/**
 * Handle check admin request
 * @param {Object} body - Request body
 * @returns {Object} - Response
 */
async function checkAdmin(body) {
  const { sessionId, pin } = body || {};
  
  if (!sessionId) {
    return { success: false, message: "No session provided" };
  }
  
  // Check if session is valid
  if (!sessionService.isValidSession(sessionId)) {
    return { success: false, message: "Invalid or expired session" };
  }
  
  // Get user from session
  const user = sessionService.getUserFromSession(sessionId);
  
  if (!user) {
    return { success: false, message: "User not found in session" };
  }
  
  // Check if user has admin role
  const isAdmin = user.role === 'admin';
  
  // If PIN is provided, also validate it against Firebase
  if (pin) {
    const validation = await pinService.validatePin(pin);
    if (!validation.valid) {
      return { success: false, message: validation.message };
    }
    
    // Check if the PIN belongs to an admin user
    if (validation.user.role !== 'admin') {
      return { success: true, isAdmin: false, message: "Access denied. Admin role required." };
    }
    
    // Generate admin session
    const { sessionId: adminSessionId, user: adminUser } = sessionService.createSession({
      ...validation.user,
      isAdminSession: true
    });
    
    return { 
      success: true, 
      isAdmin: true, 
      adminSessionId,
      user: adminUser
    };
  }
  
  // If no PIN, just check role from session
  if (!isAdmin) {
    return { success: true, isAdmin: false, message: "Access denied. Admin role required." };
  }
  
  // Generate admin session for existing admin user
  const { sessionId: adminSessionId, user: adminUser } = sessionService.createSession({
    ...user,
    isAdminSession: true
  });
  
  return { 
    success: true, 
    isAdmin: true, 
    adminSessionId,
    user: adminUser
  };
}

/**
 * Handle validate admin request
 * @param {Object} body - Request body
 * @returns {Object} - Response
 */
function validateAdmin(body) {
  const { sessionId } = body || {};
  
  if (!sessionId) {
    return { success: false, message: "No session provided" };
  }
  
  // Check if session is valid
  if (!sessionService.isValidSession(sessionId)) {
    return { success: false, message: "Invalid or expired session" };
  }
  
  // Get user from session
  const user = sessionService.getUserFromSession(sessionId);
  
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
    user
  };
}

/**
 * Handle get user info request
 * @param {Object} body - Request body
 * @returns {Object} - Response
 */
function getUserInfo(body) {
  const { sessionId } = body || {};
  
  if (!sessionId || !sessionService.isValidSession(sessionId)) {
    return { valid: false };
  }
  
  const user = sessionService.getUserFromSession(sessionId);
  return { valid: true, user };
}

module.exports = {
  login,
  validateSession,
  logout,
  checkAdmin,
  validateAdmin,
  getUserInfo
};
