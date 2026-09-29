// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {execFileSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {build, type Metafile} from 'esbuild';
import {beforeAll, expect, test} from 'vitest';

const REPOSITORY_ROOT = fileURLToPath(new URL('../../../', import.meta.url));

/** Initial, statically reachable JavaScript in a consumer bundle. */
type BundleSummary = {
  /** Minified bytes downloaded before following any dynamic imports. */
  initialBytes: number;
  /** Published module files contributing bytes to the initial bundle. */
  initialInputs: string[];
};

let lazyRegistry: BundleSummary;
let bundledRegistry: BundleSummary;
let bundledFeature: BundleSummary;
let credentials: BundleSummary;

beforeAll(async () => {
  [lazyRegistry, bundledRegistry, bundledFeature, credentials] = await Promise.all([
    bundleImport('@loaders.gl/arcgis', 'ARCGIS_LOADERS'),
    bundleImport('@loaders.gl/arcgis/bundled', 'ARCGIS_LOADERS'),
    bundleImport('@loaders.gl/arcgis/bundled', 'ArcGISFeatureServerSourceLoader'),
    bundleImport('@loaders.gl/arcgis/authentication', 'createArcGISCredential')
  ]);
});

test('published root defers service implementations and their heavy dependencies', () => {
  expect(lazyRegistry.initialInputs.some(input => input.includes('arcgis/dist/'))).toBe(true);
  expect(lazyRegistry.initialInputs.some(input => /source-loader\.js$/.test(input))).toBe(false);
  expect(
    lazyRegistry.initialInputs.some(input =>
      /modules\/(gis|i3s|mvt|lerc|loader-utils|worker-utils)\//.test(input)
    )
  ).toBe(false);
  expect(lazyRegistry.initialInputs.some(input => input.includes('/src/'))).toBe(false);
  expect(lazyRegistry.initialBytes).toBeLessThan(bundledRegistry.initialBytes / 10);
});

test('named synchronous imports tree-shake unrelated ArcGIS clients', () => {
  expect(
    bundledFeature.initialInputs.some(input =>
      input.endsWith('arcgis-feature-server-source-loader.js')
    )
  ).toBe(true);
  expect(
    bundledFeature.initialInputs.some(input =>
      /arcgis-(scene-server|vector-tile-server|image-server|image-tile|map-tile)-source-loader\.js$/.test(
        input
      )
    )
  ).toBe(false);
  expect(
    bundledRegistry.initialInputs.some(input =>
      input.endsWith('arcgis-scene-server-source-loader.js')
    )
  ).toBe(true);
});

test('credential-only imports do not retain service implementations', () => {
  expect(credentials.initialInputs.some(input => /arcgis\/dist\/arcgis\//.test(input))).toBe(false);
});

test('built package exports resolve in Node without source aliases', () => {
  const output = execFileSync(
    process.execPath,
    [
      '--input-type=module',
      '-e',
      `
    import assert from 'node:assert/strict';
    import {createRequire} from 'node:module';
    import {load, createDataSource} from '@loaders.gl/core';
    import * as root from '@loaders.gl/arcgis';
    import * as bundled from '@loaders.gl/arcgis/bundled';
    const serviceUrl = 'https://example.com/arcgis/rest/services/Test/SceneServer/layers/0';
    for (const loader of root.ARCGIS_LOADERS) {
      const runtime = await loader.preload();
      assert.equal(runtime, bundled.getArcGISLoader(loader.id));
      const asynchronousSource = await load(serviceUrl, loader);
      const synchronousSource = createDataSource(serviceUrl, [runtime], {});
      assert.equal(asynchronousSource.constructor, synchronousSource.constructor);
    }
    const commonJs = createRequire(import.meta.url)('@loaders.gl/arcgis');
    assert.equal(commonJs.ARCGIS_LOADERS.length, 6);
    assert.equal(typeof commonJs.ArcGISFeatureServerSourceLoader.preload, 'function');
    console.log('published entrypoints passed');
  `
    ],
    {cwd: REPOSITORY_ROOT, encoding: 'utf8'}
  );
  expect(output).toContain('published entrypoints passed');
});

/** Bundles installed ESM exports with source aliases explicitly disabled. */
async function bundleImport(packageName: string, exportName: string): Promise<BundleSummary> {
  const result = await build({
    absWorkingDir: REPOSITORY_ROOT,
    stdin: {
      contents: `import {${exportName}} from '${packageName}'; globalThis.example = ${exportName};`,
      resolveDir: REPOSITORY_ROOT,
      sourcefile: 'entry.js'
    },
    bundle: true,
    format: 'esm',
    platform: 'browser',
    splitting: true,
    minify: true,
    treeShaking: true,
    write: false,
    metafile: true,
    outdir: path.join(tmpdir(), 'loaders-arcgis-package-test'),
    tsconfigRaw: {compilerOptions: {}},
    // LERC's Node-only createRequire import is handled by the consuming browser bundler.
    // Keep that existing integration separate from measuring ArcGIS's dependency boundaries.
    external: ['module'],
    logLevel: 'silent'
  });
  return summarizeInitialBundle(result.metafile);
}

/** Follows static chunks only; deferred chunks do not count toward initial download. */
function summarizeInitialBundle(metafile: Metafile): BundleSummary {
  const outputs = metafile.outputs;
  const entry = Object.keys(outputs).find(filename => outputs[filename].entryPoint === 'entry.js')!;
  const initialOutputs = new Set<string>();
  const pendingOutputs = [entry];
  while (pendingOutputs.length) {
    const filename = pendingOutputs.pop()!;
    if (initialOutputs.has(filename)) continue;
    initialOutputs.add(filename);
    for (const dependency of outputs[filename].imports) {
      if (dependency.external || dependency.kind === 'dynamic-import') continue;
      const target = Object.keys(outputs).find(
        candidate =>
          path.resolve(REPOSITORY_ROOT, candidate) ===
          path.resolve(REPOSITORY_ROOT, dependency.path)
      );
      if (!target) throw new Error(`Missing static bundle chunk: ${dependency.path}`);
      pendingOutputs.push(target);
    }
  }
  return {
    initialBytes: [...initialOutputs].reduce(
      (total, filename) => total + outputs[filename].bytes,
      0
    ),
    initialInputs: [
      ...new Set(
        [...initialOutputs].flatMap(filename =>
          Object.entries(outputs[filename].inputs)
            .filter(([, contribution]) => contribution.bytesInOutput > 0)
            .map(([input]) => input)
        )
      )
    ]
  };
}
