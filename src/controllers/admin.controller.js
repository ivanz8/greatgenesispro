/**
 * Admin Controller - Handles admin PIN management endpoints
 * Clean Architecture: This is a Controller layer
 */

const pinService = require('../services/pin.service');

/**
 * Validate PIN format
 * @param {string} pin - PIN to validate
 * @returns {boolean} - True if valid
 */
function isValidPinFormat(pin) {
  return pin && /^\d{6}$/.test(pin);
}

/**
 * Handle get all pins request
 * @returns {Object} - Response
 */
async function getAllPins() {
  try {
    const pins = await pinService.getAllPins();
    return { success: true, pins };
  } catch (error) {
    console.error('Error fetching pins:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Handle create PIN request
 * @param {Object} body - Request body
 * @returns {Object} - Response
 */
async function createPin(body) {
  const { pin, name, role, active } = body || {};
  
  // Validate required fields
  if (!isValidPinFormat(pin)) {
    return { success: false, message: "Invalid PIN format. Must be 6 digits." };
  }
  
  if (!name) {
    return { success: false, message: "Name is required." };
  }
  
  try {
    // Check if pin already exists
    const existing = await pinService.fetchPin(pin);
    if (existing) {
      return { success: false, message: "PIN already exists. Use update instead." };
    }
    
    // Create new pin
    const newPin = await pinService.createPin(pin, name, role || 'user', active !== false);
    
    return { success: true, message: "PIN created successfully.", pin: newPin };
  } catch (error) {
    console.error('Error creating pin:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Handle update PIN request
 * @param {Object} body - Request body
 * @returns {Object} - Response
 */
async function updatePin(body) {
  const { pin, name, role, active } = body || {};
  
  if (!isValidPinFormat(pin)) {
    return { success: false, message: "Invalid PIN format. Must be 6 digits." };
  }
  
  try {
    // Build updates object
    const updates = {};
    if (name) updates.name = name;
    if (role) updates.role = role;
    if (active !== undefined) updates.active = active;
    
    const updatedPin = await pinService.updatePin(pin, updates);
    
    return { success: true, message: "PIN updated successfully.", pin: updatedPin };
  } catch (error) {
    console.error('Error updating pin:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Handle revoke PIN request
 * @param {Object} body - Request body
 * @returns {Object} - Response
 */
async function revokePin(body) {
  const { pin } = body || {};
  
  if (!isValidPinFormat(pin)) {
    return { success: false, message: "Invalid PIN format. Must be 6 digits." };
  }
  
  try {
    await pinService.revokePin(pin);
    return { success: true, message: "PIN revoked successfully." };
  } catch (error) {
    console.error('Error revoking pin:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Handle unrevoke PIN request
 * @param {Object} body - Request body
 * @returns {Object} - Response
 */
async function unrevokePin(body) {
  const { pin } = body || {};
  
  if (!isValidPinFormat(pin)) {
    return { success: false, message: "Invalid PIN format. Must be 6 digits." };
  }
  
  try {
    await pinService.unrevokePin(pin);
    return { success: true, message: "PIN restored successfully." };
  } catch (error) {
    console.error('Error unrevoking pin:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Handle delete PIN request
 * @param {string} pin - PIN to delete
 * @returns {Object} - Response
 */
async function deletePin(pin) {
  if (!isValidPinFormat(pin)) {
    return { success: false, message: "Invalid PIN format. Must be 6 digits." };
  }
  
  try {
    await pinService.deletePin(pin);
    return { success: true, message: "PIN deleted successfully." };
  } catch (error) {
    console.error('Error deleting pin:', error);
    return { success: false, message: error.message };
  }
}

module.exports = {
  getAllPins,
  createPin,
  updatePin,
  revokePin,
  unrevokePin,
  deletePin
};
