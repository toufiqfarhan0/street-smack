import React, { useState, useRef } from 'react';
import { CharacterSvg, FIGHTERS } from '../engine/fighters';
import { soundEngine } from '../engine/audio';

export interface RarityDef {
  name: string;
  color: string;
}

export const RARITIES: RarityDef[] = [
  { name: 'Common', color: '#9c8bff' },
  { name: 'Rare', color: '#4fa3e0' },
  { name: 'Epic', color: '#ff5a3c' },
  { name: 'Legendary', color: '#ffc23a' }
];

interface BoosterProps {
  character: string;
  rarity: number; // 0 to 3
  matchId: number;
  onDone: () => void;
}

const TEAR_THRESHOLD = 0.85;

export const Booster: React.FC<BoosterProps> = ({ character, rarity, matchId, onDone }) => {
  const [dragProgress, setDragProgress] = useState(0);
  const [tilt, setTilt] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const isDragging = useRef(false);
  const startX = useRef(0);
  const packRef = useRef<HTMLDivElement>(null);

  const rDef = RARITIES[rarity] || RARITIES[3];
  const fighter = FIGHTERS[character] || FIGHTERS['tung'];

  const triggerReveal = () => {
    if (!revealed) {
      setRevealed(true);
      setDragProgress(1);
      soundEngine.playCritical();
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    startX.current = e.clientX;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const rect = packRef.current?.getBoundingClientRect();
    if (rect) {
      const normalizedTilt = Math.max(-1, Math.min(1, ((e.clientY - rect.top) / rect.height - 0.5) * 2));
      setTilt(normalizedTilt);
    }

    if (!isDragging.current || revealed) return;

    const width = rect?.width || 224;
    const progress = Math.max(0, Math.min(1, (e.clientX - startX.current) / (width * 0.85)));
    setDragProgress(progress);

    if (progress >= TEAR_THRESHOLD) {
      triggerReveal();
    }
  };

  const handlePointerUp = () => {
    isDragging.current = false;
    if (!revealed) {
      setDragProgress(0);
    }
  };

  const ssWatermarkSvg = `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYwIiBoZWlnaHQ9IjE2MCIgdmlld0JveD0iMCAwIDE2MCAxNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgb3BhY2l0eT0iMC4wOCI+PGNpcmNsZSBjeD0iODAiIGN5PSI4MCIgcj0iNzAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzlDOEJGRiIgc3Ryb2tlLXdpZHRoPSIyIi8+PGcgZm9udC1mYW1pbHk9IkJ1bmdlZSwgSW1wYWN0LCBBcmlhbCBCbGFjaywgc2Fucy1zZXJpZiIgZm9udC1zaXplPSI0NiIgZmlsbD0iIzlDOEJGRiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+PHRleHQgeD0iNTUiIHk9Ijk3Ij5TPC90ZXh0Pjx0ZXh0IHg9IjEwNSIgeT0iOTciPlM8L3RleHQ+PC9nPjwvc3ZnPg==`;

  return (
    <div className={`boosterstage lvl-${rarity} ${revealed ? 'revealed' : ''}`}>
      {!revealed && (
        <div className="boosterscene">
          <div className="boosterrays" />
          <div
            className="boostershadow"
            style={{ '--drag': dragProgress, '--tilt': tilt } as React.CSSProperties}
          />

          <div className={`boosterpackspin ${dragProgress > 0.02 ? 'settled' : ''}`}>
            <div
              ref={packRef}
              className="boosterpack"
              style={{
                '--drag': dragProgress,
                '--c': rDef.color,
                '--tilt': tilt
              } as React.CSSProperties}
              onPointerMove={handlePointerMove}
            >
              <div
                className="boosterbody"
                style={{ backgroundImage: `url(${ssWatermarkSvg})` }}
              >
                <img
                  className="boosterlogo"
                  src="/img/street-smack-logo.png"
                  alt="Street Smack"
                  draggable={false}
                  style={{
                    width: '78%',
                    height: 'auto',
                    position: 'absolute',
                    top: '38%',
                    left: '11%',
                    filter: 'drop-shadow(0 4px 14px rgba(0,0,0,0.8))'
                  }}
                />
                <div className="boosterspecular" />

                <div className="boostertearzone">
                  <div className="boosterglowpeek" />
                  <div
                    className="boostertop"
                    style={{ backgroundImage: `url(${ssWatermarkSvg})` }}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                  >
                    <div className="boostertopholo" />
                    <div className="boosterperf" />
                  </div>
                </div>
              </div>

              {dragProgress < 0.08 && (
                <div className="boosterhint">Swipe right to tear open →</div>
              )}
            </div>
          </div>
        </div>
      )}

      {revealed && (
        <div className="boosterreveal">
          <div className="boosterglow" />
          {Array.from({ length: rarity === 3 ? 24 : 14 }).map((_, i) => (
            <i
              key={i}
              className="boosterspark"
              style={{
                '--a': `${(i * 360) / (rarity === 3 ? 24 : 14)}deg`
              } as React.CSSProperties}
            />
          ))}

          <div
            className="nft"
            style={{
              '--c': rDef.color,
              display: 'grid',
              justifyItems: 'center',
              gap: '8px'
            } as React.CSSProperties}
          >
            <div
              style={{
                width: '100%',
                maxWidth: '240px',
                border: '3px solid #000',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: `0 0 0 3px ${rDef.color}, 0 0 36px ${rDef.color}`
              }}
            >
              <CharacterSvg character={character} facing="right" pose="victory" />
            </div>

            <div className="rar" style={{ color: rDef.color, fontFamily: 'var(--display)', fontSize: '22px' }}>
              {rDef.name.toUpperCase()} NFT
            </div>

            <div className="sub" style={{ color: 'var(--bone-dim)', fontSize: '13px' }}>
              {fighter.name} · Token #{Math.floor(1000 + Math.random() * 9000)}
            </div>

            <div className="sub" style={{ color: 'var(--bone-dim)', fontSize: '12px' }}>
              Match #{matchId} · Minted on Solana Devnet (Compressed NFT)
            </div>

            <div className="boosternext" style={{ marginTop: '16px' }}>
              <button
                type="button"
                className="cta"
                onClick={onDone}
                style={{ padding: '12px 24px' }}
              >
                NEXT MATCH →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
