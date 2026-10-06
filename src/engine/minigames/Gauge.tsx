import React, { useState, useEffect, useRef } from 'react';
import { soundEngine } from '../audio';

interface MiniGameProps {
  onEarnPoints: (points: number) => void;
}

export const GaugeGame: React.FC<MiniGameProps> = ({ onEarnPoints }) => {
  const [angle, setAngle] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const runningRef = useRef(true);
  const reqRef = useRef<number>(0);

  useEffect(() => {
    let start = performance.now();
    const loop = (now: number) => {
      if (runningRef.current) {
        const elapsed = now - start;
        // Oscillates between -70 and 70 degrees
        const currentAngle = Math.sin(elapsed / 220) * 68;
        setAngle(currentAngle);
      }
      reqRef.current = requestAnimationFrame(loop);
    };
    reqRef.current = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(reqRef.current);
  }, []);

  const handleStop = () => {
    const diff = Math.abs(angle);
    let earned = 0;
    let label = '';

    if (diff < 12) {
      earned = 60;
      label = 'JACKPOT! +60';
      soundEngine.playCritical();
    } else if (diff < 32) {
      earned = 30;
      label = 'NICE! +30';
      soundEngine.playHit();
    } else if (diff < 50) {
      earned = 10;
      label = 'OK! +10';
      soundEngine.playHit();
    } else {
      earned = -30;
      label = 'MISS! -30';
      soundEngine.playHit();
    }

    onEarnPoints(earned);
    setFeedback(label);
    runningRef.current = false;

    setTimeout(() => {
      setFeedback(null);
      runningRef.current = true;
    }, 900);
  };

  return (
    <div className="mgarea casino gaugewrap">
      <div className="dial">
        <svg viewBox="0 0 200 110" className="dialsvg">
          {/* Outer Red Arc */}
          <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#ff3a2a" strokeWidth="16" />
          {/* Middle Purple Arc */}
          <path d="M 45 60 A 80 80 0 0 1 155 60" fill="none" stroke="#9c8bff" strokeWidth="16" />
          {/* Center Gold Bullseye */}
          <path d="M 85 24 A 80 80 0 0 1 115 24" fill="none" stroke="#ffc23a" strokeWidth="18" />
        </svg>

        <div className="needlepivot">
          <div
            className="needle"
            style={{ transform: `rotate(${angle}deg)`, transformOrigin: 'bottom center' }}
          />
          <div className="needlecap" />
        </div>
      </div>

      <button
        type="button"
        className="casino-gstop"
        onClick={handleStop}
        disabled={!runningRef.current}
      >
        {runningRef.current ? 'STOP CURSOR!' : feedback}
      </button>

      {feedback && feedback.includes('JACKPOT') && (
        <div className="jackpot">★ JACKPOT! ★</div>
      )}
    </div>
  );
};
