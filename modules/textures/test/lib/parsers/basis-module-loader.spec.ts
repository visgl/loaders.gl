// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import {
  BASIS_EXTERNAL_LIBRARIES,
  loadBasisEncoderModule
} from '../../../src/lib/parsers/basis-module-loader';
import {parseBasis, withBasisTranscodingLock} from '../../../src/lib/parsers/parse-basis';

describe('Basis module initialization', () => {
  test('rejects a failed transcoder initialization and releases the transcoding lock', async () => {
    const initializationError = new Error('Basis transcoder failed to instantiate');
    const modules = {
      [BASIS_EXTERNAL_LIBRARIES.TRANSCODER]: () => Promise.reject(initializationError),
      [BASIS_EXTERNAL_LIBRARIES.TRANSCODER_WASM]: new ArrayBuffer(8)
    };

    await expect(parseBasis(new ArrayBuffer(4), {modules})).rejects.toBe(initializationError);
    await expect(withBasisTranscodingLock(() => 'next transcode')).resolves.toBe('next transcode');
  });

  test('rejects an encoder initializer that throws', async () => {
    const initializationError = new Error('Basis encoder failed to initialize');
    const modules = {
      [BASIS_EXTERNAL_LIBRARIES.ENCODER]: async () => ({
        initializeBasis: () => {
          throw initializationError;
        }
      }),
      [BASIS_EXTERNAL_LIBRARIES.ENCODER_WASM]: new ArrayBuffer(8)
    };

    await expect(loadBasisEncoderModule({modules})).rejects.toBe(initializationError);
  });
});
