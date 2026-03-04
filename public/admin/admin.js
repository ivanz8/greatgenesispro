/* ==== ADMIN PANEL LOGIC ==== */
const adminCurrentCode = document.getElementById('adminCurrentCode');
const adminNewPin = document.getElementById('adminNewPin');
const adminNewName = document.getElementById('adminNewName');
const adminNewRole = document.getElementById('adminNewRole');
const adminCreatePin = document.getElementById('adminCreatePin');
const adminRevokeInput = document.getElementById('adminRevokeInput');
const adminUnrevokeInput = document.getElementById('adminUnrevokeInput');
const adminRevokeBtn = document.getElementById('adminRevokeBtn');
const adminUnrevokeBtn = document.getElementById('adminUnrevokeBtn');
const allPinsList = document.getElementById('allPinsList');
const revokedList = document.getElementById('revokedList');
const adminMsg = document.getElementById('adminMsg');

// Get session ID
const sessionId = localStorage.getItem('adminSessionId') || localStorage.getItem('userSessionId');

// Current pins data
let pinsData = [];

// Load pins from Firebase on page load
async function loadPins() {
  try {
    const res = await fetch('http://localhost:3000/admin/pins');
    const data = await res.json();
    
    if (data.success) {
      pinsData = data.pins || [];
      refreshAdminUI();
    } else {
      adminMsg.textContent = "Error loading pins: " + data.message;
      adminMsg.style.color = "var(--danger)";
    }
  } catch (err) {
    console.error('Error loading pins:', err);
    adminMsg.textContent = "Error connecting to server";
    adminMsg.style.color = "var(--danger)";
  }
}

// Refresh UI with current data
function refreshAdminUI() {
  // Show all pins
  if (pinsData.length === 0) {
    allPinsList.textContent = "No access codes found.";
  } else {
    const pinsHtml = pinsData.map(p => {
      const status = p.active === false ? '<span style="color:#ff4d4d">[REVOKED]</span>' : '<span style="color:#7dff8a">[ACTIVE]</span>';
      const roleBadge = p.role === 'admin' ? '<span style="color:#ff4d4d;font-weight:bold">[ADMIN]</span>' : 
                        p.role === 'vip' ? '<span style="color:#ffd700">[VIP]</span>' : '';
      return `<div style="padding:4px 0;border-bottom:1px solid #334">${p.pin} - ${p.name} ${roleBadge} ${status}</div>`;
    }).join('');
    allPinsList.innerHTML = pinsHtml;
  }
  
  // Show revoked pins (active: false) - dedicated list
  const revokedPins = pinsData.filter(p => p.active === false);
  if (revokedPins.length === 0) {
    revokedList.textContent = "No revoked codes.";
  } else {
    const revokedHtml = revokedPins.map(p => 
      `<div style="padding:4px 0;border-bottom:1px solid #334;color:#ff4d4d">${p.pin} - ${p.name} [REVOKED]</div>`
    ).join('');
    revokedList.innerHTML = revokedHtml;
  }
  
  // Update current admin code display
  const adminPin = pinsData.find(p => p.role === 'admin' && p.active !== false);
  adminCurrentCode.value = adminPin ? adminPin.pin : "N/A";
}

// Create new PIN
adminCreatePin.addEventListener('click', async () => {
  const pin = adminNewPin.value.trim();
  const name = adminNewName.value.trim();
  const role = adminNewRole.value;
  
  if (!/^\d{6}$/.test(pin)) {
    adminMsg.textContent = "Invalid PIN. Must be exactly 6 digits.";
    adminMsg.style.color = "var(--danger)";
    return;
  }
  
  if (!name) {
    adminMsg.textContent = "Name is required.";
    adminMsg.style.color = "var(--danger)";
    return;
  }

  adminMsg.textContent = "Creating new PIN...";
  adminMsg.style.color = "var(--accent)";

  try {
    // Check if pin already exists
    const existingPin = pinsData.find(p => p.pin === pin);
    
    if (existingPin) {
      adminMsg.textContent = "PIN already exists. Use update or revoke functions.";
      adminMsg.style.color = "var(--danger)";
      return;
    }
    
    const res = await fetch('http://localhost:3000/admin/pins/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        pin: pin, 
        name: name,
        role: role,
        active: true 
      })
    });
    
    const data = await res.json();
    
    if (data.success) {
      adminMsg.textContent = `Created new ${role} PIN: ${pin}`;
      adminMsg.style.color = "#7dff8a";
    } else {
      adminMsg.textContent = data.message || "Failed to create PIN.";
      adminMsg.style.color = "var(--danger)";
    }
    
    adminNewPin.value = "";
    adminNewName.value = "";
    adminNewRole.value = "user";
    loadPins(); // Refresh data
    
  } catch (err) {
    adminMsg.textContent = "Server error. Please try again.";
    adminMsg.style.color = "var(--danger)";
    console.error('Error creating PIN:', err);
  }
});

// Revoke code
adminRevokeBtn.addEventListener('click', async () => {
  const code = adminRevokeInput.value.trim();
  if (!/^\d{6}$/.test(code)) {
    adminMsg.textContent = "Invalid code. Must be 6 digits.";
    adminMsg.style.color = "var(--danger)";
    return;
  }

  adminMsg.textContent = "Revoking code...";
  adminMsg.style.color = "var(--accent)";

  try {
    const res = await fetch('http://localhost:3000/admin/pins/revoke', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: code })
    });
    
    const data = await res.json();
    
    if (data.success) {
      adminMsg.textContent = "Code revoked successfully.";
      adminMsg.style.color = "var(--danger)";
    } else {
      adminMsg.textContent = data.message || "Failed to revoke.";
      adminMsg.style.color = "var(--danger)";
    }
    
    adminRevokeInput.value = "";
    loadPins(); // Refresh data
    
  } catch (err) {
    adminMsg.textContent = "Server error. Please try again.";
    adminMsg.style.color = "var(--danger)";
    console.error('Error revoking code:', err);
  }
});

// Unrevoke code
adminUnrevokeBtn.addEventListener('click', async () => {
  const code = adminUnrevokeInput.value.trim();
  
  adminMsg.textContent = "Restoring code...";
  adminMsg.style.color = "var(--accent)";

  try {
    const res = await fetch('http://localhost:3000/admin/pins/unrevoke', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: code })
    });
    
    const data = await res.json();
    
    if (data.success) {
      adminMsg.textContent = "Code restored successfully.";
      adminMsg.style.color = "#7dff8a";
    } else {
      adminMsg.textContent = data.message || "Failed to restore.";
      adminMsg.style.color = "var(--danger)";
    }
    
    adminUnrevokeInput.value = "";
    loadPins(); // Refresh data
    
  } catch (err) {
    adminMsg.textContent = "Server error. Please try again.";
    adminMsg.style.color = "var(--danger)";
    console.error('Error unrevoking code:', err);
  }
});

// Initial load
loadPins();
