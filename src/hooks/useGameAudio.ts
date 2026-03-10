import { useRef, useCallback, useEffect } from "react";

// Generate a simple chiptune-style melody using Web Audio API
function createMelody(ctx: AudioContext, destination: AudioNode) {
  const notes = [
    { freq: 523.25, dur: 0.2 }, // C5
    { freq: 587.33, dur: 0.2 }, // D5
    { freq: 659.25, dur: 0.2 }, // E5
    { freq: 523.25, dur: 0.2 }, // C5
    { freq: 659.25, dur: 0.3 }, // E5
    { freq: 783.99, dur: 0.3 }, // G5
    { freq: 659.25, dur: 0.2 }, // E5
    { freq: 523.25, dur: 0.2 }, // C5
    { freq: 392.0, dur: 0.3 },  // G4
    { freq: 440.0, dur: 0.2 },  // A4
    { freq: 523.25, dur: 0.3 }, // C5
    { freq: 440.0, dur: 0.2 },  // A4
    { freq: 392.0, dur: 0.4 },  // G4
  ];

  const totalDuration = notes.reduce((sum, n) => sum + n.dur, 0);
  let time = ctx.currentTime;

  notes.forEach(({ freq, dur }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(freq, time);
    gain.gain.setValueAtTime(0.08, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur - 0.02);
    osc.connect(gain);
    gain.connect(destination);
    osc.start(time);
    osc.stop(time + dur);
    time += dur;
  });

  return totalDuration;
}

export function useGameAudio() {
  const ctxRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<number | null>(null);
  const enabledRef = useRef(true);

  const getCtx = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext();
    }
    return ctxRef.current;
  }, []);

  const playJumpSound = useCallback(() => {
    if (!enabledRef.current) return;
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  }, [getCtx]);

  const playLandSound = useCallback(() => {
    if (!enabledRef.current) return;
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  }, [getCtx]);

  const playGameOverSound = useCallback(() => {
    if (!enabledRef.current) return;
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.5);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  }, [getCtx]);

  const startMusic = useCallback(() => {
    if (!enabledRef.current) return;
    stopMusic();
    const ctx = getCtx();
    const loopOnce = () => createMelody(ctx, ctx.destination);
    const dur = loopOnce();
    intervalRef.current = window.setInterval(loopOnce, dur * 1000);
  }, [getCtx]);

  const stopMusic = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const setEnabled = useCallback((val: boolean) => {
    enabledRef.current = val;
    if (!val) stopMusic();
  }, [stopMusic]);

  useEffect(() => {
    return () => {
      stopMusic();
      ctxRef.current?.close();
    };
  }, [stopMusic]);

  return { playJumpSound, playLandSound, playGameOverSound, startMusic, stopMusic, setEnabled, enabledRef };
}
