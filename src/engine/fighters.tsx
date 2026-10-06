import React, { useEffect, useRef } from 'react';

// Easing & interpolation
export const easeInOut = (e: number) => (e < 0.5 ? 2 * e * e : 1 - (-2 * e + 2) ** 2 / 2);

export const lerpPose = (from: Record<string, number>, to: Record<string, number>, t: number) => {
  const res: Record<string, number> = {};
  for (const k in from) {
    const target = to[k] !== undefined ? to[k] : from[k];
    res[k] = from[k] + (target - from[k]) * t;
  }
  return res;
};

// SVG Namespace
const SVG_NS = 'http://www.w3.org/2000/svg';
let uidCounter = 0;
export const createSvgId = (prefix = 'id') => `${prefix}_${++uidCounter}`;

export function createSvgElement<T extends SVGElement = SVGElement>(
  tag: string,
  attrs: Record<string, string | number> = {},
  parent?: SVGElement | null
): T {
  const el = document.createElementNS(SVG_NS, tag) as T;
  for (const [k, v] of Object.entries(attrs)) {
    el.setAttribute(k, String(v));
  }
  if (parent) parent.appendChild(el);
  return el;
}

// 2-segment articulated limb builder
export function createLimb(
  parent: SVGElement,
  x: number,
  y: number,
  length1: number,
  length2: number,
  strokeWidth: number,
  color: string,
  appendEndJoint?: (endGroup: SVGElement) => void
) {
  const root = createSvgElement('g', {}, parent);
  createSvgElement(
    'line',
    { x1: 0, y1: 0, x2: 0, y2: length1, stroke: color, 'stroke-width': strokeWidth, 'stroke-linecap': 'round' },
    root
  );
  const mid = createSvgElement('g', {}, root);
  createSvgElement(
    'line',
    { x1: 0, y1: 0, x2: 0, y2: length2, stroke: color, 'stroke-width': strokeWidth * 0.9, 'stroke-linecap': 'round' },
    mid
  );
  const tip = createSvgElement('g', {}, mid);
  if (appendEndJoint) appendEndJoint(tip);

  return (angle1: number = 0, angle2: number = 0, angle3: number = 0, flip = false) => {
    root.setAttribute('transform', `translate(${x},${y}) rotate(${angle1})`);
    mid.setAttribute('transform', `translate(0,${length1}) rotate(${angle2})`);
    tip.setAttribute('transform', `translate(0,${length2}) rotate(${angle3}) ${flip ? 'scale(-1,1)' : ''}`);
  };
}

export interface FighterMeta {
  id: string;
  name: string;
  title: string;
  color: string;
  avatar: string;
  quote: string;
  primaryAttack: string;
}

export const FIGHTERS: Record<string, FighterMeta> = {
  tung: {
    id: 'tung',
    name: 'Tung Tung Sahur',
    title: 'The Ramadan Drummer',
    color: '#ffc23a',
    avatar: '/img/seven.png',
    quote: 'SAHURRR! Wake up and claim the pot!',
    primaryAttack: 'Ramadan Beatdown'
  },
  tralalero: {
    id: 'tralalero',
    name: 'Tralalero Tralala',
    title: 'The Italian Siren',
    color: '#4fa3e0',
    avatar: '/img/cherry.png',
    quote: 'Tralalero tralala, your aura is mine!',
    primaryAttack: 'Opera Shockwave'
  },
  fraisita: {
    id: 'fraisita',
    name: 'Fraisita Bonk',
    title: 'Strawberry Bruiser',
    color: '#ff5a3c',
    avatar: '/img/bomb.png',
    quote: 'Sweet on the eyes, deadly on the chain!',
    primaryAttack: 'Berry Slam'
  },
  chocolato: {
    id: 'chocolato',
    name: 'Chocolato Max',
    title: 'Cocoa Heavyweight',
    color: '#a86a00',
    avatar: '/img/bar.png',
    quote: 'Heavy hits, pure sweetness.',
    primaryAttack: 'Cocoa Quake'
  },
  rerA: {
    id: 'rerA',
    name: 'Capibara RerA',
    title: 'The Zen Master',
    color: '#9c8bff',
    avatar: '/img/capibara.png',
    quote: 'OK I PULL UP. Unstoppable serenity.',
    primaryAttack: 'Zen Aura Burst'
  }
};

export const FIGHTER_KEYS = Object.keys(FIGHTERS);

export interface CharacterSvgProps {
  character: string;
  facing?: 'left' | 'right';
  pose?: 'idle' | 'dab' | 'griddy' | 'quoicoubeh' | 'victory' | 'hit';
  rarity?: number;
  className?: string;
}

