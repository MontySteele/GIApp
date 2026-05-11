import { describe, expect, it, vi } from 'vitest';
import { scrollToHashTarget } from './hashScroll';

describe('scrollToHashTarget', () => {
  it('scrolls to the decoded hash target', () => {
    const doc = document.implementation.createHTMLDocument();
    const target = doc.createElement('section');
    target.id = 'quick resource logger';
    target.scrollIntoView = vi.fn();
    doc.body.appendChild(target);

    expect(scrollToHashTarget('#quick%20resource%20logger', doc)).toBe(true);
    expect(target.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
  });

  it('returns false when there is no hash target', () => {
    const doc = document.implementation.createHTMLDocument();

    expect(scrollToHashTarget('', doc)).toBe(false);
    expect(scrollToHashTarget('#missing', doc)).toBe(false);
  });
});
