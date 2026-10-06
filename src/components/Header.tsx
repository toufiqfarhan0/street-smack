import React, { useState } from 'react';
import { soundEngine } from '../engine/audio';

interface HeaderProps {
  currentView: 'arena' | 'controller' | 'lobby' | 'profile';
  onNavigate: (view: 'arena' | 'controller' | 'lobby' | 'profile') => void;
  walletConnected: boolean;
  onConnectWallet: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  walletConnected,
  onConnectWallet
}) => {
  const [audioMuted, setAudioMuted] = useState(false);

  const toggleSound = () => {
    const nextState = !audioMuted;
    setAudioMuted(nextState);
    soundEngine.toggle(!nextState);
  };

  return (
    <header className="top" style={{ paddingBottom: '8px', borderBottom: '1px solid var(--line)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <a
          href="#/arena"
          className="brand"
          onClick={(e) => { e.preventDefault(); onNavigate('arena'); }}
          style={{ display: 'flex', alignItems: 'center' }}
        >
          <img
            src="/img/street-smack-logo.png"
            alt="Street Smack"
            style={{
              height: '42px',
              width: 'auto',
              objectFit: 'contain',
              filter: 'drop-shadow(0 2px 8px rgba(255, 194, 58, 0.35))'
            }}
          />
        </a>

        <div className="chip" style={{ background: '#1c0f2e', color: '#ffc23a', borderColor: '#ffc23a' }}>
          ⚡ MAGICBLOCK ER (15ms)
        </div>
      </div>

      <nav>
        <button
          type="button"
          className="ghost"
          aria-pressed={currentView === 'arena'}
          onClick={() => onNavigate('arena')}
        >
          📺 ARENA (BIG SCREEN)
        </button>

        <button
          type="button"
          className="ghost"
          aria-pressed={currentView === 'controller'}
          onClick={() => onNavigate('controller')}
        >
          🎮 PLAY (CONTROLLER)
        </button>

        <button
          type="button"
          className="ghost"
          aria-pressed={currentView === 'lobby'}
          onClick={() => onNavigate('lobby')}
        >
          🥊 FIGHTS
        </button>

        <button
          type="button"
          className="ghost"
          aria-pressed={currentView === 'profile'}
          onClick={() => onNavigate('profile')}
        >
          🃏 NFT DECK
        </button>

        <button
          type="button"
          className="ghost"
          onClick={toggleSound}
          title={audioMuted ? 'Unmute Sound' : 'Mute Sound'}
        >
          {audioMuted ? '🔇' : '🔊'}
        </button>

        <div className="walletchip">
          {walletConnected ? (
            <button type="button" className="ghost" style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }}>
              🟢 7xKX...9Ab2 (SESSION KEY)
            </button>
          ) : (
            <button type="button" className="cta small" onClick={onConnectWallet}>
              CONNECT WALLET
            </button>
          )}
        </div>
      </nav>
    </header>
  );
};
