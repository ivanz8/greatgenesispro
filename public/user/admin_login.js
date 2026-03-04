 /* ==== ADMIN PANEL WITH PIN ==== */
  const adminPanel = document.getElementById('adminPanel');
  const openAdmin = document.getElementById('openAdmin');

  const adminPinOverlay = document.getElementById('adminPinOverlay');
  const adminPinInput = document.getElementById('adminPinInput');
  const adminPinSubmit = document.getElementById('adminPinSubmit');
  const adminPinMsg = document.getElementById('adminPinMsg');

  // Set your admin PIN here
  const ADMIN_PIN = "J380619V";

  openAdmin.addEventListener('click', () => {
    adminPinOverlay.style.display = "flex";
    adminPinInput.value = "";
    adminPinMsg.textContent = "";
    adminPinMsg.className = "lock-status";
    adminPinInput.focus();
  });

  adminPinSubmit.addEventListener('click', () => {
    const pin = adminPinInput.value.trim();

    if (pin === ADMIN_PIN) {
      adminPinOverlay.style.display = "none";
      window.location.href = "/public/admin/index.html";
    } else {
      adminPinMsg.textContent = "Incorrect PIN.";
      adminPinMsg.className = "lock-status error";
    }
  });

  adminPinInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') adminPinSubmit.click();
  });

 