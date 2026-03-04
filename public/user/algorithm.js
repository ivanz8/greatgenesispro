
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

