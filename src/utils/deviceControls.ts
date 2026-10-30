// Real device flashlight hardware controller
let activeVideoStream: MediaStream | null = null;
let activeVideoTrack: MediaStreamTrack | null = null;

export async function setHardwareFlashlight(enabled: boolean): Promise<boolean> {
  try {
    if (enabled) {
      if (!activeVideoStream) {
        activeVideoStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        activeVideoTrack = activeVideoStream.getVideoTracks()[0] || null;
      }
      if (activeVideoTrack) {
        const capabilities = (activeVideoTrack.getCapabilities?.() as any) || {};
        if (capabilities.torch) {
          await (activeVideoTrack as any).applyConstraints({
            advanced: [{ torch: true }],
          });
          return true;
        }
      }
    } else {
      if (activeVideoTrack) {
        try {
          await (activeVideoTrack as any).applyConstraints({
            advanced: [{ torch: false }],
          });
        } catch {}
      }
      if (activeVideoStream) {
        activeVideoStream.getTracks().forEach(t => t.stop());
        activeVideoStream = null;
        activeVideoTrack = null;
      }
      return false;
    }
  } catch (err) {
    console.warn('Hardware flashlight not accessible (using visual torch simulation):', err);
  }
  return false;
}

// Web Audio API chimes for wake-word activation and alert rings
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx || audioCtx.state === 'closed') {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// Chime when voice is recognized / assistant wakes up
export function playWakeChime() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.15, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.25);
  } catch (e) {
    console.error('Audio chime error:', e);
  }
}

// Chime when action is executed
export function playSuccessChime() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(523.25, now); // C5
    osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
    osc.frequency.setValueAtTime(783.99, now + 0.16); // G5

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.35);
  } catch (e) {}
}

// Alarm ringing buzzer
export function playAlarmBuzzer(): () => void {
  try {
    const ctx = getAudioContext();
    let isPlaying = true;
    let timerId: number | null = null;

    const playBeep = () => {
      if (!isPlaying) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.setValueAtTime(1046.5, now + 0.1);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);

      if (isPlaying) {
        timerId = window.setTimeout(playBeep, 500);
      }
    };

    playBeep();

    return () => {
      isPlaying = false;
      if (timerId) clearTimeout(timerId);
    };
  } catch (e) {
    return () => {};
  }
}

// Realistic incoming phone ringtone generator
export function playPhoneRingtone(): () => void {
  try {
    const ctx = getAudioContext();
    let isRinging = true;
    let timerId: number | null = null;

    const ringBurst = () => {
      if (!isRinging) return;
      const now = ctx.currentTime;

      // First beep
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(440, now);
      osc2.frequency.setValueAtTime(480, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.05);
      gain.gain.setValueAtTime(0.2, now + 0.9);
      gain.gain.linearRampToValueAtTime(0.001, now + 1.0);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 1.0);
      osc2.stop(now + 1.0);

      // Second burst 1.2s later
      const nextTime = now + 1.2;
      const osc3 = ctx.createOscillator();
      const osc4 = ctx.createOscillator();
      const gain2 = ctx.createGain();

      osc3.type = 'sine';
      osc4.type = 'sine';
      osc3.frequency.setValueAtTime(440, nextTime);
      osc4.frequency.setValueAtTime(480, nextTime);

      gain2.gain.setValueAtTime(0.001, nextTime);
      gain2.gain.linearRampToValueAtTime(0.2, nextTime + 0.05);
      gain2.gain.setValueAtTime(0.2, nextTime + 0.9);
      gain2.gain.linearRampToValueAtTime(0.001, nextTime + 1.0);

      osc3.connect(gain2);
      osc4.connect(gain2);
      gain2.connect(ctx.destination);

      osc3.start(nextTime);
      osc4.start(nextTime);
      osc3.stop(nextTime + 1.0);
      osc4.stop(nextTime + 1.0);

      if (isRinging) {
        timerId = window.setTimeout(ringBurst, 3500);
      }
    };

    ringBurst();

    return () => {
      isRinging = false;
      if (timerId) clearTimeout(timerId);
    };
  } catch (e) {
    return () => {};
  }
}

// Battery API helper
export async function fetchBatteryInfo(): Promise<{ level: number; charging: boolean } | null> {
  try {
    if ('getBattery' in navigator) {
      const battery: any = await (navigator as any).getBattery();
      return {
        level: Math.round(battery.level * 100),
        charging: battery.charging,
      };
    }
  } catch {}
  return null;
}
