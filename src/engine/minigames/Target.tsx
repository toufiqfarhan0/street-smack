import React, { useState, useEffect, useRef } from 'react';
import { soundEngine } from '../audio';

interface MiniGameProps {
  onEarnPoints: (points: number) => void;
}

export const TargetGame: React.FC<MiniGameProps> = ({ onEarnPoints }) => {
  const [targetPos, setTargetPos] = useState({ x: 50, y: 50 });
  const [pops, setPops] = useState<{ id: number; x: number; y: number; text: string; plus: boolean }[]>([]);
  const counterRef = useRef(0);

  const moveTarget = () => {
    const x = Math.floor(15 + Math.random() * 70);
    const y = Math.floor(15 + Math.random() * 70);
    setTargetPos({ x, y });
  };

  useEffect(() => {
    const timer = setInterval(moveTarget, 1600);
    return () => clearInterval(timer);
  }, []);

  const handleHit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEarnPoints(30);
    soundEngine.playCritical();

    const id = ++counterRef.current;
    setPops(prev => [...prev.slice(-8), { id, x: targetPos.x, y: targetPos.y, text: '+30', plus: true }]);
    setTimeout(() => setPops(prev => prev.filter(p => p.id !== id)), 600);

    moveTarget();
  };

  const handleMiss = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    onEarnPoints(-10);
    soundEngine.playHit();

    const id = ++counterRef.current;
    setPops(prev => [...prev.slice(-8), { id, x, y, text: '-10', plus: false }]);
    setTimeout(() => setPops(prev => prev.filter(p => p.id !== id)), 600);
  };

  return (
    <div className="mgarea casino" onClick={handleMiss} style={{ cursor: 'crosshair' }}>
      <button
        type="button"
        className="target casino-target"
        style={{ left: `${targetPos.x}%`, top: `${targetPos.y}%`, transform: 'translate(-50%, -50%)' }}
        onClick={handleHit}
        aria-label="Hit target"
      >
        <img src="/img/bomb.png" alt="Target" className="target-icon" />
      </button>

      {pops.map(p => (
        <span
          key={p.id}
          className={`float ${p.plus ? 'plus' : 'minus'}`}
          style={{ left: `${p.x}%`, top: `${p.y}%` }}
        >
          {p.text}
        </span>
      ))}
    </div>
  );
};
