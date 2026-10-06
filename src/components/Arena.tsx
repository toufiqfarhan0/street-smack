import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { gameState, FightMatch } from '../engine/gameState';
import { CharacterSvg, FIGHTERS } from '../engine/fighters';

interface ArenaProps {
  onJoinAsPlayer: () => void;
}

export const Arena: React.FC<ArenaProps> = ({ onJoinAsPlayer }) => {
  const [, setTick] = useState(0);

  useEffect(() => {
    return gameState.subscribe(() => setTick(t => t + 1));
  }, []);

  const match = gameState.match;
  const fighterA = FIGHTERS[match.charA] || FIGHTERS['tung'];
  const fighterB = FIGHTERS[match.charB] || FIGHTERS['tralalero'];

  // Aura clash beam center offset (-50% to +50%)
  const clashOffset = (match.auraA - match.auraB) / 2;

  // Phone QR code join URL
  const phoneJoinUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/#/controller`
    : 'https://street-smack.vercel.app/#/controller';

  return (
    <div className="screen">
      {/* Big Screen Arena Stage */}
      <div className={`sa-stage ${gameState.screenShake ? 'shake' : ''}`}>
        <div className="sa-shaker">
          {/* Background Dojo Grid */}
          <div
            className="sa-world"
            style={{
              background: 'radial-gradient(ellipse at 50% 30%, #2a1545 0%, #0d0617 80%)'
            }}
          />

          {/* Center Aura Clash Beam */}
          {match.status === 'live' && (
            <div
              style={{
                position: 'absolute',
                top: '30%',
                bottom: '15%',
                left: `calc(50% + ${clashOffset * 1.5}%)`,
                width: '6px',
                background: 'linear-gradient(180deg, #fff, #ffc23a 40%, #ff5a3c)',
                boxShadow: '0 0 24px 8px #ffc23a, 0 0 45px 16px #ff5a3c',
                transform: 'translateX(-50%)',
                opacity: 0.85,
                zIndex: 2,
                pointerEvents: 'none'
              }}
            />
          )}

          {/* Fighter A (Left) */}
          <div
            style={{
              position: 'absolute',
              bottom: '10%',
              left: '12%',
              width: '32%',
              height: '70%',
              zIndex: 3
            }}
          >
            <CharacterSvg
              character={match.charA}
              facing="right"
              pose={gameState.myPoseA}
            />
          </div>

          {/* Fighter B (Right) */}
          <div
            style={{
              position: 'absolute',
              bottom: '10%',
              right: '12%',
              width: '32%',
              height: '70%',
              zIndex: 3
            }}
          >
            <CharacterSvg
              character={match.charB}
              facing="left"
              pose={gameState.myPoseB}
            />
          </div>

          {/* Floating Action Text Pops (6-7, Dab, Griddy, Quoicoubeh) */}
          <div className="sa-pops">
            {gameState.floatingPops.map(p => (
              <div
                key={p.id}
                className={`sa-pop sa-${p.colorType} sa-${p.size}`}
                style={{ left: `${p.x}%`, top: `${p.y}%` }}
              >
                {p.text}
              </div>
            ))}
          </div>

          {/* K.O. / Victory Banner */}
          {match.status === 'finished' && (
            <div className="sa-banner">
              <b>K.O. !</b>
              <span>
                WINNER — TEAM {match.winner === 'A' ? fighterA.name.toUpperCase() : fighterB.name.toUpperCase()}
              </span>
            </div>
          )}

          {/* HUD (Health Bars, Names, Timer) */}
          <div className="sa-hud">
            {/* Team A Bar */}
            <div className="sa-side">
              <div className="sa-name" style={{ color: 'var(--team-a)' }}>
                {fighterA.name.toUpperCase()} (TEAM A)
              </div>
              <div className={`sa-bar ${match.auraA > 90 ? 'sa-full' : ''}`}>
                <i style={{ width: `${match.auraA}%` }} />
              </div>
              <div className="sa-tagline">
                <span>AURA: {match.auraA}%</span>
                <span style={{ color: 'var(--bone-dim)' }}>DMG DEALT: {match.damageB}</span>
              </div>
            </div>

            {/* Central Clock */}
            <div style={{ textAlign: 'center' }}>
              <div className="sa-timer">
                {match.status === 'finished' ? '00' : match.timeLeftSeconds}s
              </div>
              <div className="sa-round">
                MATCH #{match.id} · {match.txCount} TXS ON ROLLUP
              </div>
            </div>

            {/* Team B Bar */}
            <div className="sa-side sa-p2">
              <div className="sa-name" style={{ color: 'var(--team-b)' }}>
                {fighterB.name.toUpperCase()} (TEAM B)
              </div>
              <div className={`sa-bar ${match.auraB > 90 ? 'sa-full' : ''}`}>
                <i style={{ width: `${match.auraB}%` }} />
              </div>
              <div className="sa-tagline">
                <span>AURA: {match.auraB}%</span>
                <span style={{ color: 'var(--bone-dim)' }}>DMG DEALT: {match.damageA}</span>
              </div>
            </div>
          </div>

          {/* Bottom Feed / Chain Info */}
          <div className="sa-chain">
            <span>
              <b>MAGICBLOCK ER:</b> Sub-20ms Latency · 0 Gas Ticks · Rollup State Delegated
            </span>
            <span>
              VAULT POT: <b>{match.potSol.toFixed(2)} SOL</b>
            </span>
          </div>
        </div>
      </div>

      {/* Arena Stage Control & Match Facts Grid */}
      <div className="endgrid" style={{ marginTop: '12px' }}>
        {/* Live Rosters */}
        <div className="card">
          <h2>Teams & Active Players</h2>
          <div className="teamroster" style={{ gap: '10px' }}>
            <div className="rteam tA">
              <h2>
                TEAM {fighterA.name.split(' ')[0]} <span>{match.players.filter(p => p.team === 'A').length}</span>
              </h2>
              <ul>
                {match.players.filter(p => p.team === 'A').map((p, idx) => (
                  <li key={idx} className={p.isMe ? 'me' : ''}>
                    {p.isMe ? '⭐ YOU' : p.address}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rteam tB">
              <h2>
                TEAM {fighterB.name.split(' ')[0]} <span>{match.players.filter(p => p.team === 'B').length}</span>
              </h2>
              <ul>
                {match.players.filter(p => p.team === 'B').map((p, idx) => (
                  <li key={idx} className={p.isMe ? 'me' : ''}>
                    {p.isMe ? '⭐ YOU' : p.address}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* QR Code Spectator / Phone Join Hub */}
        <div className="card" style={{ textAlign: 'center', placeItems: 'center' }}>
          <h2>📱 Join from Phone (Session Key)</h2>
          <p>Scan with your mobile camera to join the brawl instantly with zero gas!</p>
          <div style={{ background: '#fff', padding: '12px', borderRadius: '10px', display: 'inline-block', boxShadow: '0 4px #000' }}>
            <QRCodeSVG value={phoneJoinUrl} size={135} />
          </div>
          <div style={{ marginTop: '10px' }}>
            <button type="button" className="cta" onClick={onJoinAsPlayer}>
              ENTER COMBAT CONTROLLER
            </button>
          </div>
        </div>
      </div>

      {/* Match Restart for Next Round */}
      {match.status === 'finished' && (
        <div className="center" style={{ marginTop: '14px' }}>
          <button
            type="button"
            className="cta"
            onClick={() => gameState.restartMatch()}
          >
            START NEXT BRAWL (RE-SEED FIGHTERS)
          </button>
        </div>
      )}
    </div>
  );
};
