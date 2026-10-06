import React, { useState } from 'react';
import { gameState } from '../engine/gameState';
import { FIGHTERS } from '../engine/fighters';

interface LobbyProps {
  onSelectFight: (fightId: number) => void;
}

export const Lobby: React.FC<LobbyProps> = ({ onSelectFight }) => {
  const [filter, setFilter] = useState<'all' | 'live' | 'finished'>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [newCharA, setNewCharA] = useState('tung');
  const [newCharB, setNewCharB] = useState('tralalero');
  const [newStake, setNewStake] = useState('0.05');

  const matches = [
    {
      id: gameState.match.id,
      status: gameState.match.status,
      charA: gameState.match.charA,
      charB: gameState.match.charB,
      stakeSol: gameState.match.stakeSol,
      potSol: gameState.match.potSol,
      players: gameState.match.players.length,
      txCount: gameState.match.txCount,
      winner: gameState.match.winner,
    },
    {
      id: 107,
      status: 'finished',
      charA: 'fraisita',
      charB: 'chocolato',
      stakeSol: 0.1,
      potSol: 1.2,
      players: 12,
      txCount: 148,
      winner: 'A',
    },
    {
      id: 106,
      status: 'finished',
      charA: 'rerA',
      charB: 'tung',
      stakeSol: 0.05,
      potSol: 0.65,
      players: 13,
      txCount: 92,
      winner: 'B',
    },
    {
      id: 109,
      status: 'upcoming',
      charA: 'chocolato',
      charB: 'rerA',
      stakeSol: 0.05,
      potSol: 0.2,
      players: 4,
      txCount: 0,
      winner: null,
    }
  ];

  const filteredMatches = matches.filter(m => {
    if (filter === 'live') return m.status === 'live';
    if (filter === 'finished') return m.status === 'finished';
    return true;
  });

  const handleCreateFight = () => {
    const stake = parseFloat(newStake) || 0.05;
    gameState.restartMatch(newCharA, newCharB, stake);
    setShowCreate(false);
    onSelectFight(gameState.match.id);
  };

  return (
    <div className="screen">
      <div className="lobbyhead" style={{ alignItems: 'center' }}>
        <img
          src="/img/street-smack-logo.png"
          alt="Street Smack"
          style={{
            maxHeight: '110px',
            width: 'auto',
            objectFit: 'contain',
            filter: 'drop-shadow(0 6px 22px rgba(255, 90, 60, 0.45))',
            margin: '0 auto 8px auto'
          }}
        />
        <h1 style={{ fontSize: 'clamp(20px, 3.2vw, 32px)' }}>
          MEME BRAWL <em>MATCH LOBBY</em>
        </h1>
        <p>Pick an active arena to fight, or create a custom battle room.</p>
      </div>

      <div className="toolbar">
        <div className="tabs">
          <button
            type="button"
            className="ghost"
            aria-pressed={filter === 'all'}
            onClick={() => setFilter('all')}
          >
            ALL FIGHTS
          </button>
          <button
            type="button"
            className="ghost"
            aria-pressed={filter === 'live'}
            onClick={() => setFilter('live')}
          >
            🔥 LIVE NOW
          </button>
          <button
            type="button"
            className="ghost"
            aria-pressed={filter === 'finished'}
            onClick={() => setFilter('finished')}
          >
            🏆 FINISHED
          </button>
        </div>

        <button
          type="button"
          className="cta small"
          onClick={() => setShowCreate(!showCreate)}
        >
          {showCreate ? 'CLOSE' : '+ CREATE NEW BRAWL'}
        </button>
      </div>

      {showCreate && (
        <div className="card" style={{ border: '2px solid var(--gold)', animation: 'rpop 0.3s ease' }}>
          <h2>🥊 Create New Street Smack Fight</h2>
          <div className="adminrow">
            <label>
              TEAM A MASCOT
              <select value={newCharA} onChange={e => setNewCharA(e.target.value)}>
                {Object.values(FIGHTERS).map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </label>

            <label>
              TEAM B MASCOT
              <select value={newCharB} onChange={e => setNewCharB(e.target.value)}>
                {Object.values(FIGHTERS).map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </label>

            <label>
              ENTRY STAKE (SOL)
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={newStake}
                onChange={e => setNewStake(e.target.value)}
              />
            </label>

            <button type="button" className="cta small" onClick={handleCreateFight}>
              INITIALIZE ON-CHAIN (L1 VAULT + ER)
            </button>
          </div>
        </div>
      )}

      <div className="matchlist">
        {filteredMatches.map(m => {
          const fA = FIGHTERS[m.charA] || FIGHTERS['tung'];
          const fB = FIGHTERS[m.charB] || FIGHTERS['tralalero'];

          return (
            <article key={m.id} className={`match ${m.status}`}>
              <div className="mhead">
                <span className={`tag ${m.status}`}>{m.status.toUpperCase()}</span>
                <span className="mid">#{m.id}</span>
              </div>

              <div className="mfight">
                <b className={m.winner === 'A' ? 'win' : m.winner ? 'lose' : ''}>
                  {fA.name.toUpperCase()}
                </b>
                <i>vs</i>
                <b className={m.winner === 'B' ? 'win' : m.winner ? 'lose' : ''}>
                  {fB.name.toUpperCase()}
                </b>
              </div>

              <dl className="mfacts">
                <div>
                  <dt>STAKE</dt>
                  <dd>{m.stakeSol} SOL</dd>
                </div>
                <div>
                  <dt>PLAYERS</dt>
                  <dd>{m.players}</dd>
                </div>
                <div>
                  <dt>VAULT POT</dt>
                  <dd>{m.potSol} SOL</dd>
                </div>
                <div>
                  <dt>ER EMOTES</dt>
                  <dd>{m.txCount}</dd>
                </div>
              </dl>

              <div className="mfoot">
                {m.status === 'live' ? (
                  <button
                    type="button"
                    className="cta small"
                    onClick={() => onSelectFight(m.id)}
                  >
                    JOIN FIGHT (0 GAS)
                  </button>
                ) : m.status === 'finished' ? (
                  <span className="mwin">
                    Winner: Team {m.winner === 'A' ? fA.name : fB.name}
                  </span>
                ) : (
                  <button
                    type="button"
                    className="cta small"
                    onClick={() => onSelectFight(m.id)}
                  >
                    ENTER ROOM
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};