export const CharacterSvg: React.FC<CharacterSvgProps> = ({
  character,
  facing = 'right',
  pose = 'idle',
  rarity,
  className
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const fighter = FIGHTERS[character] || FIGHTERS['tung'];

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    svg.textContent = '';

    const defs = createSvgElement('defs', {}, svg);
    const gradId = createSvgId('fighter_aura');
    const grad = createSvgElement(
      'radialGradient',
      { id: gradId, cx: 0.5, cy: 0.45, r: 0.7 },
      defs
    );
    createSvgElement('stop', { offset: '0%', 'stop-color': fighter.color, 'stop-opacity': '0.7' }, grad);
    createSvgElement('stop', { offset: '100%', 'stop-color': '#140a1f', 'stop-opacity': '0' }, grad);

    // Background aura circle
    createSvgElement('circle', { cx: 0, cy: -80, r: 120, fill: `url(#${gradId})` }, svg);

    // Character Rig container
    const g = createSvgElement('g', {
      transform: `translate(0, 20) scale(${facing === 'right' ? 1 : -1}, 1)`
    }, svg);

    // Ground Shadow
    createSvgElement('ellipse', { cx: 0, cy: 5, rx: 55, ry: 12, fill: '#000', opacity: '0.45' }, g);

    // Character Specific Artwork & Bones
    renderProceduralFighter(g, character, pose);
  }, [character, facing, pose, rarity, fighter.color]);

  return (
    <svg
      ref={svgRef}
      viewBox="-130 -260 260 320"
      className={className || 'w-full h-full block'}
      role="img"
      aria-label={fighter.name}
    />
  );
};

