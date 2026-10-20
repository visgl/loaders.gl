// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {encode} from '@loaders.gl/core';
import {DracoLoader, DracoWriter} from '@loaders.gl/draco';
import {processOnWorker} from '@loaders.gl/core/worker-utils';
import {getDracoLibraryOptions} from '../src/draco-library-options';

test.each([
  'bundled',
  'custom'
] as const)('Draco decodes a tiny triangle in a module worker using %s ESM assets', async libraryMode => {
  const encoded = await encode(
    {
      attributes: {POSITION: {value: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]), size: 3}},
      indices: {value: new Uint16Array([0, 1, 2]), size: 1}
    },
    DracoWriter,
    {useLocalLibraries: true}
  );
  const loader = {
    ...DracoLoader,
    loadWorker: () =>
      new Worker(new URL('/modules/draco/dist/draco-worker.js', location.href), {type: 'module'})
  };
  const mesh = await processOnWorker(loader, encoded, {
    ...getDracoLibraryOptions(
      libraryMode === 'custom'
        ? {
            modules: {
              'draco_wasm_wrapper.js': new URL(
                '/modules/draco/dist/libs/draco_wasm_wrapper.mjs',
                location.href
              ).href
            }
          }
        : {}
    ),
    draco: {shape: 'mesh'},
    reuseWorkers: false
  });
  expect(mesh.attributes.POSITION.value).toHaveLength(9);
  expect(mesh.indices.value).toHaveLength(3);
});
