import { describe, it, expect } from 'vitest';
import {
  encryptData,
  decryptData,
  createSyncPayload,
  parseSyncPayload,
  wrapForTextExport,
  unwrapFromTextImport,
  bytesToBase64,
  base64ToBytes,
  textToBase64,
  base64ToText,
  type SyncPayload,
} from './syncUtils';

describe('syncUtils', () => {
  describe('base64 helpers', () => {
    it('round-trips arbitrary bytes, including values above 0x7f', () => {
      const bytes = new Uint8Array(70_000);
      for (let i = 0; i < bytes.length; i++) bytes[i] = (i * 31) & 0xff;

      const decoded = base64ToBytes(bytesToBase64(bytes));
      expect(decoded).toEqual(bytes);
    });

    it('round-trips non-Latin1 text through UTF-8', () => {
      const text = 'Furina 🎭 芙宁娜 — こんにちは';
      expect(base64ToText(textToBase64(text))).toBe(text);
    });

    it('still decodes legacy btoa(rawString) output', () => {
      const legacy = btoa('café'); // Latin1 "é", not UTF-8
      expect(base64ToText(legacy)).toBe('café');
    });
  });

  describe('encryptData / decryptData', () => {
    it('encrypts and decrypts a ~1 MB payload', async () => {
      const payload = 'x'.repeat(1_000_000) + '🎉';
      const encrypted = await encryptData(payload, 'correct horse');
      const decrypted = await decryptData(encrypted, 'correct horse');
      expect(decrypted).toBe(payload);
    }, 30_000);

    it('rejects the wrong passphrase', async () => {
      const encrypted = await encryptData('secret', 'right');
      await expect(decryptData(encrypted, 'wrong')).rejects.toThrow(/Decryption failed/);
    });
  });

  describe('text export format', () => {
    const noteWithUnicode = {
      exportedAt: '2026-03-01T00:00:00.000Z',
      schemaVersion: 5,
      data: {
        notes: [
          {
            id: 'n1',
            title: 'Rotation 🎭',
            content: '芙宁娜 → 万叶 → 夜兰 → 白术 ✨ emoji: 🔥💧',
            tags: ['日本語'],
            pinned: false,
            createdAt: '2026-03-01T00:00:00.000Z',
            updatedAt: '2026-03-01T00:00:00.000Z',
          },
        ],
      },
    };

    it('survives an uncompressed export/import with emoji and CJK', async () => {
      const payload = await createSyncPayload(noteWithUnicode, 5, { compress: false });
      const wrapped = wrapForTextExport(payload);
      const unwrapped = unwrapFromTextImport(wrapped);
      const parsed = await parseSyncPayload<typeof noteWithUnicode>(unwrapped);
      expect(parsed).toEqual(noteWithUnicode);
    });

    it('survives a compressed + encrypted export/import with emoji and CJK', async () => {
      const payload = await createSyncPayload(noteWithUnicode, 5, {
        compress: true,
        encrypt: true,
        passphrase: 'pass',
      });
      const unwrapped = unwrapFromTextImport(wrapForTextExport(payload));
      const parsed = await parseSyncPayload<typeof noteWithUnicode>(unwrapped, { passphrase: 'pass' });
      expect(parsed).toEqual(noteWithUnicode);
    });

    it('reads legacy exports produced with plain btoa()', async () => {
      const payload: SyncPayload = await createSyncPayload({ hello: 'world' }, 5, { compress: true });
      const legacyWrapped = `===GIAPP-SYNC===\n${btoa(JSON.stringify(payload))}\n===END-SYNC===`;
      const unwrapped = unwrapFromTextImport(legacyWrapped);
      expect(await parseSyncPayload(unwrapped)).toEqual({ hello: 'world' });
    });

    it('rejects text without the header/footer', () => {
      expect(() => unwrapFromTextImport('nope')).toThrow(/missing header\/footer/);
    });
  });
});
