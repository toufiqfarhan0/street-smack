import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { gameState } from '../engine/gameState';
import { FIGHTERS, CharacterSvg } from '../engine/fighters';
import { soundEngine } from '../engine/audio';

export const Profile: React.FC = () => {
  const [claimed, setClaimed] = useState(false);
  const [claiming, setClaiming] = useState(false);

  const match = gameState.match;
  const isWinner = match.status === 'finished' && match.winner === gameState.myTeam;
  const winnerFighter = match.winner === 'A' ? match.charA : match.charB;

  const handleClaim = () => {
    setClaiming(true);
    setTimeout(() => {
      setClaiming(false);
      setClaimed(true);
      soundEngine.playCritical();
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });
    }, 1200);
  };

  const userCards = [
    {
      id: 1,
      fightId: 107,
      character: 'fraisita',
      rarity: 'Legendary',
      color: '#ffc23a',
      dmgShare: '34%',
      amountWon: '0.45 SOL'
    },
    {
      id: 2,
      fightId: 106,
      character: 'tung',
      rarity: 'Epic',
      color: '#9c8bff',
      dmgShare: '22%',
      amountWon: '0.28 SOL'
    },
    {
      id: 3,
      fightId: 104,
      character: 'rerA',
      rarity: 'Rare',
      color: '#4fa3e0',
      dmgShare: '12%',
      amountWon: '0.14 SOL'
    }
  ];

  return (
    <div className="screen">
      <div className="lobbyhead">
        <h1>YOUR <em>STREET SMACK DECK</em></h1>
        <p>Victory NFT Cards minted from your battle participation and Solana L1 Vault payouts.</p>
      </div>

      {/* Claim Banner for Recent Match */}
      {match.status === 'finished' && (
        <div className="card" style={{ border: '2px solid var(--gold)', background: 'linear-gradient(135deg, #2a1545, #140a1f)' }}>
          <h2>🏆 MATCH #{match.id} REWARD SETTLEMENT</h2>
          {isWinner ? (
            <div>
              <p>
                Congratulations! Your team won the battle. You dealt <b>{match.players.find(p => p.isMe)?.damage || 240}</b> damage
                to the enemy aura bar.
              </p>
              <div style={{ margin: '14px 0' }}>
                {claimed ? (
                  <span className="chip" style={{ fontSize: '14px', padding: '6px 14px', color: '#35e07a', borderColor: '#35e07a' }}>
                    ✓ 0.38 SOL CLAIMED FROM L1 VAULT + EPIC CARD MINTED!
                  </span>
                ) : (
                  <button
                    type="button"
                    className="cta"
                    onClick={handleClaim}
                    disabled={claiming}
                  >
                    {claiming ? 'CLAIMING ON SOLANA L1...' : 'CLAIM 0.38 SOL + DRAW VICTORY CARD'}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <p>
              Your team fought bravely! The losers' stake pot was distributed to the winning warriors.
              Better luck in the next round!
            </p>
          )}
        </div>
      )}

      {/* NFT Card Grid */}
      <div className="card">
        <h2>Your Trophy Cards ({userCards.length})</h2>
        <div className="nftgrid">
          {userCards.map(c => {
            const fighter = FIGHTERS[c.character] || FIGHTERS['tung'];
            return (
              <div
                key={c.id}
                className="nftcard"
                style={{
                  '--c': c.color,
                  boxShadow: `0 0 16px ${c.color}44`,
                  border: `2px solid ${c.color}`
                } as React.CSSProperties}
              >
                <div style={{ width: '130px', height: '170px' }}>
                  <CharacterSvg character={c.character} facing="right" pose="victory" />
                </div>
                <b className="rar" style={{ color: c.color }}>{c.rarity.toUpperCase()}</b>
                <span className="sub">{fighter.name}</span>
                <span style={{ fontSize: '11px', color: 'var(--gold)', fontWeight: 700 }}>
                  +{c.amountWon}
                </span>
                <span style={{ fontSize: '10px', color: 'var(--bone-dim)' }}>
                  Aura Dmg: {c.dmgShare}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
