import React, { useState, useRef } from 'react';
import { soundEngine } from '../audio';

interface MiniGameProps {
  onEarnPoints: (points: number) => void;
}

export const ClickerGame: React.FC<MiniGameProps> = ({ onEarnPoints }) => {
  const [combo, setCombo] = useState(0);
  const [pops, setPops] = useState<{ id: number; x: number; y: number; text: string; lvl: number }[]>([]);
  const lastClicksRef = useRef<number[]>([]);
  const counterRef = useRef(0);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const now = performance.now();
    lastClicksRef.current.push(now);
    // keep clicks within 1.2s window
    lastClicksRef.current = lastClicksRef.current.filter(t => now - t <= 1200);

    const speed = lastClicksRef.current.length;
    const lvl = speed >= 9 ? 4 : speed >= 7 ? 3 : speed >= 5 ? 2 : speed >= 3 ? 1 : 0;
    setCombo(lvl);

    const bonus = lvl * 4;
    const earned = 8 + bonus;
    onEarnPoints(earned);
    soundEngine.playHit();

    const id = ++counterRef.current;
    setPops(prev => [...prev.slice(-10), { id, x, y, text: `+${earned}`, lvl }]);
    setTimeout(() => {
      setPops(prev => prev.filter(p => p.id !== id));
    }, 700);
  };

  return (
    <div className={`mgarea casino combo-${combo}`}>
      <button
        type="button"
        className={`bigtap casino-tap lvl-${combo}`}
        onClick={handleClick}
        aria-label="Tap rapidly to gain aura points"
      >
        <img src="/img/cherry.png" alt="Tap" className="spin-icon" />
      </button>

      {combo > 0 && (
        <div className={`combotag lvl-${combo}`}>
          <img src="/img/diamond.png" alt="Combo" className="combotag-icon" />
          <span>COMBO x{combo + 1}!</span>
        </div>
      )}

      {pops.map(p => (
        <span
          key={p.id}
          className={`clickpop lvl-${p.lvl}`}
          style={{ left: `${p.x}px`, top: `${p.y}px` }}
        >
          {p.text}
        </span>
      ))}
    </div>
  );
};
