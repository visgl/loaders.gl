// SPDX-License-Identifier: MIT

import {execFileSync} from 'node:child_process';
import {existsSync, readFileSync} from 'node:fs';
import {expect, test} from 'vitest';

test.each([
  'esm',
  'commonjs'
])('scene Draco %s entry points preserve the metadata boundary', format => {
  const output = execFileSync(
    process.execPath,
    [
      '--input-type=module',
      '-e',
      `
    import assert from 'node:assert/strict';
    import {createRequire} from 'node:module';
    const require = createRequire(import.meta.url);
    const scene = ${format === 'esm' ? "await import('@loaders.gl/scene')" : "require('@loaders.gl/scene')"};
    assert.equal(scene.DracoLoader.module, 'scene');
    assert.equal(scene.DracoLoader.parse, undefined);
    assert.equal(scene.DracoLoaderWithParser, undefined);
    assert.equal(scene.DracoWriter, undefined);
    assert.deepEqual(Object.keys(require.cache).filter(filename => filename.includes('/scene/dist/draco/lib/') && ['draco-builder.cjs', 'draco-parser.cjs', 'draco-module-loader.cjs'].some(name => filename.endsWith(name))), []);
    assert.equal(typeof (await scene.DracoLoader.preload('', {draco: {backend: 'wasm'}})).parse, 'function');
    const parser = ${format === 'esm' ? "await import('@loaders.gl/scene/draco-loader')" : "require('@loaders.gl/scene/draco-loader')"};
    assert.equal(typeof parser.DracoLoaderWithParser.parse, 'function');
    assert.equal(require('@loaders.gl/scene/draco-writer').DracoWriterWorker.module, 'scene');
    assert.ok(import.meta.resolve('@loaders.gl/scene/draco-worker.js'));
    assert.ok(require.resolve('@loaders.gl/scene/draco-writer-worker-node.cjs'));
    console.log('verified');
  `
    ],
    {encoding: 'utf8'}
  );
  expect(output.trim()).toBe('verified');
});

test('scene does not depend on the retired Draco package', () => {
  const manifest = JSON.parse(readFileSync('modules/scene/package.json', 'utf8'));
  expect(manifest.dependencies).not.toHaveProperty('@loaders.gl/draco');
  expect(manifest.optionalDependencies.draco3d).toBe('1.5.7');
});

test('Draco Node test worker URLs follow the implementation into scene', async () => {
  const {DracoLoader} = await import('@loaders.gl/scene');
  const {DracoWriterWorker} = await import('@loaders.gl/scene/draco-writer');
  const {getWorkerURL} = await import('@loaders.gl/core/worker-utils');
  for (const worker of [DracoLoader, DracoWriterWorker]) {
    const workerUrl = getWorkerURL(worker, {_workerType: 'test'});
    expect(workerUrl).toContain('modules/scene/src/draco/workers/');
    expect(existsSync(workerUrl!)).toBe(true);
  }
});

test('scene root excludes Draco parsers, encoders, and runtime initialization', async () => {
  const {build} = await import('esbuild');
  const result = await build({
    entryPoints: ['modules/scene/src/index.ts'],
    bundle: true,
    packages: 'external',
    tsconfigRaw: {},
    platform: 'browser',
    format: 'esm',
    write: false,
    metafile: true
  });
  expect(
    Object.keys(result.metafile!.inputs).filter(filename =>
      /\/draco\/lib\/(draco-builder|draco-parser|draco-module-loader)|\/draco\/draco-writer/.test(
        filename
      )
    )
  ).toEqual([]);
});
