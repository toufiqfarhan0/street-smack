import React, { useState } from 'react';
import { gameState } from '../engine/gameState';
import { FIGHTERS } from '../engine/fighters';

interface MatchItem {
  id: number;
  status: 'live' | 'upcoming' | 'finished';
  charA: string;
  charB: string;
  stakeSol: number;
  potSol: number;
  playersCount: number;
  txCount: number;
  winner?: 'A' | 'B' | null;
  timeLabel: string;
}

export const Dashboard: React.FC = () => {
  const [tab, setTab] = useState<'all' | 'live' | 'upcoming' | 'finished'>('all');

  const matches: MatchItem[] = [
    {
      id: gameState.match.id,
      status: gameState.match.status,
      charA: gameState.match.charA,
      charB: gameState.match.charB,
      stakeSol: gameState.match.stakeSol,
      potSol: gameState.match.potSol,
      playersCount: gameState.match.players.length,
      txCount: gameState.match.txCount,
      winner: gameState.match.winner,
      timeLabel: gameState.match.status === 'live' ? 'Live Now' : 'Just now'
    },
    {
      id: 107,
      status: 'finished',
      charA: 'fraisita',
      charB: 'chocolato',
      stakeSol: 0.1,
      potSol: 1.2,
      playersCount: 12,
      txCount: 154,
      winner: 'A',
      timeLabel: 'Finished (Team Fraisita Won)'
    },
    {
      id: 106,
      status: 'finished',
      charA: 'rerA',
      charB: 'tung',
      stakeSol: 0.05,
      potSol: 0.65,
      playersCount: 13,
      txCount: 98,
      winner: 'B',
      timeLabel: 'Finished (Team Tung Won)'
    },
    {
      id: 109,
      status: 'upcoming',
      charA: 'chocolato',
      charB: 'rerA',
      stakeSol: 0.05,
      potSol: 0.25,
      playersCount: 5,
      txCount: 0,
      timeLabel: 'Starts in 2m'
    },
    {
      id: 110,
      status: 'upcoming',
      charA: 'tung',
      charB: 'fraisita',
      stakeSol: 0.1,
      potSol: 0.4,
      playersCount: 4,
      txCount: 0,
      timeLabel: 'Starts in 5m'
    }
  ];

  const filteredMatches = matches.filter(m => {
    if (tab === 'live') return m.status === 'live';
    if (tab === 'upcoming') return m.status === 'upcoming';
    if (tab === 'finished') return m.status === 'finished';
    return true;
  });

  const handleSelectMatch = (m: MatchItem) => {
    if (m.id !== gameState.match.id) {
      gameState.restartMatch(m.charA, m.charB, m.stakeSol);
    }
    window.location.hash = '#/play';
  };

  return (
    <section className="screen">
      <div className="hero">
        <p className="eyebrow">Dashboard</p>
        <h1>Arena Battles</h1>
        <p className="lede">
          All Street Smack brawls on Solana. Live rooms are delegated to MagicBlock Ephemeral Rollups
          for ultra-fast sub-20ms combat with zero gas fees per attack.
        </p>
      </div>

      <div className="toolbar">
        <div className="tabs">
          <button
            type="button"
            className={`ghost ${tab === 'all' ? 'active' : ''}`}
            aria-pressed={tab === 'all'}
            onClick={() => setTab('all')}
          >
            All ({matches.length})
          </button>
          <button
            type="button"
            className={`ghost ${tab === 'live' ? 'active' : ''}`}
            aria-pressed={tab === 'live'}
            onClick={() => setTab('live')}
          >
            Live ({matches.filter(m => m.status === 'live').length})
          </button>
          <button
            type="button"
            className={`ghost ${tab === 'upcoming' ? 'active' : ''}`}
            aria-pressed={tab === 'upcoming'}
            onClick={() => setTab('upcoming')}
          >
            Upcoming ({matches.filter(m => m.status === 'upcoming').length})
          </button>
          <button
            type="button"
            className={`ghost ${tab === 'finished' ? 'active' : ''}`}
            aria-pressed={tab === 'finished'}
            onClick={() => setTab('finished')}
          >
            Finished ({matches.filter(m => m.status === 'finished').length})
          </button>
        </div>

        <p>Solana Devnet · Rollup Validator: <code>MTEWGuqx...3xzo</code></p>
      </div>

      <div className="matchlist">
        {filteredMatches.map(m => {
          const fA = FIGHTERS[m.charA] || FIGHTERS['tung'];
          const fB = FIGHTERS[m.charB] || FIGHTERS['tralalero'];

          return (
            <article key={m.id} className={`match ${m.status}`}>
              <div className="mhead">
                <span className={`tag ${m.status}`}>
                  {m.status === 'live' ? 'LIVE' : m.status === 'upcoming' ? 'UPCOMING' : 'FINISHED'}
                </span>
                <span className="mid">#{m.id}</span>
                <span className="mwhen">{m.timeLabel}</span>
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
                  <dt>Stake</dt>
                  <dd>{m.stakeSol.toFixed(2)} SOL</dd>
                </div>
                <div>
                  <dt>Pot</dt>
                  <dd>{m.potSol.toFixed(2)} SOL</dd>
                </div>
                <div>
                  <dt>Players</dt>
                  <dd>{m.playersCount}</dd>
                </div>
                <div>
                  <dt>ER Txs</dt>
                  <dd>{m.txCount}</dd>
                </div>
              </dl>

              <div className="mfoot">
                <span className="mwin">
                  {m.status === 'live'
                    ? 'Battle in progress on Rollup'
                    : m.winner
                    ? `Victory: Team ${m.winner === 'A' ? fA.name : fB.name}`
                    : 'Waiting for fighters to seat'}
                </span>

                <button
                  type="button"
                  className="cta small"
                  onClick={() => handleSelectMatch(m)}
                >
                  {m.status === 'live' ? 'JOIN BRAWL →' : 'VIEW BRAWL →'}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};
