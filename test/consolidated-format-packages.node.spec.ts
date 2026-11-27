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

const retiredPackages = ['las', 'pcd', 'ply', 'obj', 'gltf', 'wkt', 'draco', 'textures', 'video'];

test('format implementations have real grouped owners without forwarding packages', () => {
  for (const name of retiredPackages) expect(fs.existsSync(`modules/${name}`)).toBe(false);
  for (const owner of ['pointclouds', 'scene']) {
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
  const formats = owner === 'scene' ? ['gltf', 'obj', 'usd'] : ['las', 'pcd', 'ply'];
  const manifest = JSON.parse(fs.readFileSync(`modules/${owner}/package.json`, 'utf8'));
  const result = await build({
    stdin: {
      contents: formats
        .map(
          format =>
            `export * from './modules/${owner}/${manifest.exports['./' + format].import.replace('dist/', 'src/').replace(/\.js$/, '.ts')}'`
        )
        .join('\n'),
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

test('the Modules page introduces every public workspace package', () => {
  const overview = fs.readFileSync('docs/modules/README.md', 'utf8');
  for (const name of fs.readdirSync('modules')) {
    const filename = `modules/${name}/package.json`;
    if (!fs.existsSync(filename)) continue;
    const manifest = JSON.parse(fs.readFileSync(filename, 'utf8'));
    if (!manifest.private) expect(overview, manifest.name).toContain(`./${name}/README.md`);
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
  const sceneExports = JSON.parse(fs.readFileSync('modules/scene/package.json', 'utf8')).exports;
  const flatFacadePaths = new Set(
    Object.entries(sceneExports)
      .filter(([exportPath, conditions]: [string, any]) => {
        const importTarget = typeof conditions === 'string' ? conditions : conditions.import;
        return (
          /^\.\/[^/]+$/.test(exportPath) &&
          /(?:loader|writer|source)(?:-types)?$/.test(exportPath.slice(2)) &&
          importTarget?.startsWith('./dist/')
        );
      })
      .map(([exportPath]: [string, any]) => `modules/scene/src/${exportPath.slice(2)}.ts`)
  );
  const scopes = [
    ...thresholds.packages['@loaders.gl/scene'].sourcePaths,
    ...Object.values(thresholds.formats).flatMap((format: any) =>
      format.owner === '@loaders.gl/scene' ? format.sourcePaths : []
    )
  ];
  expect(
    listSources('modules/scene/src').filter(
      filename =>
        !scopes.some(scope => filename.startsWith(scope)) && !flatFacadePaths.has(filename)
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
  const entry = require(
    `@loaders.gl/${owner}/${loaderName === 'TWKBLoader' ? 'wkb' : loaderName.replace(/Loader$/, '').toLowerCase()}`
  );
  expect(entry[loaderName].version).toBe(manifest.version);
});

test.each([
  ['module', "import {resolveCesiumIonTileset} from '@loaders.gl/tiles-3d/3d-tiles';"],
  [
    'commonjs',
    "const {resolveCesiumIonTileset} = require('@loaders.gl/tiles-3d/3d-tiles');"
  ]
])('the 3D Tiles package exports the Cesium ion resolver in %s', (moduleType, load) => {
  const result = execFileSync(
    process.execPath,
    [
      `--input-type=${moduleType}`,
      '--eval',
      `${load} process.stdout.write(typeof resolveCesiumIonTileset);`
    ],
    {encoding: 'utf8'}
  );
  expect(result).toBe('function');
});

test('emitted services and splats ESM entrypoints keep valid index references', () => {
  const result = execFileSync(
    process.execPath,
    [
      '--input-type=module',
      '--eval',
      `await Promise.all(['@loaders.gl/services/api', '@loaders.gl/services', '@loaders.gl/splats'].map(specifier => import(specifier))); process.stdout.write('loaded');`
    ],
    {encoding: 'utf8'}
  );
  expect(result).toBe('loaded');
});

test('the aggregate splats bundle exposes the four metadata loaders', async () => {
  const {metafile} = await build({
    entryPoints: ['modules/splats/src/bundled.ts'],
    bundle: true,
    format: 'esm',
    metafile: true,
    packages: 'external',
    write: false
  });
  expect(Object.values(metafile.outputs)[0].exports.sort()).toEqual([
    'KSPLATLoader',
    'RADLoader',
    'SPLATLoader',
    'SPZLoader'
  ]);
  const entry = metafile.inputs['modules/splats/src/bundled.ts'];
  expect(entry.imports.map(dependency => path.basename(dependency.path)).sort()).toEqual([
    'ksplat-loader-types.ts',
    'rad-loader-types.ts',
    'splat-loader-types.ts',
    'spz-loader-types.ts'
  ]);
});
