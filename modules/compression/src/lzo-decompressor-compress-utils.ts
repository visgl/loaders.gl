// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  CompressUtilsDecompressor,
  type CompressUtilsCompressionOptions,
  type CompressUtilsDecompressModule
} from './lib/compress-utils-compression';

/** Decoder-only raw LZO1X binding. The size argument is the output capacity. */
export class LzoCompressUtilsDecompressor extends CompressUtilsDecompressor {
  /** Creates a lazy decoder; neither an encoder nor container framing is included. */
  constructor(options: CompressUtilsCompressionOptions = {}) {
    super(
      {name: 'lzo'},
      async () =>
        (await import('compress-utils/lzo/decompress')) as unknown as CompressUtilsDecompressModule,
      options
    );
  }
}

export type {CompressUtilsCompressionOptions as LzoDecompressorOptions};
