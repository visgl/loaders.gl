#!/usr/bin/env node

// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import fs from 'node:fs';
import path from 'node:path';
import {build} from 'esbuild';

const packageManifest = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const sourceDirectories = [path.resolve('src')];
// Emit each format module once. Independent bundles would duplicate module-local registries
// and class identities when applications mix root and focused CommonJS entrypoints.
await build({
  entryPoints: sourceDirectories.flatMap(listSourceFiles),
  outbase: 'src',
  outdir: 'dist',
  outExtension: {'.js': '.cjs'},
  bundle: true,
  packages: 'external',
  format: 'cjs',
  platform: 'node',
  target: 'node22',
  sourcemap: true,
  define: {__VERSION__: JSON.stringify(packageManifest.version)},
  plugins: [{
    name: 'shared-format-modules',
    setup(builder) {
      // Resolve package self-imports at runtime too; tsconfig aliases would otherwise inline them.
      builder.onResolve({filter: /^[^./]/}, arguments_ => {
        if (arguments_.kind !== 'entry-point') return {path: arguments_.path, external: true};
      });
      builder.onResolve({filter: /^\./}, arguments_ => {
        if (arguments_.kind === 'entry-point') return;
        const sourcePath = path.resolve(arguments_.resolveDir, arguments_.path);
        const resolvedPath = [sourcePath, `${sourcePath}.ts`, path.join(sourcePath, 'index.ts')]
          .find(candidate => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
        if (!resolvedPath || !sourceDirectories.some(directory => resolvedPath.startsWith(`${directory}${path.sep}`))) return;
        const relativePath = path.relative(path.dirname(arguments_.importer), resolvedPath).replace(/\.ts$/, '.cjs').split(path.sep).join('/');
        return {path: relativePath.startsWith('.') ? relativePath : `./${relativePath}`, external: true};
      });
    }
  }]
});

/** Lists format implementations so private dependencies share the same CommonJS module instance. */
function listSourceFiles(directory) {
  return fs.readdirSync(directory, {withFileTypes: true}).flatMap(entry => {
    const filename = path.join(directory, entry.name);
    return entry.isDirectory() ? listSourceFiles(filename) : entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts') ? [filename] : [];
  });
}
