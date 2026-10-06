import React from 'react';

interface HomeProps {
  onNavigate?: (view: string) => void;
}

export const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  const navigate = (hash: string) => {
    window.location.hash = hash;
    if (onNavigate) onNavigate(hash.replace('#/', ''));
  };

  return (
    <section className="screen home">
      <div className="hero">
        <p className="eyebrow">Solana Blitz v9 · MagicBlock ER</p>
        <h1>Two Memes, One Arena, Five Mini-Games</h1>
        <p className="lede">
          Stake your SOL, get assigned randomly to a meme team, earn energy points in 10-second mini-games, and unleash emote attacks.
          Every emote is a verified on-chain micro-transaction draining the opposing team's aura at sub-20ms speed, powered by MagicBlock Ephemeral Rollups.
        </p>
      </div>

      <div className="choices">
        <button
          className="choice"
          type="button"
          onClick={() => navigate('#/dashboard')}
        >
          <span className="ic" aria-hidden="true">▚</span>
          <b>Dashboard</b>
          <small>Upcoming, live, and finished matches. Room counters and active volume.</small>
          <em>View Matches →</em>
        </button>

        <button
          className="choice"
          type="button"
          onClick={() => navigate('#/profile')}
        >
          <span className="ic" aria-hidden="true">◈</span>
          <b>My Profile</b>
          <small>Your NFT trophies, match record, cumulative damage, emotes cast, and SOL earnings.</small>
          <em>View Profile →</em>
        </button>

        <button
          className="choice"
          type="button"
          onClick={() => navigate('#/characters')}
        >
          <span className="ic" aria-hidden="true">★</span>
          <b>Fighter Workshop</b>
          <small>Showcase of all 5 fighters, dynamic attack animations, and legendary cards.</small>
          <em>Explore Fighters →</em>
        </button>
      </div>

      <p className="note">
        <b>Solana Blitz Architecture:</b> Stakes stay protected in the non-delegated Solana L1 Vault PDA. The match state is delegated to MagicBlock Ephemeral Rollup for sub-20ms real-time combat with zero wallet popup delays. Payouts and NFT trophy minting execute automatically on base layer when the brawl concludes.
      </p>

      <div className="center">
        <a className="ghost" href="#/play" style={{ fontSize: '15px', padding: '10px 22px' }}>
          Enter Live Brawl Directly 🥊
        </a>
      </div>
    </section>
  );
};
