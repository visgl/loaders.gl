// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {
  DRACO_EXTERNAL_LIBRARIES,
  DRACO_EXTERNAL_LIBRARY_URLS
} from '../src/lib/draco-module-loader';

test('Draco encoder assets use browser-compatible 1.5.7 URLs', () => {
  expect(DRACO_EXTERNAL_LIBRARY_URLS[DRACO_EXTERNAL_LIBRARIES.ENCODER]).toBe(
    'https://cdn.jsdelivr.net/gh/google/draco@1.5.7/javascript/draco_encoder.js'
  );
  expect(DRACO_EXTERNAL_LIBRARY_URLS[DRACO_EXTERNAL_LIBRARIES.ENCODER_WASM]).toBe(
    'https://cdn.jsdelivr.net/gh/google/draco@1.5.7/javascript/draco_encoder.wasm'
  );
});
