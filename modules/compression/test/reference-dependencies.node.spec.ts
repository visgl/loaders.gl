// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {readFileSync} from 'node:fs';
import {expect, test} from 'vitest';

test('reference codecs are opt-in peers, with development copies for conformance tests', () => {
  const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  const referencePackages = [
    'brotli',
    'fzstd',
    'hysnappy',
    'lz4js',
    'pako',
    'snappyjs',
    'zstd-codec'
  ];
  expect(manifest.optionalDependencies).toBeUndefined();
  expect(manifest.dependencies['compress-utils']).toBeTruthy();
  for (const packageName of referencePackages) {
    expect(manifest.dependencies[packageName]).toBeUndefined();
    expect(manifest.peerDependenciesMeta[packageName]).toEqual({optional: true});
    expect(manifest.peerDependencies[packageName]).toBe(manifest.devDependencies[packageName]);
  }
});
