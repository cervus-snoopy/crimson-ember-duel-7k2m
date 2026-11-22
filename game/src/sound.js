// Ember Duel — sound effects. Short synthesized tones via Web Audio only.
// No audio files, no network requests.
let audioCtx = null;
let muted = false;

function ctx() {
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    audioCtx = new AC();
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function tone(freq, dur, type, gain) {
  if (muted) return;
  const ac = ctx();
  if (!ac) return;
  const osc = ac.createOscillator();
  const amp = ac.createGain();
  osc.type = type || 'sine';
  osc.frequency.value = freq;
  amp.gain.setValueAtTime(gain || 0.08, ac.currentTime);
  amp.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
  osc.connect(amp);
  amp.connect(ac.destination);
  osc.start();
  osc.stop(ac.currentTime + dur);
}

export const sfx = {
  play() { tone(520, 0.12, 'triangle', 0.09); tone(780, 0.1, 'triangle', 0.06); },
  hit() { tone(180, 0.15, 'sawtooth', 0.08); },
  guard() { tone(330, 0.18, 'sine', 0.08); },
  heal() { tone(660, 0.25, 'sine', 0.07); tone(880, 0.2, 'sine', 0.05); },
  burn() { tone(240, 0.3, 'sawtooth', 0.06); tone(120, 0.3, 'square', 0.04); },
  turn() { tone(440, 0.1, 'triangle', 0.06); },
  win() { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 0.25, 'triangle', 0.08), i * 120)); },
  loss() { [400, 320, 240, 160].forEach((f, i) => setTimeout(() => tone(f, 0.3, 'sawtooth', 0.06), i * 140)); },
  click() { tone(600, 0.06, 'triangle', 0.05); },
};

export function toggleMute() {
  muted = !muted;
  return muted;
}

export function isMuted() {
  return muted;
}
