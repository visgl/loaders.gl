// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {build} from 'esbuild';
import {readFile} from 'node:fs/promises';
import {expect, test} from 'vitest';

test('consumer browser bundles include the meshopt decoder without resolving its npm package', async () => {
  const result = await build({
    stdin: {
      contents:
        "import {GLTFLoader} from '@loaders.gl/scene/gltf'; export const loader = await GLTFLoader.preload();",
      resolveDir: process.cwd()
    },
    tsconfigRaw: {compilerOptions: {}},
    bundle: true,
    platform: 'browser',
    format: 'esm',
    write: false,
    metafile: true,
    plugins: [
      {
        name: 'omit-meshoptimizer',
        setup(buildContext) {
          buildContext.onResolve({filter: /^meshoptimizer(?:\/|$)/}, () => ({
            errors: [{text: 'meshoptimizer is unavailable in this consumer installation'}]
          }));
        }
      }
    ]
  });
  expect(Object.keys(result.metafile!.inputs)).toContain(
    'modules/scene/dist/gltf/libs/meshopt-decoder.mjs'
  );
  expect(result.outputFiles[0].text).toContain('decodeGltfBuffer');
});

test('vendored meshopt decoder matches the pinned maintained distribution', async () => {
  const [vendoredDecoder, upstreamDecoder] = await Promise.all([
    readFile('modules/scene/src/gltf/libs/meshopt-decoder.mjs', 'utf8'),
    readFile('node_modules/meshoptimizer/meshopt_decoder.mjs', 'utf8')
  ]);
  expect(vendoredDecoder).toBe(upstreamDecoder);
});
