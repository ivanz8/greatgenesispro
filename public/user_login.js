let currentAccessCode = "";

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

  loginBtn.addEventListener('click', async () => {
    const entered = getEnteredCode();

    if (entered.length < 6) {
      loginMsg.textContent = "Enter full 6-digit code.";
      loginMsg.className = "lock-status error";
      return;
    }

    try {
      // Server-side authentication
      const res = await fetch('http://localhost:3000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: entered })
      });

      const data = await res.json();

      if (data.success) {
        // Store session ID in localStorage
        localStorage.setItem('userSessionId', data.sessionId);
        loginMsg.textContent = "Access granted.";
        loginMsg.className = "lock-status success";

        setTimeout(() => {
          window.location.href = '/public/user/index.html';
        }, 400);
      } else {
        loginMsg.textContent = data.message || "Invalid access code.";
        loginMsg.className = "lock-status error";
      }
    } catch (err) {
      loginMsg.textContent = "Server error. Please try again.";
      loginMsg.className = "lock-status error";
      console.error('Login error:', err);
    }
  });
