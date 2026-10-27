// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {build} from 'esbuild';
import {expect, test} from 'vitest';

const utilityNames = ['scan', 'arrow-geometry', 'geoarrow', 'wkt'];

test('core utility implementations have no format-package or loader dependencies', () => {
  const violations: string[] = [];
  for (const utilityName of utilityNames) {
    for (const filename of listSourceFiles(path.resolve('modules/core/src', utilityName))) {
      const source = fs.readFileSync(filename, 'utf8');
      if (/['"]@loaders\.gl\/(?!core(?:\/|['"]))/.test(source)) violations.push(filename);
      if (/-(?:loader|writer)(?:-types|-with-parser)?\.ts$/.test(filename))
        violations.push(filename);
    }
  }
  expect(violations).toEqual([]);
  for (const name of ['scan', 'arrow-geometry', 'geoarrow']) {
    expect(fs.existsSync(path.resolve('modules', name))).toBe(false);
  }
});

test('core root imports do not include optional geometry or scan implementations', async () => {
  const result = await build({
    stdin: {
      contents: "export {parse, load} from './modules/core/src/index.ts';",
      sourcefile: 'core-root-boundary.ts',
      resolveDir: process.cwd()
    },
    bundle: true,
    platform: 'browser',
    format: 'esm',
    packages: 'external',
    write: false,
    metafile: true
  });
  const optionalInputs = Object.keys(result.metafile!.inputs).filter(filename =>
    utilityNames.some(name => filename.startsWith(`modules/core/src/${name}/`))
  );
  expect(optionalInputs).toEqual([]);
});

test('every explicit core utility export has emitted types, ESM, and CommonJS targets', () => {
  const manifest = JSON.parse(fs.readFileSync('modules/core/package.json', 'utf8'));
  const missing: string[] = [];
  for (const [specifier, target] of Object.entries(manifest.exports)) {
    if (
      !utilityNames.some(name => specifier === `./${name}/` || specifier.startsWith(`./${name}/`))
    )
      continue;
    for (const condition of ['types', 'import', 'require']) {
      const filename = (target as Record<string, string>)[condition];
      if (!filename || !fs.existsSync(path.resolve('modules/core', filename)))
        missing.push(`${specifier}: ${condition}`);
    }
  }
  expect(missing).toEqual([]);
});

/** Lists utility source files without collecting generated output or dependencies. */
function listSourceFiles(directory: string): string[] {
  return fs.readdirSync(directory, {withFileTypes: true}).flatMap(entry => {
    const filename = path.join(directory, entry.name);
    return entry.isDirectory()
      ? listSourceFiles(filename)
      : entry.name.endsWith('.ts')
        ? [filename]
        : [];
  });
}

test('CommonJS scan entrypoints share backend registrations and public function identities', async () => {
  const require = createRequire(import.meta.url);
  const scan = require('@loaders.gl/core/scan');
  const engine = require('@loaders.gl/core/scan/scan-engine');
  expect(scan.registerScanBackend).toBe(engine.registerScanBackend);
  expect(scan.createScanEngine).toBe(engine.createScanEngine);
  const query = () => ({shape: 'arrow-table'});
  const explain = () => ({backend: 'test-shared-registry'});
  engine.registerScanBackend('test-shared-registry', () => ({
    name: 'test-shared-registry',
    query,
    explain
  }));
  const registeredEngine = await scan.createScanEngine({backend: 'test-shared-registry'});
  expect(registeredEngine.name).toBe('test-shared-registry');
  expect(registeredEngine.query()).toEqual({shape: 'arrow-table'});
  const geometry = require('@loaders.gl/core/arrow-geometry');
  const geoarrow = require('@loaders.gl/core/geoarrow');
  expect(geoarrow.GeoArrowBuilder).toBe(geometry.GeoArrowBuilder);
});
