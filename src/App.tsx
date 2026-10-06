import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Home } from './components/Home';
import { Dashboard } from './components/Dashboard';
import { Profile } from './components/Profile';
import { Characters } from './components/Characters';
import { Play } from './components/Play';

export function App() {
  const getRouteFromHash = () => {
    const hash = window.location.hash.replace(/^#\/?/, '').split('?')[0];
    if (['dashboard', 'profile', 'characters', 'play', 'player', 'screen'].includes(hash)) {
      return hash;
    }
    return 'home';
  };

  const [currentRoute, setCurrentRoute] = useState(getRouteFromHash);
  const [walletConnected, setWalletConnected] = useState(true);

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentRoute(getRouteFromHash());
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const isWide = currentRoute === 'screen' || currentRoute === 'dashboard';

  return (
    <div className={`wrap ${isWide ? 'wide' : ''}`}>
      <Header
        currentRoute={currentRoute}
        walletConnected={walletConnected}
        onToggleWallet={() => setWalletConnected(prev => !prev)}
      />

      <main>
        {currentRoute === 'home' && <Home />}
        {currentRoute === 'dashboard' && <Dashboard />}
        {currentRoute === 'profile' && <Profile />}
        {currentRoute === 'characters' && <Characters />}
        {currentRoute === 'play' && <Play mode="normal" />}
        {currentRoute === 'player' && <Play mode="player" />}
        {currentRoute === 'screen' && <Play mode="screen" />}
      </main>
    </div>
  );
}

export default App;
