import React, { useState, useEffect, useCallback, useRef } from 'react';
import { gameState } from '../engine/gameState';
import { FIGHTERS, CharacterSvg } from '../engine/fighters';
import { EMOTES } from '../engine/emotes';
import { soundEngine } from '../engine/audio';
import { MinesGame } from '../engine/minigames/Mines';
import { ClickerGame } from '../engine/minigames/Clicker';
import { TargetGame } from '../engine/minigames/Target';
import { GaugeGame } from '../engine/minigames/Gauge';
import { RedBlackGame } from '../engine/minigames/RedBlack';
import { Booster } from './Booster';

interface PlayProps {
  mode?: 'normal' | 'player' | 'screen';
}

export const Play: React.FC<PlayProps> = ({ mode = 'normal' }) => {
  const [, setTick] = useState(0);

  // Local phase tracking: 'entry' | 'mines' | 'fight' | 'end'
  const [localPhase, setLocalPhase] = useState<'entry' | 'mines' | 'fight' | 'end'>('fight');
  const [pseudo, setPseudo] = useState('AnonSol');
  const [botsEnabled, setBotsEnabled] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [lobbyTimeLeft, setLobbyTimeLeft] = useState(8);
  const [startingPoints, setStartingPoints] = useState(100);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [floatingDamage, setFloatingDamage] = useState<{ id: number; text: string; plus: boolean }[]>([]);

  const dmgCounter = useRef(0);

  // Subscribe to central gameState
  useEffect(() => {
    return gameState.subscribe(() => setTick(t => t + 1));
  }, []);

  const match = gameState.match;
  const isSpectator = mode === 'screen';
  const isPlayerOnly = mode === 'player';

  const fighterA = FIGHTERS[match.charA] || FIGHTERS['tung'];
  const fighterB = FIGHTERS[match.charB] || FIGHTERS['tralalero'];

  const myTeam = gameState.myTeam;
  const foeTeam = myTeam === 'A' ? 'B' : 'A';
  const myCharKey = myTeam === 'A' ? match.charA : match.charB;
  const foeCharKey = myTeam === 'A' ? match.charB : match.charA;
  const myFighter = FIGHTERS[myCharKey] || FIGHTERS['tung'];
  const foeFighter = FIGHTERS[foeCharKey] || FIGHTERS['tralalero'];

  // Check if match finished
  useEffect(() => {
    if (match.status === 'finished' && localPhase === 'fight') {
      const timer = setTimeout(() => {
        setLocalPhase('end');
      }, 1400);
      return () => clearTimeout(timer);
    }
  }, [match.status, localPhase]);

  // Lobby countdown timer
  useEffect(() => {
    if (localPhase === 'mines') {
      const interval = setInterval(() => {
        setLobbyTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            setLocalPhase('fight');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [localPhase]);

  // Keyboard hotkeys for Emotes: 1, 2, 3, 4
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isSpectator || localPhase !== 'fight') return;
      if (['1', '2', '3', '4'].includes(e.key)) {
        const index = parseInt(e.key, 10) - 1;
        const emote = EMOTES[index];
        if (emote) {
          handleCastEmote(emote.id);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSpectator, localPhase]);

  const handleJoin = () => {
    gameState.myTeam = Math.random() > 0.5 ? 'A' : 'B';
    setLocalPhase('mines');
    setLobbyTimeLeft(8);
  };

  const handleMinesScore = (pts: number, finished: boolean) => {
    setStartingPoints(prev => Math.max(prev, pts));
    gameState.earnPoints(pts);
    if (finished) {
      setIsReady(true);
    }
  };

  const handleReadyClick = () => {
    setIsReady(true);
    setLobbyTimeLeft(Math.min(lobbyTimeLeft, 3));
  };

  const handleCastEmote = useCallback((emoteId: string) => {
    if (Date.now() < cooldownUntil) return;
    const success = gameState.triggerEmote(emoteId);
    if (success) {
      setCooldownUntil(Date.now() + 600); // 600ms cooldown
      const id = ++dmgCounter.current;
      const emote = EMOTES.find(e => e.id === emoteId);
      const text = `-${emote?.raw || 10} AURA`;
      setFloatingDamage(prev => [...prev.slice(-3), { id, text, plus: false }]);
      setTimeout(() => {
        setFloatingDamage(prev => prev.filter(p => p.id !== id));
      }, 650);
    }
  }, [cooldownUntil]);

  const handleNextMatch = () => {
    gameState.restartMatch();
    setLocalPhase('mines');
    setLobbyTimeLeft(8);
    setIsReady(false);
  };

  // Mini-game selector
  const miniGames = [
    { id: 'clicker', name: 'Speed Clicker', hint: 'Tap rapidly to build up your combo multiplier!', Component: ClickerGame },
    { id: 'target', name: 'Precision Target', hint: 'Hit the moving target for +30 pts!', Component: TargetGame },
    { id: 'gauge', name: 'Timing Gauge', hint: 'Stop the marker inside the gold sweet spot for jackpot!', Component: GaugeGame },
    { id: 'redblack', name: 'Red or Black', hint: 'Gamble on card color: +25 / -20 pts', Component: RedBlackGame },
  ];
  const currentMiniGame = miniGames[gameState.activeMiniGameIndex] || miniGames[0];
  const MiniGameComp = currentMiniGame.Component;

  // Aura health clash offset
  const clashOffset = (match.auraA - match.auraB) / 2;

  // ========================================================
  // 1. ENTRY PHASE (Open lobby, player not registered)
  // ========================================================
  if (localPhase === 'entry') {
    return (
      <section className="screen">
        <div className="versus">
          <div className="corner a">
            <CharacterSvg character={match.charA} facing="right" pose="idle" />
            <div className="who">{fighterA.name.toUpperCase()}</div>
          </div>
          <div className="vs" aria-hidden="true">VS</div>
          <div className="corner b">
            <CharacterSvg character={match.charB} facing="left" pose="idle" />
            <div className="who">{fighterB.name.toUpperCase()}</div>
          </div>
        </div>

        <dl className="facts">
          <div>
            <dt>Entry Stake</dt>
            <dd>{match.stakeSol.toFixed(2)} SOL</dd>
          </div>
          <div>
            <dt>Registered Players</dt>
            <dd>{match.players.length}</dd>
          </div>
          <div>
            <dt>Total Pot</dt>
            <dd>{match.potSol.toFixed(2)} SOL</dd>
          </div>
          <div>
            <dt>Payout Split</dt>
            <dd>50% Winner Squad · 50% NFT Pool</dd>
          </div>
        </dl>

        <div className="join">
          <label className="pseudo">
            Callsign
            <input
              type="text"
              value={pseudo}
              onChange={e => setPseudo(e.target.value)}
              placeholder="Your callsign"
              maxLength={16}
            />
          </label>

          <button
            type="button"
            className="cta"
            onClick={handleJoin}
          >
            JOIN BATTLE ({match.stakeSol.toFixed(2)} SOL) →
          </button>
        </div>

        <label className="bots-switch">
          <input
            type="checkbox"
            checked={botsEnabled}
            onChange={e => setBotsEnabled(e.target.checked)}
          />
          Fill room with bots (recommended for testing)
          <small>Virtual fighters will stake SOL and fire emotes in real-time.</small>
        </label>
      </section>
    );
  }

  // ========================================================
  // 2. MINES PRE-FIGHT LOBBY
  // ========================================================
  if (localPhase === 'mines') {
    return (
      <section className="screen" data-team={myTeam}>
        <div className="lobby">
          <div>
            <small>While waiting for battle</small>
            <h2>Find the diamonds, avoid the bomb</h2>
          </div>
          <div>
            <small>Starting Points</small>
            <span className="big">{startingPoints}</span>
          </div>
          <div>
            <small>Match starts in</small>
            <span className="big">{lobbyTimeLeft} s</span>
          </div>
        </div>

        <div className={`readybar ${isReady ? 'done' : ''}`} style={{ margin: '10px 0', display: 'flex', alignItems: 'center', gap: '14px' }}>
          {isReady ? (
            <b style={{ color: 'var(--gold)', fontSize: '15px' }}>✓ Ready — waiting for match launch</b>
          ) : (
            <button
              type="button"
              className="cta"
              onClick={handleReadyClick}
              style={{ padding: '10px 18px', fontSize: '15px' }}
            >
              I'm Ready!
            </button>
          )}
          <span style={{ color: 'var(--bone-dim)', fontSize: '13px' }}>
            {match.players.filter(p => p.isMe || isReady).length}/{match.players.length} ready · match starts automatically
          </span>
        </div>

        {/* Mines Grid */}
        <MinesGame onScore={handleMinesScore} />

        {/* Reveal of Assigned Team */}
        <div className="reveal" role="status" aria-live="polite" style={{ marginTop: '16px' }}>
          <span className="rvpic">
            <CharacterSvg character={myCharKey} facing={myTeam === 'A' ? 'right' : 'left'} pose="idle" />
          </span>
          <div className="rvtext">
            <small>You are assigned to</small>
            <b>TEAM {myFighter.name.toUpperCase()}</b>
            <span>
              You enter the brawl with <b>{startingPoints} energy points</b>.
            </span>
          </div>
        </div>

        {/* Live Rosters */}
        <div className="teamroster" style={{ marginTop: '16px' }}>
          <div className="rteam tA">
            <h2>
              {fighterA.name.split(' ')[0]} <span>{match.players.filter(p => p.team === 'A').length}</span>
            </h2>
            <ul>
              {match.players.filter(p => p.team === 'A').map((p, idx) => (
                <li key={idx} className={p.isMe ? 'me' : ''}>
                  {p.isMe ? `⭐ ${pseudo}` : p.address} {isReady ? '✓' : ''}
                </li>
              ))}
            </ul>
          </div>
          <div className="rteam tB">
            <h2>
              {fighterB.name.split(' ')[0]} <span>{match.players.filter(p => p.team === 'B').length}</span>
            </h2>
            <ul>
              {match.players.filter(p => p.team === 'B').map((p, idx) => (
                <li key={idx} className={p.isMe ? 'me' : ''}>
                  {p.isMe ? `⭐ ${pseudo}` : p.address} {isReady ? '✓' : ''}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="center" style={{ marginTop: '14px' }}>
          <button
            type="button"
            className="ghost"
            onClick={() => setLocalPhase('fight')}
          >
            Start brawl now (Skip timer) →
          </button>
        </div>
      </section>
    );
  }

  // ========================================================
  // 3. END / BOOSTER REVEAL PHASE
  // ========================================================
  if (localPhase === 'end') {
    const isWinner = match.winner === myTeam;
    const winnerChar = match.winner === 'A' ? match.charA : match.charB;
    const winnerFighter = FIGHTERS[winnerChar] || FIGHTERS['tung'];

    return (
      <section className="screen" data-team={myTeam}>
        <div className={`result ${isWinner ? '' : 'lost'}`}>
          <span>Match #{match.id} finalized on MagicBlock Rollup</span>
          <b>{isWinner ? 'VICTORY !' : 'DEFEAT !'}</b>
          <span>
            {isWinner
              ? `Your squad drained enemy aura to zero! Claim your prize and unbox your NFT booster.`
              : `Enemy squad won the brawl. Open your consolation booster pack.`}
          </span>
        </div>

        <dl className="facts" style={{ marginTop: '14px' }}>
          <div>
            <dt>Payout Claimed</dt>
            <dd style={{ color: isWinner ? 'var(--gold)' : 'var(--bone-dim)' }}>
              {isWinner ? `+${(match.potSol * 0.48).toFixed(2)} SOL` : '0.00 SOL'}
            </dd>
          </div>
          <div>
            <dt>Damage Dealt</dt>
            <dd>{match.players.find(p => p.isMe)?.damage || 240} pts</dd>
          </div>
          <div>
            <dt>Rollup Transactions</dt>
            <dd>{match.txCount} txs</dd>
          </div>
          <div>
            <dt>Rollup Settlement</dt>
            <dd style={{ color: '#35e07a' }}>Committed to Base Layer ✓</dd>
          </div>
        </dl>

        {/* Interactive 3D Foil Booster Pack */}
        <div style={{ marginTop: '20px' }}>
          <div className="lobbyhead">
            <h1 style={{ fontSize: 'clamp(20px, 3vw, 28px)' }}>
              UNBOX YOUR <em>NFT BOOSTER</em>
            </h1>
            <p>Drag your finger or cursor to the right to tear the foil perforation!</p>
          </div>

          <Booster
            character={winnerChar}
            rarity={isWinner ? 3 : 1}
            matchId={match.id}
            onDone={handleNextMatch}
          />
        </div>
      </section>
    );
  }

  // ========================================================
  // 4. LIVE COMBAT BRAWL PHASE
  // ========================================================
  return (
    <section
      className={`screen ${isSpectator ? 'spectate' : ''} ${isPlayerOnly ? 'playview' : ''}`}
      data-team={!isSpectator ? myTeam : undefined}
    >
      {/* Team Top Header Band */}
      {!isSpectator && !isPlayerOnly && (
        <div className="teamband">
          <div className="tbme">
            <span className="tbpic">
              <CharacterSvg character={myCharKey} facing={myTeam === 'A' ? 'right' : 'left'} pose="idle" />
            </span>
            <span className="tbtext">
              <b>{pseudo} (You)</b>
              <small>Team {myFighter.name} · {match.stakeSol.toFixed(2)} SOL</small>
            </span>
          </div>

          <span className="tbvs">VS</span>

          <div className="tbfoe">
            <span className="tbtext">
              <b>Team {foeFighter.name}</b>
              <small>Deplete this enemy bar to win</small>
            </span>
            <span className="tbpic">
              <CharacterSvg character={foeCharKey} facing={foeTeam === 'A' ? 'right' : 'left'} pose="idle" />
            </span>
          </div>
        </div>
      )}

      {/* Main Arena Grid */}
      <div className="arena">
        {/* Stage Box (Canvas Arcade) */}
        {!isPlayerOnly && (
          <div className="stagebox">
            <div className={`sa-stage ${gameState.screenShake ? 'shake' : ''}`}>
              <div className="sa-shaker">
                {/* World Ambient Background */}
                <div
                  className="sa-world"
                  style={{
                    background: 'radial-gradient(ellipse at 50% 30%, #2a1545 0%, #0d0617 80%)'
                  }}
                />

                {/* Center Aura Clash Beam */}
                <div
                  style={{
                    position: 'absolute',
                    top: '25%',
                    bottom: '12%',
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

                {/* Fighter A */}
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

                {/* Fighter B */}
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

                {/* Floating Action Text Pops */}
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

                {/* HUD: Names, Health Bars, Central Timer */}
                <div className="sa-hud">
                  {/* Left Side: Fighter A */}
                  <div className="sa-side">
                    <div className="sa-name" style={{ color: 'var(--team-a)' }}>
                      {fighterA.name.toUpperCase()} (TEAM A)
                    </div>
                    <div className={`sa-bar ${match.auraA > 90 ? 'sa-full' : ''}`}>
                      <i style={{ width: `${match.auraA}%` }} />
                    </div>
                    <div className="sa-tagline">
                      <span>AURA: {match.auraA}%</span>
                      <span style={{ color: 'var(--bone-dim)' }}>DMG: {match.damageB}</span>
                    </div>
                  </div>

                  {/* Center Timer */}
                  <div style={{ textAlign: 'center' }}>
                    <div className="sa-timer">
                      {match.status === 'finished' ? '00' : match.timeLeftSeconds}s
                    </div>
                    <div className="sa-round">
                      MATCH #{match.id} · {match.txCount} TXS ER
                    </div>
                  </div>

                  {/* Right Side: Fighter B */}
                  <div className="sa-side sa-p2">
                    <div className="sa-name" style={{ color: 'var(--team-b)' }}>
                      {fighterB.name.toUpperCase()} (TEAM B)
                    </div>
                    <div className={`sa-bar ${match.auraB > 90 ? 'sa-full' : ''}`}>
                      <i style={{ width: `${match.auraB}%` }} />
                    </div>
                    <div className="sa-tagline">
                      <span>AURA: {match.auraB}%</span>
                      <span style={{ color: 'var(--bone-dim)' }}>DMG: {match.damageA}</span>
                    </div>
                  </div>
                </div>

                {/* Chain / Rollup Ticker at Bottom */}
                <div className="sa-chain">
                  <span>
                    <b>MAGICBLOCK ER:</b> Sub-20ms Hot Loop · 0 Gas Fees
                  </span>
                  <span>
                    POT: <b>{match.potSol.toFixed(2)} SOL</b>
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Side Panel (Mini-Game & Score) */}
        {!isSpectator && (
          <div className="side">
            {/* Active Mini-game Card */}
            <div className="mg">
              <div className="mghead">
                <h2>{currentMiniGame.name} (10s)</h2>
                <span>SWITCH IN {(match.timeLeftSeconds % 10) || 10}s</span>
              </div>

              <div className="mgtime">
                <i
                  style={{
                    width: `${((match.timeLeftSeconds % 10) / 10) * 100}%`,
                    transition: 'width 1s linear'
                  }}
                />
              </div>

              <div className="mg-fill" style={{ position: 'relative' }}>
                <MiniGameComp onEarnPoints={pts => gameState.earnPoints(pts)} />
              </div>

              <p className="mghint">{currentMiniGame.hint}</p>
            </div>

            {/* Score Energy Box */}
            <div className="score">
              <small>⚡ ENERGY POINTS</small>
              <b>{gameState.points}</b>
              <span>EARNED IN MINI-GAMES: {gameState.earnedTotal} PTS</span>
            </div>

            {/* Pillar 1: Private Ephemeral Rollup (PER) Sealed Account */}
            <div className="card" style={{ padding: '10px 12px', background: '#1c1032', border: '1px solid var(--violet-soft)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <b style={{ color: 'var(--violet-soft)', fontSize: '11px', letterSpacing: '0.08em' }}>
                  🛡️ PRIVATE ER (PER) AMBUSH
                </b>
                <span className="chip small" style={{ fontSize: '9px', padding: '2px 6px' }}>
                  INTEL TDX TEE
                </span>
              </div>
              <p style={{ margin: '4px 0 8px', fontSize: '11px', color: 'var(--bone-dim)', lineHeight: 1.4 }}>
                0-member sealed account. Hidden from opponents and mempool RPCs.
              </p>
              <button
                type="button"
                className="ghost"
                style={{ width: '100%', fontSize: '11px', padding: '6px 8px', borderColor: 'var(--gold)', color: 'var(--gold)' }}
                onClick={() => {
                  if (gameState.points >= 150) {
                    gameState.earnPoints(-150);
                    gameState.spawnPop('TEE AMBUSH SCRAMBLED!', 50, 45, 'huge');
                    soundEngine.playCritical();
                  }
                }}
                disabled={gameState.points < 150}
              >
                {gameState.points >= 150 ? 'TRIGGER SEALED AMBUSH (150 PTS)' : 'NEED 150 PTS TO SEAL AMBUSH'}
              </button>
            </div>

            {/* Herd Architecture Live Telemetry */}
            <div className="card" style={{ padding: '8px 12px', fontSize: '11px', background: '#120a20', border: '1px solid var(--line)' }}>
              <div style={{ display: 'grid', gap: '3px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--bone-dim)' }}>🔑 Session Key :</span>
                  <b style={{ color: 'var(--gold)' }}>Active (0 gas, instant)</b>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--bone-dim)' }}>🎲 VRF Oracle :</span>
                  <b style={{ color: '#35e07a' }}>Queue Deal & Coin Flip</b>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--bone-dim)' }}>🏦 L1 Vault PDA :</span>
                  <b style={{ color: 'var(--cyan)' }}>Non-delegated ({match.potSol.toFixed(2)} SOL)</b>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Emotes Row at Bottom */}
        {!isSpectator && (
          <div className="emotes">
            <div className="emhead">
              <h2>FIRE YOUR EMOTES (0 GAS · MAGICBLOCK ER)</h2>
              <span>SPEND ENERGY POINTS TO DRAIN OPPONENT'S AURA</span>
            </div>

            <div className="emrow">
              {EMOTES.map(e => {
                const canAfford = gameState.points >= e.cost;
                const isCooling = Date.now() < cooldownUntil;

                return (
                  <button
                    key={e.id}
                    type="button"
                    className="emote"
                    onClick={() => handleCastEmote(e.id)}
                    disabled={!canAfford || match.status !== 'live' || isCooling}
                  >
                    <span className="k">KEY [{e.key}]</span>
                    <span className="t">{e.name}</span>
                    <span className="d">
                      COST: <b>{e.cost} PTS</b> · -{e.raw} AURA
                    </span>
                    <div className="lock">
                      <i style={{ width: canAfford ? '100%' : `${(gameState.points / e.cost) * 100}%` }} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Floating Damage Numbers */}
      {floatingDamage.map(d => (
        <span
          key={d.id}
          className="clickpop lvl-3"
          style={{
            left: '50%',
            top: '35%',
            color: 'var(--ember)',
            textShadow: '0 0 10px #ff5a3c'
          }}
        >
          {d.text}
        </span>
      ))}
    </section>
  );
};
