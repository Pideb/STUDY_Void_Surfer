import { AIRCRAFT_CATALOG } from '../game/aircraft.js';

export const GUEST_RECORD_STORAGE_KEY = 'void-surfer:guest-record:v1';
const GUEST_RECORD_VERSION = 1;
const DEFAULT_RECORD = Object.freeze({ bestScore: 0, aircraftId: 'default', achievedAt: null });
const VALID_AIRCRAFT_IDS = new Set(AIRCRAFT_CATALOG.map(({ id }) => id));

function getStorage(storage) {
  if (storage !== undefined) return storage;
  try {
    return globalThis.localStorage;
  } catch {
    return null;
  }
}

function normalizeRecord(value) {
  if (!value || typeof value !== 'object' || value.version !== GUEST_RECORD_VERSION) return null;
  if (!Number.isSafeInteger(value.bestScore) || value.bestScore < 0) return null;
  if (!VALID_AIRCRAFT_IDS.has(value.aircraftId)) return null;
  if (typeof value.achievedAt !== 'string' || !Number.isFinite(Date.parse(value.achievedAt))) return null;
  return { bestScore: value.bestScore, aircraftId: value.aircraftId, achievedAt: value.achievedAt };
}

export function readGuestRecord(storage) {
  try {
    const raw = getStorage(storage)?.getItem(GUEST_RECORD_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_RECORD };
    return normalizeRecord(JSON.parse(raw)) ?? { ...DEFAULT_RECORD };
  } catch {
    return { ...DEFAULT_RECORD };
  }
}

export function writeGuestRecord(record, storage) {
  const destination = getStorage(storage);
  const nextRecord = normalizeRecord({ ...record, version: GUEST_RECORD_VERSION });
  if (!destination || !nextRecord) return null;
  try {
    const currentRecord = readGuestRecord(destination);
    if (nextRecord.bestScore <= currentRecord.bestScore) return currentRecord;
    destination.setItem(GUEST_RECORD_STORAGE_KEY, JSON.stringify({
      version: GUEST_RECORD_VERSION,
      ...nextRecord,
    }));
    return nextRecord;
  } catch {
    return null;
  }
}
