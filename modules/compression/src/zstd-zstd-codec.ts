// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {ZstdCodec} from 'zstd-codec';
import {ZstdCompression, type ZstdCompressionOptions} from './lib/zstd-compression';

/**
 * Zstandard compression explicitly backed by zstd-codec.
 * @deprecated Prefer direction-specific implementations where bundle splitting is available.
 */
export class ZstdCodecCompression extends ZstdCompression {
  constructor(options: ZstdCompressionOptions = {}) {
    super({
      ...options,
      zstd: {...options.zstd, useNative: false},
      modules: {...options.modules, 'zstd-codec': ZstdCodec}
    });
  }
}

export type {ZstdCompressionOptions as ZstdCodecCompressionOptions};
