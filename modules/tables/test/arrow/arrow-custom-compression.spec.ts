// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import * as arrow from 'apache-arrow';
import lz4js from 'lz4js';
import {ZstdCodec} from 'zstd-codec';
import {
  preloadArrowCompressionEncoder,
  registerArrowCompressionEncoderSync,
  registerArrowCompressionCodecs
} from '../../src/arrow/lib/parsers/arrow-compression';

test.each([
  'lz4',
  'zstd'
] as const)('Arrow %s setup retains application-provided encoder and decoder', async compression => {
  const compressionType =
    compression === 'lz4' ? arrow.CompressionType.LZ4_FRAME : arrow.CompressionType.ZSTD;
  const previous = arrow.compressionRegistry.get(compressionType);
  const zstd =
    compression === 'zstd' ? await new Promise<any>(resolve => ZstdCodec.run(resolve)) : null;
  const codec = {
    encode: (bytes: Uint8Array) =>
      compression === 'lz4' ? lz4js.compress(bytes) : new zstd.Simple().compress(bytes),
    decode: (bytes: Uint8Array) =>
      compression === 'lz4' ? lz4js.decompress(bytes) : new zstd.Simple().decompress(bytes)
  };
  arrow.compressionRegistry.set(compressionType, codec);
  try {
    expect(registerArrowCompressionCodecs()).toBe(true);
    await preloadArrowCompressionEncoder(compression);
    expect(registerArrowCompressionEncoderSync(compression)).toBe(compressionType);
    expect(arrow.compressionRegistry.get(compressionType)).toBe(codec);
  } finally {
    arrow.compressionRegistry.set(compressionType, previous || {});
  }
});
