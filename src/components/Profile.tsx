import React from 'react';
import { gameState } from '../engine/gameState';
import { FIGHTERS, CharacterSvg } from '../engine/fighters';
import { RARITIES } from './Booster';

export const Profile: React.FC = () => {
  const match = gameState.match;
  const me = match.players.find(p => p.isMe);

  const stats = {
    address: '7xKXtg9Ab2...4mVP',
    winrate: 0.68,
    matches: 19,
    wins: 13,
    losses: 6,
    damage: 3480 + (me?.damage || 0),
    stakedSol: 0.95,
    wonSol: 1.62,
    emotes: {
      six7: 28 + (me?.emotes['six7'] || 0),
      dab: 14 + (me?.emotes['dab'] || 0),
      griddy: 8 + (me?.emotes['griddy'] || 0),
      quoicoubeh: 4 + (me?.emotes['quoicoubeh'] || 0)
    },
    nftsByRarity: [4, 3, 2, 1] // Common, Rare, Epic, Legendary
  };

  const nfts = [
    {
      tokenId: 8841,
      matchId: 107,
      character: 'fraisita',
      rarity: 3, // Legendary
      mintedAt: 'Today'
    },
    {
      tokenId: 7219,
      matchId: 106,
      character: 'tung',
      rarity: 2, // Epic
      mintedAt: 'Yesterday'
    },
    {
      tokenId: 5540,
      matchId: 104,
      character: 'rerA',
      rarity: 1, // Rare
      mintedAt: 'Yesterday'
    },
    {
      tokenId: 3108,
      matchId: 101,
      character: 'tralalero',
      rarity: 0, // Common
      mintedAt: '2 days ago'
    }
  ];

  const netSol = stats.wonSol - stats.stakedSol;

  return (
    <section className="screen">
      {/* Header Info */}
      <div className="lobby">
        <div>
          <small>My Profile</small>
          <h2>{stats.address}</h2>
        </div>
        <div>
          <small>Winrate</small>
          <span className="big">{Math.round(stats.winrate * 100)} %</span>
        </div>
        <div>
          <small>NFT Collection</small>
          <span className="big">{nfts.length}</span>
        </div>
      </div>

      {/* Facts Grid */}
      <dl className="facts">
        <div>
          <dt>Matches Played</dt>
          <dd>{stats.matches}</dd>
        </div>
        <div>
          <dt>Victories</dt>
          <dd>{stats.wins}</dd>
        </div>
        <div>
          <dt>Defeats</dt>
          <dd>{stats.losses}</dd>
        </div>
        <div>
          <dt>Total Damage</dt>
          <dd>{stats.damage.toLocaleString('en-US')}</dd>
        </div>
      </dl>

      {/* Cards Grid */}
      <div className="endgrid">
        {/* SOL Financial Record */}
        <div className="card">
          <h2>SOL Ledger</h2>
          <dl className="money">
            <div>
              <dt>Staked</dt>
              <dd>−{stats.stakedSol.toFixed(2)} SOL</dd>
            </div>
            <div>
              <dt>Claimed</dt>
              <dd>+{stats.wonSol.toFixed(2)} SOL</dd>
            </div>
            <div className="total">
              <dt>Net PnL</dt>
              <dd style={{ color: netSol >= 0 ? 'var(--gold)' : 'var(--ember)' }}>
                {netSol >= 0 ? '+' : '−'}{Math.abs(netSol).toFixed(2)} SOL
              </dd>
            </div>
          </dl>
          <p style={{ marginTop: '4px' }}>
            All payouts settle directly from the non-delegated Solana L1 Vault PDA.
          </p>
        </div>

        {/* Emotes Fired Table */}
        <div className="card">
          <h2>Emotes Fired</h2>
          <table>
            <thead>
              <tr>
                <th>Emote</th>
                <th>Sent (Txs)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>6·7 (Rapid Jab)</td>
                <td>{stats.emotes.six7}</td>
              </tr>
              <tr>
                <td>Dab (Stun combo)</td>
                <td>{stats.emotes.dab}</td>
              </tr>
              <tr>
                <td>Griddy (Shockwave)</td>
                <td>{stats.emotes.griddy}</td>
              </tr>
              <tr>
                <td>Quoicoubeh (Finisher blast)</td>
                <td>{stats.emotes.quoicoubeh}</td>
              </tr>
            </tbody>
          </table>
          <p>Each emote is a zero-gas MagicBlock Ephemeral Rollup transaction executed under 20ms.</p>
        </div>

        {/* NFT Rarity Odds */}
        <div className="card">
          <h2>NFTs by Rarity</h2>
          <div className="odds">
            {RARITIES.map((r, idx) => (
              <span key={r.name} className="odd" style={{ '--c': r.color } as React.CSSProperties}>
                <i />
                {r.name} · {stats.nftsByRarity[idx]}
              </span>
            ))}
          </div>
          <p>Rarity tier is scaled by your damage contribution share on the winning squad.</p>
        </div>
      </div>

      {/* NFT Collection Section */}
      <div className="lobby" style={{ marginTop: '24px' }}>
        <div>
          <small>My Collection</small>
          <h2>NFTs Unboxed from Boosters</h2>
        </div>
      </div>

      <div className="nftgrid">
        {nfts.map(nft => {
          const r = RARITIES[nft.rarity];
          const f = FIGHTERS[nft.character] || FIGHTERS['tung'];

          return (
            <article
              key={nft.tokenId}
              className="nftcard"
              style={{ '--c': r.color } as React.CSSProperties}
            >
              <div
                style={{
                  width: '100%',
                  aspectRatio: '1',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  background: '#0b0612',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <CharacterSvg character={nft.character} facing="right" pose="victory" />
              </div>

              <div className="rar" style={{ color: r.color }}>
                {r.name.toUpperCase()}
              </div>

              <div className="sub">
                {f.name} · #{nft.tokenId}
              </div>

              <div className="sub">
                Match #{nft.matchId} · {nft.mintedAt}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};
