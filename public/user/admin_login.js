/* ==== ADMIN PANEL WITH FIREBASE ROLE-BASED AUTH ==== */
const adminPanel = document.getElementById('adminPanel');
const openAdmin = document.getElementById('openAdmin');

const adminPinOverlay = document.getElementById('adminPinOverlay');
const adminPinInput = document.getElementById('adminPinInput');
const adminPinSubmit = document.getElementById('adminPinSubmit');
const adminPinMsg = document.getElementById('adminPinMsg');

// Get session ID from localStorage
const sessionId = localStorage.getItem('userSessionId');

openAdmin.addEventListener('click', () => {
  adminPinOverlay.style.display = "flex";
  adminPinInput.value = "";
  adminPinMsg.textContent = "";
  adminPinMsg.className = "lock-status";
  adminPinInput.focus();
});

adminPinSubmit.addEventListener('click', async () => {
  const pin = adminPinInput.value.trim();
  
  if (!sessionId) {
    adminPinMsg.textContent = "Session expired. Please login again.";
    adminPinMsg.className = "lock-status error";
    setTimeout(() => {
      window.location.href = '/public/index.html';
    }, 1500);
    return;
  }

  if (pin.length === 0) {
    adminPinMsg.textContent = "Please enter your PIN.";
    adminPinMsg.className = "lock-status error";
    return;
  }

  try {
    // Validate session and check admin role via server
    const res = await fetch('http://localhost:3000/auth/check-admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        sessionId: sessionId,
        pin: pin 
      })
    });

    const data = await res.json();

    if (data.success && data.isAdmin) {
      // Admin access granted - store admin session
      localStorage.setItem('adminSessionId', data.adminSessionId);
      adminPinOverlay.style.display = "none";
      window.location.href = "/public/admin/index.html";
    } else if (data.success && !data.isAdmin) {
      // User is logged in but not admin
      adminPinMsg.textContent = "Access denied. Admin role required.";
      adminPinMsg.className = "lock-status error";
    } else {
      // Invalid PIN or session
      adminPinMsg.textContent = data.message || "Invalid PIN or session.";
      adminPinMsg.className = "lock-status error";
    }
  } catch (err) {
    adminPinMsg.textContent = "Server error. Please try again.";
    adminPinMsg.className = "lock-status error";
    console.error('Admin auth error:', err);
  }
});

adminPinInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') adminPinSubmit.click();
});
