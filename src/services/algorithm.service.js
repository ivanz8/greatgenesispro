class Engine {
  constructor() {
    this.reset();
  }

  reset() {
    this.active = false;
    this.profit = 0;
    this.capital = 50000;
    this.roundsDone = 0;
    this.wins = 0;
    this.losses = 0;
    this.seqIndex = 0;
    this.lastWinner = 'a';
    this.bet = 100;

    this.settings = {
      labelA: 'Player',
      labelB: 'Banker',
      baseBet: 100,
      roundStep: 50,
      multiplier: 2.5,
      targetRounds: 100
    };
  }

  roundTo(v) {
    const step = Math.max(1, this.settings.roundStep);
    return Math.max(step, Math.round(v / step) * step);
  }

  nextPrediction() {
    const A = this.settings.labelA;
    const B = this.settings.labelB;

    const seqA = [B,B,A,A,B,B,A,A,B,B];
    const seqB = [A,A,B,B,A,A,B,B,A,A];

    return (this.lastWinner === 'a' ? seqA : seqB)[this.seqIndex % 10];
  }

  start(config) {
    this.reset();
    this.settings = { ...this.settings, ...config };
    this.capital = config.capital || 50000;
    this.bet = this.roundTo(this.settings.baseBet);
    this.lastWinner = config.startSide || 'a';
    this.active = true;
    return this.getState("ENGINE STARTED");
  }

  stop() {
    this.active = false;
    return this.getState("ENGINE STOPPED");
  }

  win() {
    if (!this.active) return this.getState("Not active");

    const pred = this.nextPrediction();
    this.profit += this.bet;
    this.capital += this.bet;
    this.wins++;
    this.seqIndex = 0;

    this.lastWinner = pred === this.settings.labelA ? 'a' : 'b';
    this.roundsDone++;
    this.bet = this.roundTo(this.settings.baseBet);

    return this.getState("WIN");
  }

  lose() {
    if (!this.active) return this.getState("Not active");

    const pred = this.nextPrediction();

    this.profit -= this.bet;
    this.capital -= this.bet;
    this.losses++;

    this.bet = this.roundTo(this.bet * this.settings.multiplier);
    this.seqIndex++;
    this.lastWinner = pred === this.settings.labelA ? 'b' : 'a';
    this.roundsDone++;

    return this.getState("LOSE");
  }

  tie() {
    if (!this.active) return this.getState("Not active");

    this.seqIndex = 0;
    this.roundsDone++;

    return this.getState("TIE");
  }

  getState(message = "") {
    return {
      message,
      active: this.active,
      next: this.nextPrediction(),
      bet: this.bet,
      capital: this.capital,
      roundsDone: this.roundsDone,
      wins: this.wins,
      losses: this.losses,
      profit: this.profit
    };
  }
}

module.exports = Engine;