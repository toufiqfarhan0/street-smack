import React from 'react';

interface HeaderProps {
  currentRoute: string; // 'home' | 'dashboard' | 'profile' | 'characters' | 'play' | 'player' | 'screen'
  walletConnected?: boolean;
  onToggleWallet?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRoute,
  walletConnected = true,
  onToggleWallet
}) => {
  const isCombatRoute = currentRoute === 'play' || currentRoute === 'player' || currentRoute === 'screen';
  const isSpectator = currentRoute === 'screen';

  return (
    <header className="top">
      {/* Brand Logo */}
      <a className="brand" href="#/">
        <img
          src="/img/street-smack-logo.png"
          alt="Street Smack"
          style={{ maxHeight: '42px', width: 'auto' }}
        />
      </a>

      {/* Main Navigation */}
      <nav>
        <span className="chip" title="Connected to Solana Devnet & MagicBlock Ephemeral Rollup">
          Solana Blitz · MagicBlock ER
        </span>

        {!isSpectator && currentRoute !== 'dashboard' && (
          <a className="ghost" href="#/dashboard">
            Dashboard
          </a>
        )}

        {!isSpectator && currentRoute !== 'profile' && (
          <a className="ghost" href="#/profile">
            Profile
          </a>
        )}

        {!isSpectator && currentRoute !== 'characters' && (
          <a className="ghost" href="#/characters">
            Fighters
          </a>
        )}

        {/* Combat Mode Switcher */}
        {isCombatRoute && (
          <span className="modeswitch" role="group" aria-label="Display mode">
            <a
              href="#/play"
              title="Full arena: stage, active mini-game, and emote attacks"
              className={currentRoute === 'play' ? 'on' : ''}
              aria-current={currentRoute === 'play' ? 'true' : undefined}
            >
              Normal
            </a>
            <a
              href="#/player"
              title="Mobile Controller: compact bars, large mini-game, and emotes"
              className={currentRoute === 'player' ? 'on' : ''}
              aria-current={currentRoute === 'player' ? 'true' : undefined}
            >
              Player
            </a>
            <a
              href="#/screen"
              title="Spectator broadcast: fullscreen cinematic arena"
              className={currentRoute === 'screen' ? 'on' : ''}
              aria-current={currentRoute === 'screen' ? 'true' : undefined}
            >
              Spectator
            </a>
          </span>
        )}


        {/* Solana Wallet Chip */}
        {walletConnected ? (
          <span className="walletchip">
            <code>7xKX...9Ab2</code>
            <button
              type="button"
              className="ghost"
              onClick={onToggleWallet}
              style={{ padding: '4px 8px', fontSize: '11px' }}
            >
              Disconnect
            </button>
          </span>
        ) : (
          <button
            type="button"
            className="ghost"
            onClick={onToggleWallet}
          >
            Connect Wallet
          </button>
        )}
      </nav>
    </header>
  );
};
