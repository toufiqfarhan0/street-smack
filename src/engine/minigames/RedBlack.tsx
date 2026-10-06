import React, { useState } from 'react';
import { soundEngine } from '../audio';

interface MiniGameProps {
  onEarnPoints: (points: number) => void;
}

export const RedBlackGame: React.FC<MiniGameProps> = ({ onEarnPoints }) => {
  const [flipped, setFlipped] = useState(false);
  const [revealedCard, setRevealedCard] = useState<{ color: 'red' | 'black'; suit: string; val: string }>({
    color: 'red',
    suit: '♥',
    val: 'A'
  });
  const [busy, setBusy] = useState(false);

  const handleBet = (betColor: 'red' | 'black') => {
    if (busy) return;
    setBusy(true);

    const isRed = Math.random() > 0.5;
    const cardColor: 'red' | 'black' = isRed ? 'red' : 'black';
    const suits = isRed ? ['♥', '♦'] : ['♠', '♣'];
    const suit = suits[Math.floor(Math.random() * suits.length)];
    const vals = ['A', 'K', 'Q', 'J', '10', '7'];
    const val = vals[Math.floor(Math.random() * vals.length)];

    setRevealedCard({ color: cardColor, suit, val });
    setFlipped(true);

    const win = betColor === cardColor;
    if (win) {
      onEarnPoints(25);
      soundEngine.playCritical();
    } else {
      onEarnPoints(-20);
      soundEngine.playHit();
    }

    setTimeout(() => {
      setFlipped(false);
      setBusy(false);
    }, 1200);
  };

  return (
    <div className="mgarea casino redblack">
      <div className="cardstage">
        <div className={`card3d ${flipped ? 'flipped' : ''}`}>
          <div className="cardface back" />
          <div className={`cardface front ${revealedCard.color}`}>
            <span className="pip tl">{revealedCard.val}<br />{revealedCard.suit}</span>
            <span className="suit-big">{revealedCard.suit}</span>
            <span className="pip br">{revealedCard.val}<br />{revealedCard.suit}</span>
          </div>
        </div>
      </div>

      <div className="rbbets">
        <button
          type="button"
          className="rbbet red"
          onClick={() => handleBet('red')}
          disabled={busy}
        >
          RED ♥
        </button>
        <button
          type="button"
          className="rbbet black"
          onClick={() => handleBet('black')}
          disabled={busy}
        >
          BLACK ♠
        </button>
      </div>
    </div>
  );
};
