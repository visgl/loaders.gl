// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {readFile} from 'node:fs/promises';
import {build} from 'esbuild';

const manifest = JSON.parse(await readFile(new URL('./package.json', import.meta.url), 'utf8'));
for (const conditions of Object.values(manifest.exports)) {
  if (typeof conditions !== 'object' || !conditions.require) continue;
  await build({
    entryPoints: [conditions.import],
    outfile: conditions.require,
    bundle: true,
    format: 'cjs',
    platform: 'node',
    target: 'node22',
    packages: 'external',
    tsconfigRaw: {},
    sourcemap: true
  });
}
