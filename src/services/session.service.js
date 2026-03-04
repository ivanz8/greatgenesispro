/**
 * Session Service - Manages user sessions
 * Clean Architecture: This is a Service/Use Case layer
 */

// In-memory session storage (use Redis/DB in production)
const validSessions = new Set();
const sessionUsers = new Map(); // sessionId -> user data

/**
 * Generate a new session ID
 * @returns {string} New session ID
 */
function generateSessionId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * Create a new session for a user
 * @param {Object} user - User object with id, name, role
 * @returns {Object} - { sessionId, user }
 */
function createSession(user) {
  const sessionId = generateSessionId();
  validSessions.add(sessionId);
  sessionUsers.set(sessionId, user);
  return { sessionId, user };
}

/**
 * Validate if a session exists
 * @param {string} sessionId - Session ID to check
 * @returns {boolean} - True if session is valid
 */
function isValidSession(sessionId) {
  return validSessions.has(sessionId);
}

/**
 * Get user data from session
 * @param {string} sessionId - Session ID
 * @returns {Object|null} - User data or null
 */
function getUserFromSession(sessionId) {
  return sessionUsers.get(sessionId) || null;
}

/**
 * Destroy a session
 * @param {string} sessionId - Session ID to destroy
 * @returns {boolean} - True if session was destroyed
 */
function destroySession(sessionId) {
  if (validSessions.has(sessionId)) {
    validSessions.delete(sessionId);
    sessionUsers.delete(sessionId);
    return true;
  }
  return false;
}

/**
 * Get all active sessions (for admin purposes)
 * @returns {Array} - Array of session objects
 */
function getAllSessions() {
  const sessions = [];
  for (const sessionId of validSessions) {
    const user = sessionUsers.get(sessionId);
    sessions.push({ sessionId, user });
  }
  return sessions;
}

module.exports = {
  generateSessionId,
  createSession,
  isValidSession,
  getUserFromSession,
  destroySession,
  getAllSessions
};
