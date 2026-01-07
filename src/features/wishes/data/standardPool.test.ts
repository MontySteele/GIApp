import { describe, expect, it } from 'vitest';
import { resolveIsFeatured } from './standardPool';

describe('standard pool helpers', () => {
  it('marks standard characters as non-featured on character-style banners', () => {
    expect(resolveIsFeatured('Diluc', 'character', 'character', 5)).toBe(false);
    expect(resolveIsFeatured('Mona', 'chronicled', 'character', 5)).toBe(false);
  });

  it('marks limited characters as featured on character banners', () => {
    expect(resolveIsFeatured('Furina', 'character', 'character', 5)).toBe(true);
  });

  it('marks standard weapons as non-featured on weapon banners', () => {
    expect(resolveIsFeatured("Wolf's Gravestone", 'weapon', 'weapon', 5)).toBe(false);
    expect(resolveIsFeatured('Skyward Harp', 'weapon', 'weapon', 5)).toBe(false);
  });

  it('marks rate-up weapons as featured on weapon banners', () => {
    expect(resolveIsFeatured('Aqua Simulacra', 'weapon', 'weapon', 5)).toBe(true);
  });

  it('ignores non-5-star pulls', () => {
    expect(resolveIsFeatured('Bennett', 'character', 'character', 4)).toBeUndefined();
  });
});
