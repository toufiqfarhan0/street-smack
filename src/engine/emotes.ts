export interface EmoteConfig {
  id: 'six7' | 'dab' | 'griddy' | 'quoicoubeh';
  index: number;
  name: string;
  cost: number;
  raw: number;
  key: string;
  sfx: string;
  desc: string;
}

export const EMOTES: EmoteConfig[] = [
  {
    id: 'six7',
    index: 0,
    name: '6 · 7',
    cost: 60,
    raw: 2,
    key: '1',
    sfx: '67',
    desc: 'Quick jab combo chant'
  },
  {
    id: 'dab',
    index: 1,
    name: 'Dab',
    cost: 150,
    raw: 6,
    key: '2',
    sfx: 'dab',
    desc: 'Classic brainrot pose shockwave'
  },
  {
    id: 'griddy',
    index: 2,
    name: 'Griddy',
    cost: 300,
    raw: 14,
    key: '3',
    sfx: 'griddy',
    desc: 'Right foot creep high-tempo flex'
  },
  {
    id: 'quoicoubeh',
    index: 3,
    name: 'Quoicoubeh',
    cost: 500,
    raw: 26,
    key: '4',
    sfx: 'quoicoubeh',
    desc: 'Massive acoustic blast K.O. strike'
  }
];

export function getEmote(id: string): EmoteConfig | undefined {
  return EMOTES.find(e => e.id === id);
}

export function getEmoteByIndex(index: number): EmoteConfig | undefined {
  return EMOTES[index];
}
