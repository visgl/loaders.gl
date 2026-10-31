// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {encode} from '@loaders.gl/core';
import {DracoLoader} from '@loaders.gl/scene';
import {DracoWriter} from '@loaders.gl/scene/draco-writer';
import {processOnWorker} from '@loaders.gl/core/worker-utils';
import {getDracoLibraryOptions} from '../../src/draco/draco-library-options';

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
      new Worker(new URL('/modules/scene/dist/draco-worker.js', location.href), {type: 'module'})
  };
  const onProgress = vi.fn();
  const mesh = await processOnWorker(loader, encoded, {
    ...getDracoLibraryOptions(
      libraryMode === 'custom'
        ? {
            modules: {
              'draco_wasm_wrapper.js': new URL(
                '/modules/scene/dist/libs/draco_wasm_wrapper.mjs',
                location.href
              ).href
            }
          }
        : {}
    ),
    draco: {shape: 'mesh'},
    onProgress,
    reuseWorkers: false
  });
  expect(onProgress).toHaveBeenLastCalledWith({
    phase: 'decode',
    completed: 1,
    total: 1,
    unit: 'tasks'
  });
  expect(mesh.attributes.POSITION.value).toHaveLength(9);
  expect(mesh.indices.value).toHaveLength(3);
});
