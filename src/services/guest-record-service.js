// Retirement of the old browser-only guest best; no new guest records are kept.
export const GUEST_RECORD_STORAGE_KEY='void-surfer:guest-record:v1';
export function clearLegacyGuestRecord(storage){
  try{const target=storage===undefined?globalThis.localStorage:storage;if(!target?.removeItem)return false;
    target.removeItem(GUEST_RECORD_STORAGE_KEY);return true;
  }catch{return false;}
}
