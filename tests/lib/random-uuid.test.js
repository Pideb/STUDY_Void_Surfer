import {describe,it,expect,vi} from 'vitest';
import {createRandomUUID} from '../../src/lib/random-uuid.js';
describe('secure UUID on local-network HTTP',()=>{
 it('uses native randomUUID with its crypto receiver when available',()=>{const uuid='12345678-1234-4234-8234-123456789abc',crypto={randomUUID(){expect(this).toBe(crypto);return uuid;},getRandomValues:vi.fn()};expect(createRandomUUID(crypto)).toBe(uuid);expect(crypto.getRandomValues).not.toHaveBeenCalled();});
 it('uses sixteen cryptographic bytes and sets UUIDv4 version and variant',()=>{const crypto={getRandomValues:vi.fn(function(bytes){expect(this).toBe(crypto);expect(bytes).toBeInstanceOf(Uint8Array);expect(bytes.length).toBe(16);bytes.fill(255);return bytes;})};expect(createRandomUUID(crypto)).toBe('ffffffff-ffff-4fff-bfff-ffffffffffff');expect(crypto.getRandomValues).toHaveBeenCalledOnce();});
 it('falls back from an unusable native method to the cryptographic byte source',()=>{const crypto={randomUUID(){throw Error('Unavailable');},getRandomValues(bytes){bytes.fill(0);return bytes;}};expect(createRandomUUID(crypto)).toBe('00000000-0000-4000-8000-000000000000');});
 it.each([null,{}, {getRandomValues(){throw Error('Denied');}}])('fails explicitly rather than creating a weak nonce (%s)',crypto=>{const weak=vi.spyOn(Math,'random');try{expect(()=>createRandomUUID(crypto)).toThrow(expect.objectContaining({code:'CRYPTO_UNAVAILABLE'}));expect(weak).not.toHaveBeenCalled();}finally{weak.mockRestore();}});
});
