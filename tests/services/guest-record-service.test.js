import { describe, expect, it, vi } from 'vitest';
import {
  GUEST_RECORD_STORAGE_KEY,
  readGuestRecord,
  writeGuestRecord,
} from '../../src/services/guest-record-service.js';

function createStorage(initial = null) {
  const values = new Map(initial ? [[GUEST_RECORD_STORAGE_KEY, initial]] : []);
  return {
    getItem: vi.fn((key) => values.get(key) ?? null),
    setItem: vi.fn((key, value) => values.set(key, value)),
  };
}

describe('guest record service', () => {
  it('returns a default record when no browser record exists', () => {
    expect(readGuestRecord(createStorage())).toEqual({
      bestScore: 0, aircraftId: 'default', achievedAt: null,
    });
  });

  it('persists valid versioned records and only replaces them with a higher score', () => {
    const storage = createStorage();
    const first = {
      bestScore: 42, aircraftId: 'velocity', achievedAt: '2026-09-30T01:00:00.000Z',
    };
    expect(writeGuestRecord(first, storage)).toEqual(first);
    expect(JSON.parse(storage.getItem(GUEST_RECORD_STORAGE_KEY))).toEqual({ version: 1, ...first });

    const lower = {
      bestScore: 39, aircraftId: 'aegis', achievedAt: '2026-09-30T02:00:00.000Z',
    };
    expect(writeGuestRecord(lower, storage)).toEqual(first);
    expect(readGuestRecord(storage)).toEqual(first);
    expect(storage.setItem).toHaveBeenCalledOnce();
  });

  it.each([
    ['invalid JSON', '{'],
    ['unknown version', JSON.stringify({ version: 2, bestScore: 20, aircraftId: 'default', achievedAt: '2026-09-30T00:00:00.000Z' })],
    ['invalid score', JSON.stringify({ version: 1, bestScore: -1, aircraftId: 'default', achievedAt: '2026-09-30T00:00:00.000Z' })],
    ['unknown aircraft', JSON.stringify({ version: 1, bestScore: 20, aircraftId: 'admin', achievedAt: '2026-09-30T00:00:00.000Z' })],
    ['invalid timestamp', JSON.stringify({ version: 1, bestScore: 20, aircraftId: 'default', achievedAt: 'yesterday' })],
  ])('falls back safely for %s', (_caseName, value) => {
    expect(readGuestRecord(createStorage(value))).toEqual({
      bestScore: 0, aircraftId: 'default', achievedAt: null,
    });
  });

  it('does not throw when browser storage is blocked', () => {
    const storage = {
      getItem: () => { throw new Error('blocked'); },
      setItem: () => { throw new Error('blocked'); },
    };
    expect(readGuestRecord(storage)).toEqual({ bestScore: 0, aircraftId: 'default', achievedAt: null });
    expect(writeGuestRecord({
      bestScore: 5, aircraftId: 'default', achievedAt: '2026-09-30T00:00:00.000Z',
    }, storage)).toBeNull();
  });
});
