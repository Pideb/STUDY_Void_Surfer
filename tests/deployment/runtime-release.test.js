import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { describe, it, expect } from 'vitest';

describe('runtime release metadata', () => {
  it('preserves version labels while excluding mutable deployment evidence', async () => {
    const registry = { currentVersion: '0.2', developmentVersion: '0.2', versionBase: '0.2', releases: [
      { version: '0.01-b', displayVersion: '0.1b' },
      { version: '0.2', status: 'validated-pending-deployment', sourceContext: { files: 'private audit' } },
    ] };
    const deployed = structuredClone(registry);
    Object.assign(deployed.releases[1], { status: 'deployed-verified', deployment: { headSha: 'new head', bundleSha256: 'new evidence' } });
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'void-runtime-release-'));
    try {
      const jsonFile = path.join(root, 'releases.json');
      await fs.writeFile(path.join(root, 'entry.js'), "import release from './releases.json'; console.log(release);");
      const compile = async value => {
        await fs.writeFile(jsonFile, JSON.stringify(value));
        return execFileSync(process.execPath, ['--input-type=module', '-e', `
          import {build} from 'vite';
          import {runtimeReleasePlugin} from './vite.config.mjs';
          const root=process.argv[1],file=process.argv[2];
          const result=await build({configFile:false,root,logLevel:'silent',plugins:[runtimeReleasePlugin(file)],build:{write:false,minify:true,rollupOptions:{input:root+'/entry.js'}}});
          process.stdout.write(result.output.find(item=>item.type==='chunk').code);
        `, root, jsonFile], { cwd: process.cwd(), encoding: 'utf8' });
      };
      const before = await compile(registry);
      expect(await compile(deployed)).toBe(before);
      expect(before).toContain('0.2');
      expect(before).toContain('0.1b');
      expect(before).not.toMatch(/private audit|headSha|bundleSha256|sourceContext|deployed-verified/);
    } finally {
      await fs.rm(root, { recursive: true, force: true });
    }
  });
});
