import React, { useState, useMemo } from 'react';
import { soundEngine } from '../audio';

interface MinesProps {
  onScore: (points: number, finished: boolean) => void;
}

const GRID_SIZE = 25; // 5x5
const NUM_BOMBS = 3;
const GEM_POINTS = 50;

export const MinesGame: React.FC<MinesProps> = ({ onScore }) => {
  // Generate random bomb positions
  const bombIndices = useMemo(() => {
    const bombs = new Set<number>();
    while (bombs.size < NUM_BOMBS) {
      bombs.add(Math.floor(Math.random() * GRID_SIZE));
    }
    return bombs;
  }, []);

  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [gameOver, setGameOver] = useState(false);

  const handleTileClick = (index: number) => {
    if (gameOver || revealed.has(index)) return;

    const nextRevealed = new Set(revealed).add(index);
    setRevealed(nextRevealed);

    const isBomb = bombIndices.has(index);
    const gemCount = [...nextRevealed].filter(i => !bombIndices.has(i)).length;
    const allGemsFound = gemCount === (GRID_SIZE - NUM_BOMBS);
    const isFinished = isBomb || allGemsFound;

    if (isFinished) {
      setGameOver(true);
      if (isBomb) {
        soundEngine.playHit();
      } else {
        soundEngine.playCritical();
      }
    } else {
      soundEngine.playCritical();
    }

    onScore(gemCount * GEM_POINTS, isFinished);
  };

  return (
    <div className="mines" role="region" aria-label="Mines grid">
      {Array.from({ length: GRID_SIZE }, (_, idx) => {
        const isRevealed = revealed.has(idx) || (gameOver && bombIndices.has(idx));
        const isBomb = bombIndices.has(idx);
        const tileType = isBomb ? 'boom' : 'gem';
        const isDimmed = gameOver && !revealed.has(idx);

        return (
          <button
            key={idx}
            type="button"
            aria-label={`Tile ${idx + 1}`}
            disabled={isRevealed || gameOver}
            className={`tile ${isRevealed ? tileType : ''} ${isDimmed ? 'dimmed' : ''}`}
            onClick={() => handleTileClick(idx)}
          >
            {isRevealed && (
              <img
                className="tileicon"
                src={isBomb ? '/img/bomb.png' : '/img/diamond.png'}
                alt={isBomb ? 'Bomb' : 'Diamond'}
              />
            )}
          </button>
        );
      })}
    </div>
  );
};
