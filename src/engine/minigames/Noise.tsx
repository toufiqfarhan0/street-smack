import React, { useState, useEffect, useRef } from 'react';
import { soundEngine } from '../audio';

interface MiniGameProps {
  onEarnPoints: (points: number) => void;
}

export const NoiseGame: React.FC<MiniGameProps> = ({ onEarnPoints }) => {
  const [level, setLevel] = useState(0); // 0 to 10
  const [micActive, setMicActive] = useState(false);
  const [micDenied, setMicDenied] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const reqRef = useRef<number>(0);
  const lastScoreRef = useRef(0);

  const startMic = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioCtxRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      setMicActive(true);
      setMicDenied(false);

      const buffer = new Uint8Array(analyser.frequencyBinCount);

      const poll = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(buffer);
        let sum = 0;
        for (let i = 0; i < buffer.length; i++) {
          sum += buffer[i];
        }
        const avg = sum / buffer.length;
        // Scale 0 to 10
        const currentLvl = Math.min(10, Math.floor(avg / 12));
        setLevel(currentLvl);

        const now = performance.now();
        if (currentLvl >= 7 && now - lastScoreRef.current > 350) {
          lastScoreRef.current = now;
          const points = currentLvl >= 9 ? 35 : 20;
          onEarnPoints(points);
          soundEngine.playCritical();
        }

        reqRef.current = requestAnimationFrame(poll);
      };
      reqRef.current = requestAnimationFrame(poll);
    } catch {
      setMicDenied(true);
      setMicActive(false);
    }
  };

  useEffect(() => {
    startMic();

    return () => {
      cancelAnimationFrame(reqRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  const handleManualShout = () => {
    const randomLvl = Math.floor(7 + Math.random() * 4);
    setLevel(randomLvl);
    onEarnPoints(25);
    soundEngine.playCritical();

    setTimeout(() => setLevel(0), 400);
  };

  return (
    <div className={`mgarea casino combo-${level >= 8 ? 4 : level >= 5 ? 2 : 0}`}>
      <div className="vumeter">
        <div className="vucase">
          <div className="vutrack">
            <div className="vusegs">
              {Array.from({ length: 10 }).map((_, i) => {
                const isOn = i < level;
                const type = i >= 8 ? 'r' : i >= 5 ? 'y' : 'g';
                return (
                  <div
                    key={i}
                    className={`vuseg ${isOn ? `on ${type}` : ''}`}
                  />
                );
              })}
            </div>
          </div>
          <div className="vulabel">{level >= 8 ? 'MAX LOUD!' : 'SCREAM!'}</div>
        </div>
      </div>

      {micDenied && (
        <div className="center" style={{ position: 'absolute', bottom: '10px', width: '100%' }}>
          <button
            type="button"
            className="cta small"
            onClick={handleManualShout}
            style={{ fontSize: '13px', padding: '8px 16px' }}
          >
            SHOUT BUTTON (+25)
          </button>
        </div>
      )}

      {!micActive && !micDenied && (
        <div className="center" style={{ position: 'absolute', bottom: '10px', width: '100%' }}>
          <button
            type="button"
            className="ghost"
            onClick={startMic}
          >
            Enable Microphone
          </button>
        </div>
      )}
    </div>
  );
};
