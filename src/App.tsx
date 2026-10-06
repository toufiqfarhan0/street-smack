import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Arena } from './components/Arena';
import { Controller } from './components/Controller';
import { Lobby } from './components/Lobby';
import { Profile } from './components/Profile';

export function App() {
  const [currentView, setCurrentView] = useState<'arena' | 'controller' | 'lobby' | 'profile'>('arena');
  const [walletConnected, setWalletConnected] = useState(true);

  // Sync hash routing
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#/', '').replace('#', '');
      if (['arena', 'controller', 'lobby', 'profile'].includes(hash)) {
        setCurrentView(hash as any);
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = (view: 'arena' | 'controller' | 'lobby' | 'profile') => {
    setCurrentView(view);
    window.location.hash = `#/${view}`;
  };

  return (
    <div className="wrap wide">
      <Header
        currentView={currentView}
        onNavigate={navigate}
        walletConnected={walletConnected}
        onConnectWallet={() => setWalletConnected(true)}
      />

      <main style={{ minHeight: 'calc(100vh - 120px)' }}>
        {currentView === 'arena' && (
          <Arena onJoinAsPlayer={() => navigate('controller')} />
        )}

        {currentView === 'controller' && (
          <Controller onBackToArena={() => navigate('arena')} />
        )}

        {currentView === 'lobby' && (
          <Lobby onSelectFight={() => navigate('arena')} />
        )}

        {currentView === 'profile' && (
          <Profile />
        )}
      </main>

      {/* Footer info */}
      <footer style={{ marginTop: '20px', paddingTop: '14px', borderTop: '1px solid var(--line)', textAlign: 'center', fontSize: '12px', color: 'var(--bone-dim)' }}>
        <span>
          🥊 <b>STREET SMACK</b> — Built for <b>Solana Blitz v9</b> powered by{' '}
          <a href="https://magicblock.gg" target="_blank" rel="noreferrer" style={{ color: 'var(--gold)', fontWeight: 700 }}>
            MagicBlock Ephemeral Rollups
          </a>
        </span>
      </footer>
    </div>
  );
}

export default App;
