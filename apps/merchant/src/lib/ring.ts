import { Platform, Vibration } from 'react-native';

/**
 * The new-order alarm: rings like a phone call until the shop answers.
 * Web (testing): a two-tone beep every 1.5 s. Phones: a vibration pattern;
 * a real ringtone that sounds on silent comes with the phone build.
 */
let timer: ReturnType<typeof setInterval> | null = null;
let audio: AudioContext | null = null;

function beep() {
  if (typeof window === 'undefined') return;
  const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return;
  audio = audio ?? new Ctx();
  const now = audio.currentTime;
  [880, 660].forEach((freq, i) => {
    const osc = audio!.createOscillator();
    const gain = audio!.createGain();
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.25, now + i * 0.25);
    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.25 + 0.22);
    osc.connect(gain).connect(audio!.destination);
    osc.start(now + i * 0.25);
    osc.stop(now + i * 0.25 + 0.24);
  });
}

export function startRinging() {
  if (timer) return;
  if (Platform.OS === 'web') {
    beep();
    timer = setInterval(beep, 1500);
  } else {
    Vibration.vibrate([0, 700, 500], true);
    timer = setInterval(() => undefined, 60_000);
  }
}

export function stopRinging() {
  if (!timer) return;
  clearInterval(timer);
  timer = null;
  if (Platform.OS !== 'web') Vibration.cancel();
}
