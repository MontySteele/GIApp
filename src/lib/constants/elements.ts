/**
 * Element Constants
 *
 * Genshin Impact elemental types and associated colors.
 */

export const ELEMENTS = {
  PYRO: 'pyro',
  HYDRO: 'hydro',
  ANEMO: 'anemo',
  ELECTRO: 'electro',
  DENDRO: 'dendro',
  CRYO: 'cryo',
  GEO: 'geo',
} as const;

export type Element = typeof ELEMENTS[keyof typeof ELEMENTS];

export const ELEMENT_LABELS: Record<Element, string> = {
  [ELEMENTS.PYRO]: 'Pyro',
  [ELEMENTS.HYDRO]: 'Hydro',
  [ELEMENTS.ANEMO]: 'Anemo',
  [ELEMENTS.ELECTRO]: 'Electro',
  [ELEMENTS.DENDRO]: 'Dendro',
  [ELEMENTS.CRYO]: 'Cryo',
  [ELEMENTS.GEO]: 'Geo',
};

// Tailwind CSS color classes for elements
export const ELEMENT_COLORS: Record<Element, string> = {
  [ELEMENTS.PYRO]: 'bg-pyro text-white',
  [ELEMENTS.HYDRO]: 'bg-hydro text-white',
  [ELEMENTS.ANEMO]: 'bg-anemo text-white',
  [ELEMENTS.ELECTRO]: 'bg-electro text-white',
  [ELEMENTS.DENDRO]: 'bg-dendro text-white',
  [ELEMENTS.CRYO]: 'bg-cryo text-slate-900',
  [ELEMENTS.GEO]: 'bg-geo text-slate-900',
};

// Badge variant mapping for elements
export const ELEMENT_BADGE_VARIANTS: Record<Element, string> = {
  [ELEMENTS.PYRO]: 'pyro',
  [ELEMENTS.HYDRO]: 'hydro',
  [ELEMENTS.ANEMO]: 'anemo',
  [ELEMENTS.ELECTRO]: 'electro',
  [ELEMENTS.DENDRO]: 'dendro',
  [ELEMENTS.CRYO]: 'cryo',
  [ELEMENTS.GEO]: 'geo',
};
