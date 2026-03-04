let currentAccessCode = "123456";

  // Revoked codes – any code here will always be denied
  const revokedCodes = [
    // "123456",
    // "999999",
  ];

  const loginOverlay = document.getElementById('loginOverlay');
  const loginBtn = document.getElementById('loginBtn');
  const loginMsg = document.getElementById('loginMsg');
  const timerStatus = document.getElementById('timerStatus');
  const appEl = document.getElementById('app');
  const codeInputs = document.querySelectorAll('.code-input');

  codeInputs.forEach((input, index) => {
    input.addEventListener('input', () => {
      input.value = input.value.replace(/[^0-9]/g, '');
      if (input.value && index < codeInputs.length - 1) {
        codeInputs[index + 1].focus();
      }
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !input.value && index > 0) {
        codeInputs[index - 1].focus();
      }
      if (e.key === 'Enter') {
        loginBtn.click();
      }
    });
  });

  if (codeInputs[0]) codeInputs[0].focus();

  function getEnteredCode() {
    return Array.from(codeInputs).map(i => i.value).join('');
  }

  function isRevoked(code) {
    return revokedCodes.includes(code);
  }

  loginBtn.addEventListener('click', () => {
    const entered = getEnteredCode();

    if (entered.length < 6) {
      loginMsg.textContent = "Enter full 6-digit code.";
      loginMsg.className = "lock-status error";
      return;
    }

    if (isRevoked(entered)) {
      loginMsg.textContent = "This access code has been revoked.";
      loginMsg.className = "lock-status error";
      return;
    }

    if (entered === currentAccessCode) {
      loginMsg.textContent = "Access granted.";
      loginMsg.className = "lock-status success";

      setTimeout(() => {
        window.location.href = 'user/index.html';
      }, 400);
    } else {
      loginMsg.textContent = "Invalid access code.";
      loginMsg.className = "lock-status error";
    }
  });
