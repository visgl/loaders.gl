// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {build} from 'esbuild';
import {expect, test} from 'vitest';

test('compression root keeps JavaScript codecs out of the initial bundle', async () => {
  const result = await build({
    stdin: {
      contents:
        "import * as compression from './modules/compression/src/index.ts'; console.log(compression);",
      resolveDir: process.cwd()
    },
    bundle: true,
    splitting: true,
    format: 'esm',
    platform: 'browser',
    outdir: '/tmp/loaders-compression-bundle-test',
    write: false,
    metafile: true,
    external: ['zlib', 'util', 'lzo'],
    define: {__VERSION__: '"test"'}
  });
  const outputs = result.metafile!.outputs;
  const entryPath = Object.keys(outputs).find(path => outputs[path].entryPoint === '<stdin>')!;
  const initialPaths = new Set<string>();
  const pendingPaths = [entryPath];
  while (pendingPaths.length) {
    const outputPath = pendingPaths.pop()!;
    if (initialPaths.has(outputPath)) continue;
    initialPaths.add(outputPath);
    for (const dependency of outputs[outputPath].imports) {
      if (dependency.kind !== 'dynamic-import' && outputs[dependency.path]) {
        pendingPaths.push(dependency.path);
      }
    }
  }
  const initialInputs = [...initialPaths].flatMap(path => Object.keys(outputs[path].inputs));
  expect(initialInputs.some(path => /fflate|fzstd|snappyjs|lz4js|brotli\/dec/.test(path))).toBe(
    false
  );
  // Check that codecs were split into deferred chunks rather than omitted from the build.
  expect(Object.keys(result.metafile!.inputs).some(path => path.includes('/fflate/'))).toBe(true);
  expect(Object.keys(outputs).length).toBeGreaterThan(initialPaths.size);
});
