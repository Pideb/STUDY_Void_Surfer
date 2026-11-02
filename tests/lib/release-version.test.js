import {describe,it,expect} from 'vitest';
import {getDisplayVersion,getGameVersion} from '../../src/lib/release-version.js';
describe('runtime version labels',()=>{
 const registry={currentVersion:'0.01-b',developmentVersion:'0.2',releases:[{version:'0.01-b',displayVersion:'0.1b'}]};
 it('distinguishes local source version from deployed history without modifying either',()=>{expect(getGameVersion(registry,{development:true})).toBe('0.2');expect(getGameVersion(registry)).toBe('0.1b');expect(getDisplayVersion('0.01-b',registry)).toBe('0.1b');expect(registry.currentVersion).toBe('0.01-b');});
 it('uses prepared release labels in production and handles absent development metadata',()=>{expect(getGameVersion({...registry,currentVersion:'0.2'})).toBe('0.2');expect(getGameVersion({...registry,developmentVersion:undefined},{development:true})).toBe('0.1b');});
});
