import React, { useState, useEffect } from 'react';
import { gameState } from '../engine/gameState';
import { EMOTES } from '../engine/emotes';
import { FIGHTERS, CharacterSvg } from '../engine/fighters';
import { ClickerGame } from '../engine/minigames/Clicker';
import { TargetGame } from '../engine/minigames/Target';
import { GaugeGame } from '../engine/minigames/Gauge';
import { RedBlackGame } from '../engine/minigames/RedBlack';
import { NoiseGame } from '../engine/minigames/Noise';

interface ControllerProps {
  onBackToArena: () => void;
}

export const Controller: React.FC<ControllerProps> = ({ onBackToArena }) => {
  const [, setTick] = useState(0);
  const [trapActive, setTrapActive] = useState(false);

  useEffect(() => {
    return gameState.subscribe(() => setTick(t => t + 1));
  }, []);

  // Keyboard hotkeys 1, 2, 3, 4
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['1', '2', '3', '4'].includes(e.key)) {
        const index = parseInt(e.key, 10) - 1;
        const emote = EMOTES[index];
        if (emote) {
          gameState.triggerEmote(emote.id);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const match = gameState.match;
  const myTeam = gameState.myTeam;
  const myCharKey = myTeam === 'A' ? match.charA : match.charB;
  const foeCharKey = myTeam === 'A' ? match.charB : match.charA;
  const myFighter = FIGHTERS[myCharKey] || FIGHTERS['tung'];
  const foeFighter = FIGHTERS[foeCharKey] || FIGHTERS['tralalero'];

  const myAura = myTeam === 'A' ? match.auraA : match.auraB;
  const foeAura = myTeam === 'A' ? match.auraB : match.auraA;

  // 10-second Mini-games registry
  const miniGames = [
    { id: 'clicker', name: 'Speed Clicker', hint: 'Tap as fast as possible to build combo multipliers!', Component: ClickerGame },
    { id: 'target', name: 'Precision Target', hint: 'Hit the target: +30 pts! Miss: -10 pts.', Component: TargetGame },
    { id: 'gauge', name: 'Timing Gauge', hint: 'Stop cursor in center: Gold +60 · Purple +30 · Red -30', Component: GaugeGame },
    { id: 'redblack', name: 'Red or Black', hint: 'Card flip gamble: Win +25 · Wrong -20', Component: RedBlackGame },
    { id: 'noise', name: 'Make Some Noise!', hint: 'Scream into your mic to charge the red meter for +35 pts!', Component: NoiseGame },
  ];

  const currentMiniGame = miniGames[gameState.activeMiniGameIndex];
  const MiniGameComp = currentMiniGame.Component;
  const miniGameProgressPercent = ((match.timeLeftSeconds % 10) / 10) * 100;

  const handleEarnPoints = (pts: number) => {
    gameState.earnPoints(pts);
  };

  const handleActivateTrap = () => {
    if (gameState.points >= 200 && !trapActive) {
      gameState.points -= 200;
      setTrapActive(true);
      gameState.spawnPop('TEE TRAP SET!', 50, 45, 'huge');
    }
  };

  return (
    <div className="screen" data-team={myTeam}>
      {/* Team Top Banner */}
      <div className="teamband">
        <div className="tbme">
          <div className="tbpic">
            <CharacterSvg character={myCharKey} facing="right" pose="idle" />
          </div>
          <div className="tbtext">
            <b>{myFighter.name.toUpperCase()} (TEAM {myTeam})</b>
            <small>YOUR AURA: {myAura}% · STAKE: {match.stakeSol} SOL</small>
          </div>
        </div>

        <div className="tbfoe">
          <div className="tbtext">
            <b>ENEMY: {foeFighter.name.toUpperCase()}</b>
            <small>ENEMY AURA: {foeAura}%</small>
          </div>
          <div className="tbpic">
            <CharacterSvg character={foeCharKey} facing="left" pose="idle" />
          </div>
        </div>
      </div>

      {/* Main Play Grid (Mini-Game + Energy Points + Emote Buttons) */}
      <div className="arena">
        {/* Active Mini-Game Card */}
        <div className="stagebox">
          <div className="mg">
            <div className="mghead">
              <h2>{currentMiniGame.name} (10s ROUND)</h2>
              <span>SWITCH IN {(match.timeLeftSeconds % 10) || 10}s</span>
            </div>

            <div className="mgtime">
              <i style={{ width: `${miniGameProgressPercent}%`, transition: 'width 1s linear' }} />
            </div>

            <div className="mg-fill" style={{ position: 'relative' }}>
              <MiniGameComp onEarnPoints={handleEarnPoints} />
            </div>

            <p className="mghint">{currentMiniGame.hint}</p>
          </div>
        </div>

        {/* Side Energy Meter */}
        <div className="side">
          <div className="score">
            <small>⚡ ENERGY POINTS</small>
            <b>{gameState.points}</b>
            <span>EARNED IN MINI-GAMES: {gameState.earnedTotal} PTS</span>
          </div>

          {/* Private ER Secret Trap Widget */}
          <div className="card" style={{ padding: '10px', background: '#1c0f2e', border: '1px solid var(--gold)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: 'var(--gold)', fontWeight: 700 }}>
                🛡️ PRIVATE ER AMBUSH (TEE)
              </span>
              <span style={{ fontSize: '11px', color: 'var(--bone-dim)' }}>
                {trapActive ? 'READY' : 'COST: 200 PTS'}
              </span>
            </div>
            <p style={{ fontSize: '11px', margin: '4px 0 8px' }}>
              Hardware-encrypted trap in Intel TDX. Counters next 500 enemy damage!
            </p>
            <button
              type="button"
              className="ghost"
              style={{ width: '100%', borderColor: trapActive ? '#35e07a' : 'var(--gold)', color: trapActive ? '#35e07a' : 'var(--gold)' }}
              onClick={handleActivateTrap}
              disabled={trapActive || gameState.points < 200}
            >
              {trapActive ? '✓ AMBUSH ENCRYPTED ON TEE' : 'ARM TEE AMBUSH'}
            </button>
          </div>
        </div>

        {/* Bottom Emote Attack Buttons */}
        <div className="emotes">
          <div className="emhead">
            <h2>SPEND POINTS ON EMOTE ATTACKS (0 GAS ON ER)</h2>
            <span>SUB-20MS MAGICBLOCK STATE DRAIN</span>
          </div>

          <div className="emrow">
            {EMOTES.map(e => {
              const canAfford = gameState.points >= e.cost;
              return (
                <button
                  key={e.id}
                  type="button"
                  className="emote"
                  onClick={() => gameState.triggerEmote(e.id)}
                  disabled={!canAfford || match.status !== 'live'}
                >
                  <span className="k">KEY [{e.key}]</span>
                  <span className="t">{e.name}</span>
                  <span className="d">
                    COST: <b>{e.cost} PTS</b> · -{e.raw} AURA
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="center" style={{ marginTop: '10px' }}>
        <button type="button" className="ghost" onClick={onBackToArena}>
          ← BACK TO ARENA BROADCAST
        </button>
      </div>
    </div>
  );
};
