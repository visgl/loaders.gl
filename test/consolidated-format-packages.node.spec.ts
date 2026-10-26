// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {preProcessFile} from 'typescript';
import {build} from 'esbuild';
import {expect, test} from 'vitest';

const retiredPackages = ['las', 'pcd', 'ply', 'obj', 'gltf', 'wkt'];

test('format implementations have real grouped owners without forwarding packages', () => {
  for (const name of retiredPackages) expect(fs.existsSync(`modules/${name}`)).toBe(false);
  for (const owner of ['pointclouds', 'scene', 'draco']) {
    const manifest = JSON.parse(fs.readFileSync(`modules/${owner}/package.json`, 'utf8'));
    expect(manifest.dependencies || {}).not.toHaveProperty('@loaders.gl/tables');
  }
  const violations: string[] = [];
  for (const filename of listSources('modules')) {
    if (!filename.includes('/src/')) continue;
    const imports = preProcessFile(fs.readFileSync(filename, 'utf8'), true, true).importedFiles;
    if (
      imports.some(({fileName}) =>
        retiredPackages.some(
          name => fileName === `@loaders.gl/${name}` || fileName.startsWith(`@loaders.gl/${name}/`)
        )
      )
    )
      violations.push(filename);
  }
  expect(violations).toEqual([]);
});

test.each([
  'pointclouds',
  'scene'
])('%s metadata imports do not bundle format parsers', async owner => {
  const exports =
    owner === 'scene' ? 'GLTFLoader, OBJLoader, USDLoader' : 'LASLoader, PCDLoader, PLYLoader';
  const result = await build({
    stdin: {
      contents: `export {${exports}} from './modules/${owner}/src/index.ts'`,
      resolveDir: process.cwd()
    },
    bundle: true,
    packages: 'external',
    platform: 'browser',
    format: 'esm',
    splitting: true,
    outdir: 'metadata-check',
    write: false,
    metafile: true
  });
  const initial = Object.values(result.metafile!.outputs).filter(
    output => output.entryPoint === '<stdin>'
  );
  expect(initial).toHaveLength(1);
  expect(
    Object.keys(initial[0].inputs).filter(filename =>
      /\/(?:las|pcd|ply|obj|gltf|usd)-loader\.ts$/.test(filename)
    )
  ).toEqual([]);
});

test('the packages overview introduces every public workspace package', () => {
  const overview = fs.readFileSync('docs/packages.md', 'utf8');
  for (const name of fs.readdirSync('modules')) {
    const filename = `modules/${name}/package.json`;
    if (!fs.existsSync(filename)) continue;
    const manifest = JSON.parse(fs.readFileSync(filename, 'utf8'));
    if (!manifest.private) expect(overview, manifest.name).toContain(`./modules/${name}/README.md`);
  }
});

/** Lists TypeScript implementations without collecting package outputs or dependencies. */
function listSources(directory: string): string[] {
  return fs.readdirSync(directory, {withFileTypes: true}).flatMap(entry => {
    if (['dist', 'node_modules'].includes(entry.name)) return [];
    const filename = path.join(directory, entry.name);
    return entry.isDirectory()
      ? listSources(filename)
      : entry.name.endsWith('.ts')
        ? [filename]
        : [];
  });
}

test('every consolidated scene implementation remains covered by an owning coverage gate', () => {
  const thresholds = JSON.parse(fs.readFileSync('test/coverage-thresholds.json', 'utf8'));
  const scopes = [
    ...thresholds.packages['@loaders.gl/scene'].sourcePaths,
    ...Object.values(thresholds.formats).flatMap((format: any) =>
      format.owner === '@loaders.gl/scene' ? format.sourcePaths : []
    )
  ];
  expect(
    listSources('modules/scene/src').filter(
      filename => !scopes.some(scope => filename.startsWith(scope))
    )
  ).toEqual([]);
});

test.each([
  ['pointclouds', 'LASLoader'],
  ['pointclouds', 'PCDLoader'],
  ['pointclouds', 'PLYLoader'],
  ['scene', 'GLTFLoader'],
  ['scene', 'OBJLoader'],
  ['scene', 'USDLoader'],
  ['geospatial', 'WKTLoader'],
  ['geospatial', 'WKBLoader'],
  ['geospatial', 'TWKBLoader']
])('CommonJS %s %s uses the installed package version', (owner, loaderName) => {
  const require = createRequire(import.meta.url);
  const manifest = JSON.parse(fs.readFileSync(`modules/${owner}/package.json`, 'utf8'));
  const entry = require(`@loaders.gl/${owner}`);
  expect(entry[loaderName].version).toBe(manifest.version);
});

test('emitted bundled and unbundled ESM entrypoints keep valid index references', () => {
  const result = execFileSync(
    process.execPath,
    [
      '--input-type=module',
      '--eval',
      `await Promise.all(['@loaders.gl/services/bundled', '@loaders.gl/services/unbundled', '@loaders.gl/splats/bundled', '@loaders.gl/splats/unbundled'].map(specifier => import(specifier))); process.stdout.write('loaded');`
    ],
    {encoding: 'utf8'}
  );
  expect(result).toBe('loaded');
});
