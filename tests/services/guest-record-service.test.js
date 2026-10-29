import {describe,it,expect,vi} from 'vitest';
import {GUEST_RECORD_STORAGE_KEY,clearLegacyGuestRecord} from '../../src/services/guest-record-service.js';
describe('retired guest record cleanup',()=>{
  it('removes only the old dedicated record without reading or writing a replacement',()=>{
    const values=new Map([[GUEST_RECORD_STORAGE_KEY,'old-best'],['session','keep'],['settings','keep']]);
    const storage={getItem:vi.fn(),setItem:vi.fn(),removeItem:vi.fn(key=>values.delete(key)),clear:vi.fn()};
    expect(clearLegacyGuestRecord(storage)).toBe(true);expect(storage.removeItem).toHaveBeenCalledExactlyOnceWith(GUEST_RECORD_STORAGE_KEY);
    expect([...values]).toEqual([['session','keep'],['settings','keep']]);expect(storage.getItem).not.toHaveBeenCalled();expect(storage.setItem).not.toHaveBeenCalled();expect(storage.clear).not.toHaveBeenCalled();
  });
  it.each([null,{}, {removeItem(){throw Error('blocked');}}])('tolerates unavailable storage',storage=>expect(clearLegacyGuestRecord(storage)).toBe(false));
});
