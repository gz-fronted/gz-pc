import { readFile } from 'node:fs/promises';

import { describe, expect, it } from 'vitest';

interface ConditionalExport {
  types: string;
  default: string;
}

interface ExportTarget {
  import: ConditionalExport;
  require: ConditionalExport;
}

interface PackageManifest {
  name: string;
  sideEffects: boolean;
  exports: Record<string, ExportTarget | string>;
  dependencies: Record<string, string>;
  peerDependencies: Record<string, string>;
  devDependencies: Record<string, string>;
}

describe('package exports', () => {
  it('defines independent fetch, hooks and utils entry points without a root aggregate', async () => {
    const contents = await readFile(
      new URL('../../package.json', import.meta.url),
      'utf8',
    );
    const parsed: unknown = JSON.parse(contents);
    const manifest = parsed as PackageManifest;

    expect(manifest.name).toBe('@lishenchan/gz-pc');
    expect(manifest.sideEffects).toBe(false);

    expect(manifest.exports['.']).toBeUndefined();

    for (const subpath of ['./fetch', './hooks', './utils']) {
      const target = manifest.exports[subpath];
      expect(typeof target).toBe('object');
      if (typeof target === 'string' || target === undefined) {
        throw new TypeError(`Invalid export target: ${subpath}`);
      }
      expect(target.import.types.endsWith('.d.ts')).toBe(true);
      expect(target.import.default.endsWith('.js')).toBe(true);
      expect(target.require.types.endsWith('.d.cts')).toBe(true);
      expect(target.require.default.endsWith('.cjs')).toBe(true);
    }
  });

  it('installs runtime libraries while keeping host singletons as peers', async () => {
    const contents = await readFile(
      new URL('../../package.json', import.meta.url),
      'utf8',
    );
    const parsed: unknown = JSON.parse(contents);
    const manifest = parsed as PackageManifest;

    expect(manifest.dependencies).toHaveProperty('axios');
    expect(manifest.dependencies).toHaveProperty('ahooks');
    expect(manifest.peerDependencies).not.toHaveProperty('axios');
    expect(manifest.peerDependencies).not.toHaveProperty('ahooks');
    expect(manifest.peerDependencies).toHaveProperty('react');
    expect(manifest.peerDependencies).toHaveProperty('@chenhui996/gg-ui');
    expect(manifest.devDependencies).toHaveProperty('react');
    expect(manifest.devDependencies).toHaveProperty('@chenhui996/gg-ui');
  });
});
