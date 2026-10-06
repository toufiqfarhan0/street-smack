import React, { useState } from 'react';
import { FIGHTERS, CharacterSvg } from '../engine/fighters';
import { EMOTES } from '../engine/emotes';
import { soundEngine } from '../engine/audio';
import { gameState } from '../engine/gameState';

interface CharactersProps {
  onStartFightWithFighters?: (charA: string, charB: string) => void;
}

export const Characters: React.FC<CharactersProps> = ({ onStartFightWithFighters }) => {
  const [charA, setCharA] = useState('tung');
  const [charB, setCharB] = useState('tralalero');
  const [poseA, setPoseA] = useState<'idle' | 'dab' | 'griddy' | 'quoicoubeh' | 'victory' | 'hit'>('idle');
  const [poseB, setPoseB] = useState<'idle' | 'dab' | 'griddy' | 'quoicoubeh' | 'victory' | 'hit'>('idle');

  const fighterList = Object.keys(FIGHTERS);

  const playEmoteA = (emoteId: string) => {
    const emote = EMOTES.find(e => e.id === emoteId);
    if (emote) soundEngine.play(emote.sfx);
    setPoseA(emoteId as any);
    setPoseB('hit');
    setTimeout(() => {
      setPoseA('idle');
      setPoseB('idle');
    }, 850);
  };

  const playEmoteB = (emoteId: string) => {
    const emote = EMOTES.find(e => e.id === emoteId);
    if (emote) soundEngine.play(emote.sfx);
    setPoseB(emoteId as any);
    setPoseA('hit');
    setTimeout(() => {
      setPoseA('idle');
      setPoseB('idle');
    }, 850);
  };

  const playVictoryA = () => {
    soundEngine.playCritical();
    setPoseA('victory');
    setPoseB('hit');
    setTimeout(() => {
      setPoseA('idle');
      setPoseB('idle');
    }, 1200);
  };

  const playVictoryB = () => {
    soundEngine.playCritical();
    setPoseB('victory');
    setPoseA('hit');
    setTimeout(() => {
      setPoseA('idle');
      setPoseB('idle');
    }, 1200);
  };

  const handleLaunchFight = () => {
    gameState.restartMatch(charA, charB);
    window.location.hash = '#/play';
    if (onStartFightWithFighters) {
      onStartFightWithFighters(charA, charB);
    }
  };

  return (
    <section className="screen atelier">
      {/* Atelier Hero */}
      <div className="hero">
        <p className="eyebrow">Fighter Workshop</p>
        <h1>Character Roster & Workshop</h1>
        <p className="lede">
          {fighterList.length} fighters. Each one is pure code: a shared skeletal rig (<code>biped.ts</code>), procedural SVG vector art, and unique warcries.
          Pick any two, test their combat animations and emotes, then launch the live duel on Solana / MagicBlock.
        </p>
      </div>

      {/* Characters Gallery */}
      <div className="gallery">
        {fighterList.map(key => {
          const f = FIGHTERS[key];
          const isA = key === charA;
          const isB = key === charB;

          return (
            <article
              key={key}
              className={`rostercard ${isA ? 'is-a' : ''} ${isB ? 'is-b' : ''}`}
            >
              <div className="poses">
                <div>
                  <CharacterSvg character={key} facing="right" pose="idle" />
                  <span>Idle Stance</span>
                </div>
                <div>
                  <div style={{ filter: 'drop-shadow(0 0 10px #ffc23a)' }}>
                    <CharacterSvg character={key} facing="right" pose="victory" />
                  </div>
                  <span>NFT Card · Legendary</span>
                </div>
              </div>

              <h3>{f.name}</h3>

              <div className="pick">
                <button
                  type="button"
                  className="ghost"
                  onClick={() => setCharA(key)}
                  disabled={isA}
                >
                  Side A {isA ? '✓' : ''}
                </button>
                <button
                  type="button"
                  className="ghost"
                  onClick={() => setCharB(key)}
                  disabled={isB}
                >
                  Side B {isB ? '✓' : ''}
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {/* Atelier Live Interactive Stage */}
      <div className="atelierstage">
        <div
          className="sa-stage"
          style={{
            maxHeight: '420px',
            background: 'radial-gradient(ellipse at 50% 30%, #2a1545 0%, #0d0617 80%)'
          }}
        >
          {/* Fighter A */}
          <div
            style={{
              position: 'absolute',
              bottom: '10%',
              left: '16%',
              width: '32%',
              height: '75%',
              zIndex: 3
            }}
          >
            <CharacterSvg character={charA} facing="right" pose={poseA} />
          </div>

          {/* Fighter B */}
          <div
            style={{
              position: 'absolute',
              bottom: '10%',
              right: '16%',
              width: '32%',
              height: '75%',
              zIndex: 3
            }}
          >
            <CharacterSvg character={charB} facing="left" pose={poseB} />
          </div>

          {/* VS Center Marker */}
          <div
            className="vs"
            style={{
              position: 'absolute',
              top: '40%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 1,
              opacity: 0.8
            }}
          >
            VS
          </div>
        </div>
      </div>

      {/* Animation Tester Deck */}
      <div className="anims">
        <div className="animside">
          <b>{FIGHTERS[charA]?.name?.toUpperCase()} ANIMATIONS (SIDE A):</b>
          <div className="row">
            <button type="button" className="ghost" onClick={() => setPoseA('idle')}>Idle</button>
            <button type="button" className="ghost" onClick={() => playEmoteA('six7')}>6·7</button>
            <button type="button" className="ghost" onClick={() => playEmoteA('dab')}>Dab</button>
            <button type="button" className="ghost" onClick={() => playEmoteA('griddy')}>Griddy</button>
            <button type="button" className="ghost" onClick={() => playEmoteA('quoicoubeh')}>Quoicoubeh</button>
            <button type="button" className="ghost" onClick={playVictoryA}>Finisher</button>
          </div>
        </div>

        <div className="animside">
          <b>{FIGHTERS[charB]?.name?.toUpperCase()} ANIMATIONS (SIDE B):</b>
          <div className="row">
            <button type="button" className="ghost" onClick={() => setPoseB('idle')}>Idle</button>
            <button type="button" className="ghost" onClick={() => playEmoteB('six7')}>6·7</button>
            <button type="button" className="ghost" onClick={() => playEmoteB('dab')}>Dab</button>
            <button type="button" className="ghost" onClick={() => playEmoteB('griddy')}>Griddy</button>
            <button type="button" className="ghost" onClick={() => playEmoteB('quoicoubeh')}>Quoicoubeh</button>
            <button type="button" className="ghost" onClick={playVictoryB}>Finisher</button>
          </div>
        </div>

        <div className="center" style={{ marginTop: '12px' }}>
          <button
            type="button"
            className="cta"
            onClick={handleLaunchFight}
          >
            START BATTLE WITH THESE FIGHTERS ⚡
          </button>
        </div>
      </div>
    </section>
  );
};
