// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {LazyCompressor, LazyDecompressor} from './lib/lazy-compression';
import type {CompressionOptions} from './lib/compression';
import {getJSModuleOrNull} from '@loaders.gl/loader-utils';
import type {DeflateCompressorOptions} from './deflate-compressor';
import type {DeflateDecompressorOptions} from './deflate-decompressor';
import type {GZipCompressorOptions} from './gzip-compressor';
import type {GZipDecompressorOptions} from './gzip-decompressor';
import type {BrotliCompressorOptions} from './brotli-compressor';
import type {BrotliDecompressorOptions} from './brotli-decompressor';
import type {ZstdCompressorOptions} from './zstd-compressor';
import type {ZstdDecompressorOptions} from './zstd-decompressor';

const UNCOMPRESSED = {name: 'uncompressed', extensions: [], contentEncodings: []};
const DEFLATE = {name: 'deflate', extensions: [], contentEncodings: ['deflate']};
const GZIP = {name: 'gzip', extensions: ['gz'], contentEncodings: ['gzip']};
const BROTLI = {name: 'brotli', extensions: ['br'], contentEncodings: ['br']};
const SNAPPY = {name: 'snappy', extensions: [], contentEncodings: []};
const LZ4 = {name: 'lz4', extensions: ['lz4'], contentEncodings: ['x-lz4']};
const ZSTD = {name: 'zstd', extensions: ['zst'], contentEncodings: ['zstd']};
const BZIP2 = {name: 'bzip2', extensions: ['bz2'], contentEncodings: ['bzip2']};
const XZ = {name: 'xz', extensions: ['xz', 'lzma'], contentEncodings: ['xz']};

/** Lightweight root-level pass-through compressor. */
export class NoCompressor extends LazyCompressor {
  constructor(options: CompressionOptions = {}) {
    super(UNCOMPRESSED, async () => (await import('./no-compressor')).NoCompressor, options);
  }
}

/** Lightweight root-level pass-through decompressor. */
export class NoDecompressor extends LazyDecompressor {
  constructor(options: CompressionOptions = {}) {
    super(UNCOMPRESSED, async () => (await import('./no-decompressor')).NoDecompressor, options);
  }
}

/** Lightweight root-level DEFLATE compressor with built-in-first selection. */
export class DeflateCompressor extends LazyCompressor {
  constructor(options: DeflateCompressorOptions = {}) {
    super(
      DEFLATE,
      async () => (await import('./deflate-compressor')).DeflateCompressor,
      options,
      options.raw ? null : 'deflate'
    );
  }
}

/** Lightweight root-level DEFLATE decompressor with built-in-first selection. */
export class DeflateDecompressor extends LazyDecompressor {
  constructor(options: DeflateDecompressorOptions = {}) {
    super(
      DEFLATE,
      async () => (await import('./deflate-decompressor')).DeflateDecompressor,
      options,
      options.raw ? 'deflate-raw' : 'deflate'
    );
  }
}

/** Lightweight root-level GZIP compressor with built-in-first selection. */
export class GZipCompressor extends LazyCompressor {
  constructor(options: GZipCompressorOptions = {}) {
    super(GZIP, async () => (await import('./gzip-compressor')).GZipCompressor, options, 'gzip');
  }
}

/** Lightweight root-level GZIP decompressor with built-in-first selection. */
export class GZipDecompressor extends LazyDecompressor {
  constructor(options: GZipDecompressorOptions = {}) {
    super(
      GZIP,
      async () => (await import('./gzip-decompressor')).GZipDecompressor,
      options,
      'gzip'
    );
  }
}

/** Lightweight root-level Brotli compressor with built-in-first selection. */
export class BrotliCompressor extends LazyCompressor {
  constructor(options: BrotliCompressorOptions = {}) {
    super(
      BROTLI,
      async () => (await import('./brotli-compressor')).BrotliCompressor,
      options,
      'brotli',
      preloadOptions =>
        !preloadOptions.modules?.brotli &&
        !getJSModuleOrNull('brotli') &&
        !preloadOptions.brotli?.useZlib
    );
  }
}

