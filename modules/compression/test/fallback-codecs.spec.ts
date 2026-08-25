// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {BrotliCompression} from '@loaders.gl/compression/brotli-compression';
import {BrotliDecode} from '@loaders.gl/compression/brotli-decode';
import {
  NATIVE_DECOMPRESSION_FIXTURES,
  NATIVE_DECOMPRESSION_TEST_DATA
} from './utils/native-decompression-test-utils';

test('BrotliCompression uses the optional injected fallback decoder', async () => {
  const compression = new BrotliCompression({
    modules: {
      brotli: {
        compress: () => {
          throw new Error('compression is not used by this test');
        },
        decompress: (input: Uint8Array) => BrotliDecode(input, undefined)
      }
    }
  });

  const output = await compression.decompress(
    new Uint8Array(NATIVE_DECOMPRESSION_FIXTURES.brotli).buffer
  );
  expect(new Uint8Array(output)).toEqual(new Uint8Array(NATIVE_DECOMPRESSION_TEST_DATA));
});
