// randomUUID requires a secure context; getRandomValues also works on LAN HTTP.
// These IDs include write nonces, so never substitute Math.random or a timestamp.
export function createRandomUUID(cryptoRef = globalThis.crypto) {
  if (typeof cryptoRef?.randomUUID === 'function') {
    try { return cryptoRef.randomUUID(); } catch { /* Try the other CSPRNG API. */ }
  }
  if (typeof cryptoRef?.getRandomValues === 'function') {
    try {
      const bytes = new Uint8Array(16);
      cryptoRef.getRandomValues(bytes);
      bytes[6] = (bytes[6] & 0x0f) | 0x40;
      bytes[8] = (bytes[8] & 0x3f) | 0x80;
      const hex = [...bytes].map(value => value.toString(16).padStart(2, '0')).join('');
      return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
    } catch { /* Callers can disable optional analytics when crypto is absent. */ }
  }
  throw Object.assign(new Error('Secure random source unavailable'), { code: 'CRYPTO_UNAVAILABLE' });
}
