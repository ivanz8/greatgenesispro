/**
 * PIN Service - Manages PIN operations with Firebase
 * Clean Architecture: This is a Service/Data Access layer
 */

const FIREBASE_DB_URL = process.env.FIREBASE_DB_URL;

/**
 * Fetch a single PIN from Firebase
 * @param {string} pin - PIN to fetch
 * @returns {Object|null} - PIN data or null
 */
async function fetchPin(pin) {
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

/**
 * Validate a PIN against Firebase
 * @param {string} pin - PIN to validate
 * @returns {Object} - { valid: boolean, message?: string, user?: Object }
 */
async function validatePin(pin) {
  const pinData = await fetchPin(pin);
  
  if (!pinData) {
    return { valid: false, message: "Incorrect PIN" };
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

/**
 * Get all PINs from Firebase
 * @returns {Array} - Array of PIN objects
 */
async function getAllPins() {
  try {
    const response = await fetch(`${FIREBASE_DB_URL}/pins.json`);
    if (!response.ok) {
      throw new Error(`Firebase error: ${response.status}`);
    }
    const data = await response.json();
    
    // Convert object to array
    return data ? Object.entries(data).map(([pin, value]) => ({
      pin,
      ...value
    })) : [];
  } catch (error) {
    console.error('Error fetching pins:', error);
    throw error;
  }
}

/**
 * Create a new PIN
 * @param {string} pin - PIN to create
 * @param {string} name - User name
 * @param {string} role - User role
 * @param {boolean} active - Is active
 * @returns {Object} - Created PIN data
 */
async function createPin(pin, name, role = 'user', active = true) {
  const newPin = {
    id: `user_${Date.now()}`,
    name,
    role,
    active,
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
  
  return newPin;
}

/**
 * Update an existing PIN
 * @param {string} pin - PIN to update
 * @param {Object} updates - Fields to update
 * @returns {Object} - Updated PIN data
 */
async function updatePin(pin, updates) {
  const existing = await fetchPin(pin);
  if (!existing) {
    throw new Error('PIN not found');
  }
  
  const updatedPin = {
    ...existing,
    ...updates,
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
  
  return updatedPin;
}

/**
 * Revoke a PIN (set active to false)
 * @param {string} pin - PIN to revoke
 * @returns {boolean} - Success
 */
async function revokePin(pin) {
  const existing = await fetchPin(pin);
  if (!existing) {
    throw new Error('PIN not found');
  }
  
  const response = await fetch(`${FIREBASE_DB_URL}/pins/${pin}.json`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ active: false, revokedAt: new Date().toISOString() })
  });
  
  if (!response.ok) {
    throw new Error(`Firebase error: ${response.status}`);
  }
  
  return true;
}

/**
 * Unrevoke a PIN (set active to true)
 * @param {string} pin - PIN to unrevoke
 * @returns {boolean} - Success
 */
async function unrevokePin(pin) {
  const existing = await fetchPin(pin);
  if (!existing) {
    throw new Error('PIN not found');
  }
  
  const response = await fetch(`${FIREBASE_DB_URL}/pins/${pin}.json`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ active: true, unrevokedAt: new Date().toISOString() })
  });
  
  if (!response.ok) {
    throw new Error(`Firebase error: ${response.status}`);
  }
  
  return true;
}

/**
 * Delete a PIN
 * @param {string} pin - PIN to delete
 * @returns {boolean} - Success
 */
async function deletePin(pin) {
  const response = await fetch(`${FIREBASE_DB_URL}/pins/${pin}.json`, {
    method: 'DELETE'
  });
  
  if (!response.ok) {
    throw new Error(`Firebase error: ${response.status}`);
  }
  
  return true;
}

module.exports = {
  fetchPin,
  validatePin,
  getAllPins,
  createPin,
  updatePin,
  revokePin,
  unrevokePin,
  deletePin
};
