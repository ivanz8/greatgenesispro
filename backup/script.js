
document.addEventListener('DOMContentLoaded', () => {
  /* ==== ACCESS CODE LOGIC (REVOCABLE) ==== */
  // Current valid access code (6 digits)
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
        window.location.href = 'public/user';
      }, 400);
    } else {
      loginMsg.textContent = "Invalid access code.";
      loginMsg.className = "lock-status error";
    }
  });

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
      adminPanel.style.display = "block";
      refreshAdminUI();
    } else {
      adminPinMsg.textContent = "Incorrect PIN.";
      adminPinMsg.className = "lock-status error";
    }
  });

  adminPinInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') adminPinSubmit.click();
  });

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

  /* ==== ENGINE STATE ==== */
  let active=false, profit=0, capital=50000, roundsDone=0, wins=0, losses=0;
  let seqIndex=0, lastWinner='a', bet=100;

  /* ==== ELEMENTS ==== */
  const labelAEl=document.getElementById('labelA');
  const labelBEl=document.getElementById('labelB');
  const startSideEl=document.getElementById('startSide');
  const baseBetEl=document.getElementById('baseBet');
  const roundStepEl=document.getElementById('roundStep');
  const capitalEl=document.getElementById('capital');
  const multiplierEl=document.getElementById('multiplier');
  const targetRoundsEl=document.getElementById('targetRounds');

  const startBtn=document.getElementById('startBtn');
  const stopBtn=document.getElementById('stopBtn');
  const markWinBtn=document.getElementById('markWin');
  const markLoseBtn=document.getElementById('markLose');
  const markTieBtn=document.getElementById('markTie');
  const assistCopy=document.getElementById('assistCopy');
  const assistSpeak=document.getElementById('assistSpeak');

  const statusEl=document.getElementById('status');
  const logEl=document.getElementById('log');
  const analyticsEl=document.getElementById('analyticsContent');

  /* ==== HELPERS ==== */
  const sNum=(v,d=0)=>{const n=parseFloat(v);return isNaN(n)?d:n;};
  const roundTo=(v)=>{const step=Math.max(1,sNum(roundStepEl.value,50));return Math.max(step,Math.round(v/step)*step);};
  const appendLog=(s)=>{
    const t=new Date().toLocaleTimeString();
    logEl.textContent+=`[${t}] ${s}\n`;
    logEl.scrollTop=logEl.scrollHeight;
  };

  function nextPrediction(){
    const A=labelAEl.value.trim()||'A', B=labelBEl.value.trim()||'B';
    const seqA=[B,B,A,A,B,B,A,A,B,B];
    const seqB=[A,A,B,B,A,A,B,B,A,A];
    return (lastWinner==='a'?seqA:seqB)[seqIndex%10];
  }
  function updateStatus(msg){
    bet=roundTo(bet);
    statusEl.innerHTML=(msg?msg+'<br>':'')+
      `<b>Next:</b> ${nextPrediction()} | <b>Bet:</b> ${bet} | <b>Cap:</b> ${capital} | <b>Round:</b> ${roundsDone}/${targetRoundsEl.value}`;
  }
  function updateAnalytics(){
    const winRate = roundsDone ? ((wins/roundsDone)*100).toFixed(1) : 0;
    const lossRate = roundsDone ? ((losses/roundsDone)*100).toFixed(1) : 0;
    analyticsEl.textContent =
      `Wins: ${wins} | Losses: ${losses} | Win Rate: ${winRate}% | Loss Rate: ${lossRate}% | Profit: ${profit}`;
  }
  function finishIfGoal(){
    if(roundsDone>=sNum(targetRoundsEl.value,100)){
      active=false;
      appendLog("Target rounds reached.");
      updateStatus("Stopped — target rounds reached.");
    }
  }

  /* ==== ENGINE CONTROLS ==== */
  startBtn.addEventListener('click', ()=>{
    if(active) return;
    capital=sNum(capitalEl.value,50000);
    bet=roundTo(sNum(baseBetEl.value,100));
    roundsDone=0; seqIndex=0; lastWinner=(startSideEl.value||'a');
    wins=0; losses=0; profit=0;
    active=true;
    appendLog("ENGINE STARTED");
    updateStatus("READY — follow Next & mark WIN/LOSE/TIE");
    updateAnalytics();
  });

  stopBtn.addEventListener('click', ()=>{
    if(!active) { appendLog("ENGINE already stopped."); return; }
    active=false;
    appendLog("ENGINE STOPPED");
    updateStatus("Stopped");
    updateAnalytics();
  });

  markWinBtn.addEventListener('click', ()=>{
    if(!active) return appendLog("Ignored WIN (not active).");
    const pred = nextPrediction().trim();
    profit += bet; capital += bet; wins++;
    const base = roundTo(sNum(baseBetEl.value,100));
    seqIndex = 0;
    const A = (labelAEl.value.trim()||'A');
    lastWinner = (pred === A) ? 'a' : 'b';
    roundsDone++;
    appendLog(`WIN | Pred=${pred} | +${bet} | Cap=${capital} | Round ${roundsDone}`);
    bet = base;
    updateStatus("WIN — reset bet & sequence.");
    updateAnalytics();
    finishIfGoal();
  });

  markLoseBtn.addEventListener('click', ()=>{
    if(!active) return appendLog("Ignored LOSE (not active).");
    const pred = nextPrediction().trim();
    profit -= bet; capital -= bet; losses++;
    bet = roundTo(bet * Math.max(1, sNum(multiplierEl.value,2.5)));
    seqIndex++;
    const A = (labelAEl.value.trim()||'A');
    lastWinner = (pred === A) ? 'b' : 'a';
    roundsDone++;
    appendLog(`LOSE | Pred=${pred} | NextBet=${bet} | Cap=${capital} | Round ${roundsDone}`);
    updateStatus("LOSE — bet escalated & sequence incremented.");
    updateAnalytics();
    finishIfGoal();
  });

  markTieBtn.addEventListener('click', ()=>{
    if(!active) return appendLog("Ignored TIE (not active).");
    seqIndex = 0; roundsDone++;
    appendLog(`TIE | sequence reset only (bet stays ${bet}) | Round ${roundsDone}`);
    updateStatus("TIE — sequence reset only.");
    updateAnalytics();
    finishIfGoal();
  });

  /* ==== ASSIST ==== */
  const currentAssistText = ()=>`NEXT: ${nextPrediction()}\nBET: ${bet}\nCAP: ${capital}`;

  assistCopy.addEventListener('click', async ()=>{
    try{
      await navigator.clipboard.writeText(currentAssistText());
      appendLog("Copied next bet.");
      updateStatus("Copied next bet.");
    }catch(e){
      appendLog("Clipboard blocked.");
    }
  });

  assistSpeak.addEventListener('click', ()=>{
    try{
      const t=new SpeechSynthesisUtterance(currentAssistText().replace(/\n/g, ', '));
      speechSynthesis.cancel();
      speechSynthesis.speak(t);
      appendLog("Speaking next bet.");
    }catch(e){
      appendLog("Speech not available.");
    }
  });

  /* ==== VOICE COMMANDS (optional) ==== */
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if(SpeechRecognition){
    try{
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.lang = 'en-US';
      recognition.onresult = (event) => {
        const command = event.results[event.results.length - 1][0].transcript.trim().toLowerCase();
        if (command.includes("start")) startBtn.click();
        else if (command.includes("stop")) stopBtn.click();
        else if (command.includes("win")) markWinBtn.click();
        else if (command.includes("lose")) markLoseBtn.click();
        else if (command.includes("tie")) markTieBtn.click();
      };
      recognition.start();
      appendLog("🎤 Voice commands active: say 'start', 'stop', 'win', 'lose', 'tie'.");
    }catch(e){
      appendLog("Voice recognition not available.");
    }
  } else {
    appendLog("Voice recognition not supported in this browser.");
  }

  /* ==== INITIAL UI ==== */
  updateStatus("Ready.");
  updateAnalytics();
});
