 /* ==== ADMIN PANEL LOGIC ==== */
  const adminCurrentCode = document.getElementById('adminCurrentCode');
  const adminNewCode = document.getElementById('adminNewCode');
  const adminSetCode = document.getElementById('adminSetCode');
  const adminRevokeInput = document.getElementById('adminRevokeInput');
  const adminUnrevokeInput = document.getElementById('adminUnrevokeInput');
  const adminRevokeBtn = document.getElementById('adminRevokeBtn');
  const adminUnrevokeBtn = document.getElementById('adminUnrevokeBtn');
  const revokedList = document.getElementById('revokedList');
  const adminMsg = document.getElementById('adminMsg');

  function refreshAdminUI() {
    adminCurrentCode.value = currentAccessCode;
    revokedList.textContent = revokedCodes.length ? revokedCodes.join(", ") : "None";
  }

  adminSetCode.addEventListener('click', () => {
    const newCode = adminNewCode.value.trim();
    if (!/^\d{6}$/.test(newCode)) {
      adminMsg.textContent = "Invalid code. Must be 6 digits.";
      adminMsg.style.color = "var(--danger)";
      return;
    }

    if (!revokedCodes.includes(currentAccessCode)) {
      revokedCodes.push(currentAccessCode);
    }

    currentAccessCode = newCode;
    adminMsg.textContent = "Access code updated successfully.";
    adminMsg.style.color = "#7dff8a";

    adminNewCode.value = "";
    refreshAdminUI();
  });

  adminRevokeBtn.addEventListener('click', () => {
    const code = adminRevokeInput.value.trim();
    if (!/^\d{6}$/.test(code)) {
      adminMsg.textContent = "Invalid code.";
      adminMsg.style.color = "var(--danger)";
      return;
    }

    if (!revokedCodes.includes(code)) {
      revokedCodes.push(code);
    }

    adminMsg.textContent = "Code revoked.";
    adminMsg.style.color = "var(--danger)";
    adminRevokeInput.value = "";
    refreshAdminUI();
  });

  adminUnrevokeBtn.addEventListener('click', () => {
    const code = adminUnrevokeInput.value.trim();
    const index = revokedCodes.indexOf(code);

    if (index === -1) {
      adminMsg.textContent = "Code not found in revoked list.";
      adminMsg.style.color = "var(--danger)";
      return;
    }

    revokedCodes.splice(index, 1);
    adminMsg.textContent = "Code restored.";
    adminMsg.style.color = "#7dff8a";
    adminUnrevokeInput.value = "";
    refreshAdminUI();
  });