/** Lightweight root-level Brotli decompressor with built-in-first selection. */
export class BrotliDecompressor extends LazyDecompressor {
  constructor(options: BrotliDecompressorOptions = {}) {
    super(
      BROTLI,
      async () => (await import('./brotli-decompressor')).BrotliDecompressor,
      options,
      'brotli',
      preloadOptions => !preloadOptions.modules?.brotli && !getJSModuleOrNull('brotli')
    );
  }
}

/** Lightweight root-level Snappy compressor. */
export class SnappyCompressor extends LazyCompressor {
  constructor(options: CompressionOptions = {}) {
    super(SNAPPY, async () => (await import('./snappy-compressor')).SnappyCompressor, options);
  }
}

/** Lightweight root-level Snappy decompressor. */
export class SnappyDecompressor extends LazyDecompressor {
  constructor(options: CompressionOptions = {}) {
    super(SNAPPY, async () => (await import('./snappy-decompressor')).SnappyDecompressor, options);
  }
}

/** Lightweight root-level LZ4 compressor. */
export class LZ4Compressor extends LazyCompressor {
  constructor(options: CompressionOptions = {}) {
    super(LZ4, async () => (await import('./lz4-compressor')).LZ4Compressor, options);
  }
}

/** Lightweight root-level LZ4 decompressor. */
export class LZ4Decompressor extends LazyDecompressor {
  constructor(options: CompressionOptions = {}) {
    super(LZ4, async () => (await import('./lz4-decompressor')).LZ4Decompressor, options);
  }
}

/** Lightweight root-level Zstandard compressor with built-in-first selection. */
export class ZstdCompressor extends LazyCompressor {
  constructor(options: ZstdCompressorOptions = {}) {
    super(
      ZSTD,
      async () => (await import('./zstd-compressor')).ZstdCompressor,
      options,
      'zstd',
      preloadOptions => !preloadOptions.modules?.['zstd-codec'] && !getJSModuleOrNull('zstd-codec')
    );
  }
}

/** Lightweight root-level Zstandard decompressor with built-in-first selection. */
export class ZstdDecompressor extends LazyDecompressor {
  constructor(options: ZstdDecompressorOptions = {}) {
    super(
      ZSTD,
      async () => (await import('./zstd-decompressor')).ZstdDecompressor,
      options,
      'zstd',
      preloadOptions => !preloadOptions.modules?.['zstd-codec'] && !getJSModuleOrNull('zstd-codec')
    );
  }
}

/** Lightweight root-level bzip2 compressor. */
export class BZip2Compressor extends LazyCompressor {
  constructor(options: CompressionOptions = {}) {
    super(BZIP2, async () => (await import('./bzip2-compressor')).BZip2Compressor, options);
  }
}

/** Lightweight root-level bzip2 decompressor. */
export class BZip2Decompressor extends LazyDecompressor {
  constructor(options: CompressionOptions = {}) {
    super(BZIP2, async () => (await import('./bzip2-decompressor')).BZip2Decompressor, options);
  }
}

/** Lightweight root-level XZ/LZMA compressor. */
export class XZCompressor extends LazyCompressor {
  constructor(options: CompressionOptions = {}) {
    super(XZ, async () => (await import('./xz-compressor')).XZCompressor, options);
  }
}

/** Lightweight root-level XZ/LZMA decompressor. */
export class XZDecompressor extends LazyDecompressor {
  constructor(options: CompressionOptions = {}) {
    super(XZ, async () => (await import('./xz-decompressor')).XZDecompressor, options);
  }
}

export type {
  BrotliCompressorOptions,
  BrotliDecompressorOptions,
  DeflateCompressorOptions,
  DeflateDecompressorOptions,
  GZipCompressorOptions,
  GZipDecompressorOptions,
  ZstdCompressorOptions,
  ZstdDecompressorOptions
};
