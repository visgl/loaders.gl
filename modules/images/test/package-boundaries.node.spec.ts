// SPDX-License-Identifier: MIT

import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {expect, test} from 'vitest';

// Test the installed package rather than only the source aliases used by Vitest.
test.each([
  'esm',
  'commonjs'
])('installed %s image entrypoints keep metadata separate from parsers', format => {
  const result = execFileSync(
    process.execPath,
    [
      '--input-type=module',
      '-e',
      `
    import assert from 'node:assert/strict';
    import {createRequire} from 'node:module';
    const require = createRequire(import.meta.url);
    const metadata = ${format === 'esm' ? "await import('@loaders.gl/images')" : "require('@loaders.gl/images')"};
    const packageVersion = require('./modules/images/package.json').version;
    const parser = ${format === 'esm' ? "await import('@loaders.gl/images/image-loader')" : "require('@loaders.gl/images/image-loader')"};
    for (const name of ['ImageLoader', 'LegacyImageLoader', 'BasisLoader', 'TextureLoader', 'VideoLoader']) {
      assert.equal(metadata[name].module, 'images');
      assert.equal(metadata[name].version, packageVersion);
      assert.equal(metadata[name].parse, undefined);
      assert.equal(typeof metadata[name].preload, 'function');
    }
    assert.equal(metadata.ImageBitmapLoader, undefined);
    assert.equal(metadata.ImageLoaderWithParser, undefined);
    assert.equal(typeof parser.ImageLoaderWithParser.parse, 'function');
    assert.equal(parser.ImageLoader, undefined);
    const implementation = await metadata.ImageLoader.preload();
    assert.equal(typeof implementation.parse, 'function');
    console.log('Image package boundaries verified');
  `
    ],
    {encoding: 'utf8'}
  );
  expect(result.trim()).toBe('Image package boundaries verified');
});

test('the image root does not statically import parsers, schema validators, video, or codecs', async () => {
  const {build} = await import('esbuild');
  const result = await build({
    entryPoints: ['modules/images/src/index.ts'],
    tsconfigRaw: {compilerOptions: {}},
    bundle: true,
    packages: 'external',
    plugins: [
      {
        name: 'preserve-lazy-parser-imports',
        /** Keep async parser upgrades outside the static metadata import graph. */
        setup(builder) {
          builder.onResolve({filter: /^@loaders\.gl\/images\//}, argumentsValue =>
            argumentsValue.kind === 'dynamic-import'
              ? {path: argumentsValue.path, external: true}
              : undefined
          );
        }
      }
    ],
    platform: 'browser',
    format: 'esm',
    write: false,
    metafile: true
  });
  const implementationImports = Object.keys(result.metafile!.inputs).filter(filename =>
    /\/lib\/parsers\/|\/lib\/composite-image\/parse-|composite-image-manifest-schema\.ts|\/lib\/gifshot\/|\/libs\//.test(
      filename
    )
  );
  expect(implementationImports).toEqual([]);
  const publishedSourceMap = JSON.parse(readFileSync('modules/images/dist/index.cjs.map', 'utf8'));
  expect(
    publishedSourceMap.sources.filter((filename: string) =>
      /\/lib\/parsers\/|\/lib\/composite-image\/parse-|composite-image-manifest-schema\.ts|\/lib\/gifshot\/|\/libs\//.test(
        filename
      )
    )
  ).toEqual([]);
});
