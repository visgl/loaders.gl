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

test.skipIf(Number(process.versions.node.split('.')[0]) < 24)(
  'compress-utils supports Node source-phase WASM loading',
  async () => {
    const {execFileSync} = await import('node:child_process');
    const script = `
      import {GZipCompressUtilsCompressor} from '@loaders.gl/compression/gzip-compressor-compress-utils';
      import {GZipCompressUtilsDecompressor} from '@loaders.gl/compression/gzip-decompressor-compress-utils';
      const input = new TextEncoder().encode('source-phase WASM').buffer;
      const output = await new GZipCompressUtilsDecompressor().decompress(await new GZipCompressUtilsCompressor().compress(input));
      if (new TextDecoder().decode(output) !== 'source-phase WASM') throw new Error('Round trip failed');
    `;
    expect(() =>
      execFileSync(
        process.execPath,
        ['--conditions=compress-utils-wasm-source', '--input-type=module', '-e', script],
        {
          cwd: process.cwd(),
          stdio: 'pipe'
        }
      )
    ).not.toThrow();
  }
);
