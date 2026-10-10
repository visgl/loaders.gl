// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {
  DRACO_EXTERNAL_LIBRARIES,
  loadDracoDecoderModule,
  loadDracoEncoderModule
} from '../src/lib/draco-module-loader';

test('Draco forwards a dynamically loaded decoder factory rejection', async () => {
  const initializationError = new Error('Draco decoder failed to initialize');
  const modules = {
    [DRACO_EXTERNAL_LIBRARIES.FALLBACK_DECODER]: () => Promise.reject(initializationError)
  };
  await expect(loadDracoDecoderModule({modules}, 'js')).rejects.toBe(initializationError);
});

test('Draco forwards an injected encoder factory rejection', async () => {
  const initializationError = new Error('Draco encoder failed to initialize');
  const modules = {
    draco3d: {createEncoderModule: () => Promise.reject(initializationError)}
  };
  await expect(loadDracoEncoderModule({modules})).rejects.toBe(initializationError);
});
