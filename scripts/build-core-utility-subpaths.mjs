#!/usr/bin/env node

// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import fs from 'node:fs';
import path from 'node:path';
import {build} from 'esbuild';

const packageDirectory = process.cwd();
const packageManifest = JSON.parse(fs.readFileSync(path.join(packageDirectory, 'package.json'), 'utf8'));
const utilityPrefixes = ['./scan', './arrow-geometry', './geoarrow', './wkt'];
const entryPoints = new Set();
for (const [specifier, target] of Object.entries(packageManifest.exports)) {
  if (!utilityPrefixes.some(prefix => specifier === prefix || specifier.startsWith(prefix + '/'))) continue;
  if (!target.import || !target.require || target.import.includes('*')) continue;
  const source = target.import.replace('./dist/', './src/').replace(/\.js$/, '.ts');
  if (!fs.existsSync(path.resolve(packageDirectory, source))) throw new Error(`Missing utility entrypoint: ${source}`);
  entryPoints.add(source);
}
await build({
  entryPoints: [...entryPoints],
  outbase: 'src',
  outdir: 'dist',
  outExtension: {'.js': '.cjs'},
  bundle: true,
  packages: 'external',
  format: 'cjs',
  platform: 'node',
  target: 'node22',
  sourcemap: true
});