function renderProceduralFighter(g: SVGElement, character: string, pose: string) {
  // Common procedural animation offsets
  const isDab = pose === 'dab';
  const isGriddy = pose === 'griddy';
  const isQuoicoubeh = pose === 'quoicoubeh';
  const isHit = pose === 'hit';
  const isVictory = pose === 'victory';

  const bodyRot = isHit ? -15 : isDab ? -10 : isVictory ? -5 : 0;
  const bodyY = isHit ? -10 : isVictory ? -25 : isDab ? -5 : 0;

  const bodyGroup = createSvgElement('g', {
    transform: `translate(0, ${bodyY}) rotate(${bodyRot} 0 -50)`
  }, g);

  if (character === 'rerA') {
    // CAPIBARA
    // Legs
    createSvgElement('rect', { x: -35, y: -25, width: 18, height: 32, rx: 6, fill: '#7A5230' }, bodyGroup);
    createSvgElement('rect', { x: 18, y: -25, width: 18, height: 32, rx: 6, fill: '#7A5230' }, bodyGroup);
    // Body
    createSvgElement('rect', { x: -50, y: -110, width: 100, height: 95, rx: 28, fill: '#A06E42', stroke: '#3E230C', 'stroke-width': 3 }, bodyGroup);
    // Snout / Head
    createSvgElement('rect', { x: -40, y: -145, width: 85, height: 50, rx: 16, fill: '#8C5A32', stroke: '#3E230C', 'stroke-width': 3 }, bodyGroup);
    // Nose
    createSvgElement('ellipse', { cx: 40, cy: -125, rx: 10, ry: 7, fill: '#2E180A' }, bodyGroup);
    // Eye
    createSvgElement('circle', { cx: 10, cy: -135, r: 5, fill: '#120904' }, bodyGroup);
    createSvgElement('circle', { cx: 12, cy: -137, r: 1.5, fill: '#FFF' }, bodyGroup);
    // Orange on head (Signature Capibara Yuzu)
    createSvgElement('circle', { cx: -5, cy: -155, r: 14, fill: '#FFA500', stroke: '#3E230C', 'stroke-width': 2 }, bodyGroup);
    createSvgElement('path', { d: 'M-5 -168 Q-2 -175 4 -172', stroke: '#2E8B57', 'stroke-width': 3, fill: 'none' }, bodyGroup);
  } else if (character === 'fraisita') {
    // STRAWBERRY / FRAISITA
    // Legs
    createSvgElement('line', { x1: -20, y1: -10, x2: -25, y2: 25, stroke: '#5A1A24', 'stroke-width': 8, 'stroke-linecap': 'round' }, bodyGroup);
    createSvgElement('line', { x1: 20, y1: -10, x2: 25, y2: 25, stroke: '#5A1A24', 'stroke-width': 8, 'stroke-linecap': 'round' }, bodyGroup);
    // Strawberry Berry Body
    createSvgElement('path', {
      d: 'M 0 10 C -60 -20, -65 -130, 0 -140 C 65 -130, 60 -20, 0 10 Z',
      fill: '#FF385C',
      stroke: '#4A0D18',
      'stroke-width': 3.5
    }, bodyGroup);
    // Seeds
    for (const [sx, sy] of [[-25, -90], [0, -70], [25, -90], [-15, -40], [15, -40], [0, -110], [-30, -60], [30, -60]]) {
      createSvgElement('ellipse', { cx: sx, cy: sy, rx: 2.5, ry: 4, fill: '#FFE082' }, bodyGroup);
    }
    // Crown Leaves
    createSvgElement('path', {
      d: 'M 0 -138 Q -20 -165 -45 -145 Q -25 -140 -10 -132 Q 0 -170 15 -145 Q 35 -165 45 -140 Q 20 -138 0 -138 Z',
      fill: '#4CAF50',
      stroke: '#1B5E20',
      'stroke-width': 2
    }, bodyGroup);
    // Eyes
    createSvgElement('circle', { cx: -15, cy: -80, r: 7, fill: '#1B050B' }, bodyGroup);
    createSvgElement('circle', { cx: 15, cy: -80, r: 7, fill: '#1B050B' }, bodyGroup);
    createSvgElement('circle', { cx: -13, cy: -82, r: 2.2, fill: '#FFF' }, bodyGroup);
    createSvgElement('circle', { cx: 17, cy: -82, r: 2.2, fill: '#FFF' }, bodyGroup);
  } else {
    // TUNG TUNG SAHUR / TRALALERO / CHOCOLATO (Humanoid Wood/Gold Totem Fighter)
    const color = character === 'tralalero' ? '#2A5298' : character === 'chocolato' ? '#5D4037' : '#9A5E28';
    const strokeColor = '#1F1105';

    // Limbs / Legs
    createSvgElement('line', { x1: -18, y1: -40, x2: -24, y2: 25, stroke: strokeColor, 'stroke-width': 9, 'stroke-linecap': 'round' }, bodyGroup);
    createSvgElement('line', { x1: 18, y1: -40, x2: 24, y2: 25, stroke: strokeColor, 'stroke-width': 9, 'stroke-linecap': 'round' }, bodyGroup);

    // Torso / Totem Log
    createSvgElement('rect', {
      x: -36,
      y: -180,
      width: 72,
      height: 150,
      rx: 24,
      fill: color,
      stroke: strokeColor,
      'stroke-width': 4
    }, bodyGroup);

    // Face / Eye
    createSvgElement('ellipse', { cx: 18, cy: -130, rx: 12, ry: 15, fill: '#FFF7E8', stroke: strokeColor, 'stroke-width': 2 }, bodyGroup);
    createSvgElement('circle', { cx: 22, cy: -130, r: 5.5, fill: '#120904' }, bodyGroup);
    createSvgElement('circle', { cx: 24, cy: -132, r: 1.8, fill: '#FFF' }, bodyGroup);

    // Mouth / Expression
    createSvgElement('ellipse', { cx: 20, cy: -100, rx: isDab ? 8 : 5, ry: isVictory ? 7 : 2.5, fill: '#2A1206' }, bodyGroup);

    // Headband / Crown
    createSvgElement('path', {
      d: 'M -38 -150 Q 0 -165 38 -150',
      stroke: '#FFC23A',
      'stroke-width': 6,
      fill: 'none',
      'stroke-linecap': 'round'
    }, bodyGroup);

    // Arms in poses
    if (isDab) {
      // Dab arms: one arm over face, other pointing diagonally up-back
      createSvgElement('line', { x1: 10, y1: -120, x2: -35, y2: -135, stroke: strokeColor, 'stroke-width': 9, 'stroke-linecap': 'round' }, bodyGroup);
      createSvgElement('line', { x1: -10, y1: -110, x2: 55, y2: -160, stroke: strokeColor, 'stroke-width': 9, 'stroke-linecap': 'round' }, bodyGroup);
    } else if (isVictory) {
      // Arms raised high
      createSvgElement('line', { x1: -25, y1: -120, x2: -55, y2: -190, stroke: strokeColor, 'stroke-width': 9, 'stroke-linecap': 'round' }, bodyGroup);
      createSvgElement('line', { x1: 25, y1: -120, x2: 55, y2: -190, stroke: strokeColor, 'stroke-width': 9, 'stroke-linecap': 'round' }, bodyGroup);
    } else {
      // Boxer fists ready
      createSvgElement('line', { x1: -20, y1: -110, x2: 30, y2: -105, stroke: strokeColor, 'stroke-width': 9, 'stroke-linecap': 'round' }, bodyGroup);
      createSvgElement('line', { x1: 20, y1: -100, x2: 45, y2: -90, stroke: strokeColor, 'stroke-width': 9, 'stroke-linecap': 'round' }, bodyGroup);
    }
  }
}
