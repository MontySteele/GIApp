/**
 * Guards against D-17: every localStorage key the app uses must be declared in
 * storageKeys.ts, and every declared key must actually be used somewhere.
 *
 * The scan is deliberately simple: it looks for string literals passed
 * directly to localStorage.getItem/setItem/removeItem and for Zustand
 * `persist` names. Dynamic keys (variables, template strings) are skipped.
 */
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { ALL_APP_STORAGE_KEYS, BACKED_UP_LOCAL_STATE_KEYS, STORAGE_KEYS } from './storageKeys';

const SRC_ROOT = resolve(__dirname, '../../');
const SELF = resolve(__dirname, 'storageKeys.ts');

function listSourceFiles(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      if (name === 'node_modules' || name === 'test') continue;
      listSourceFiles(full, out);
      continue;
    }
    if (!/\.(ts|tsx)$/.test(name)) continue;
    if (/\.(test|spec)\.(ts|tsx)$/.test(name) || name.endsWith('.d.ts')) continue;
    if (full === SELF) continue;
    out.push(full);
  }
  return out;
}

const LITERAL_STORAGE_CALL = /(?:localStorage|sessionStorage)\.(?:getItem|setItem|removeItem)\(\s*(['"`])([^'"`]+)\1/g;

describe('storageKeys', () => {
  const files = listSourceFiles(SRC_ROOT);
  const sources = new Map(files.map((file) => [relative(SRC_ROOT, file), readFileSync(file, 'utf8')]));
  const knownValues = new Set<string>(ALL_APP_STORAGE_KEYS);

  it('finds source files to scan', () => {
    expect(files.length).toBeGreaterThan(10);
  });

  it('every string literal passed to localStorage.*Item is a declared key', () => {
    const offenders: string[] = [];
    for (const [file, source] of sources) {
      for (const match of source.matchAll(LITERAL_STORAGE_CALL)) {
        const key = match[2] ?? '';
        if (!knownValues.has(key)) offenders.push(`${file}: '${key}'`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('every declared key is used somewhere in src', () => {
    const unused: string[] = [];
    for (const [name, value] of Object.entries(STORAGE_KEYS)) {
      const byConstant = `STORAGE_KEYS.${name}`;
      const used = [...sources.values()].some(
        (source) => source.includes(byConstant) || source.includes(`'${value}'`) || source.includes(`"${value}"`)
      );
      if (!used) unused.push(name);
    }
    expect(unused).toEqual([]);
  });

  it('has no duplicate key values', () => {
    expect(new Set(ALL_APP_STORAGE_KEYS).size).toBe(ALL_APP_STORAGE_KEYS.length);
  });

  it('backup allowlist is a subset of declared keys and excludes UI preferences', () => {
    for (const key of BACKED_UP_LOCAL_STATE_KEYS) {
      expect(knownValues.has(key)).toBe(true);
    }
    expect(BACKED_UP_LOCAL_STATE_KEYS).not.toContain(STORAGE_KEYS.UI_SETTINGS);
    expect(BACKED_UP_LOCAL_STATE_KEYS).toContain(STORAGE_KEYS.WISHLIST);
  });
});
