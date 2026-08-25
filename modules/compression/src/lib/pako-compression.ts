// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Compression, type CompressionOptions} from './compression';
import {
  deflate,
  deflateRaw,
  gzip,
  inflate,
  inflateRaw,
  ungzip,
  type DeflateFunctionOptions,
  type InflateOptions
} from 'pako';

/** Options for a Pako-backed DEFLATE implementation. */
export type DeflatePakoCompressionOptions = CompressionOptions & {
  /** Creates or reads raw DEFLATE data without a zlib wrapper. */
  raw?: boolean;
  /** Pako encoder options. */
  deflate?: DeflateFunctionOptions;
  /** Pako decoder options. */
  inflate?: InflateOptions;
};

/**
 * DEFLATE compression explicitly backed by Pako.
 * @deprecated Import `deflate-compressor-pako` and/or `deflate-decompressor-pako`.
 */
export class DeflatePakoCompression extends Compression {
  readonly name = 'deflate';
  readonly extensions: string[] = [];
  readonly contentEncodings = ['deflate'];
  readonly isSupported = true;
  readonly options: DeflatePakoCompressionOptions;

  constructor(options: DeflatePakoCompressionOptions = {}) {
    super(options);
    this.options = options;
  }

  /** Compresses one DEFLATE payload synchronously. */
  compressSync(input: ArrayBuffer): ArrayBuffer {
    const output = this.options.raw
      ? deflateRaw(new Uint8Array(input), this.options.deflate)
      : deflate(new Uint8Array(input), this.options.deflate);
    return output.slice().buffer as ArrayBuffer;
  }

  /** Decompresses one DEFLATE payload synchronously. */
  decompressSync(input: ArrayBuffer): ArrayBuffer {
    const output = this.options.raw
      ? inflateRaw(new Uint8Array(input), this.options.inflate)
      : inflate(new Uint8Array(input), this.options.inflate);
    return output.slice().buffer as ArrayBuffer;
  }
}

/** Options for a Pako-backed GZIP implementation. */
export type GZipPakoCompressionOptions = CompressionOptions & {
  /** Pako encoder options. */
  gzip?: DeflateFunctionOptions;
  /** Pako decoder options. */
  inflate?: InflateOptions;
};

/**
 * GZIP compression explicitly backed by Pako.
 * @deprecated Import `gzip-compressor-pako` and/or `gzip-decompressor-pako`.
 */
export class GZipPakoCompression extends Compression {
  readonly name = 'gzip';
  readonly extensions = ['gz', 'gzip'];
  readonly contentEncodings = ['gzip', 'x-gzip'];
  readonly isSupported = true;
  readonly options: GZipPakoCompressionOptions;

  constructor(options: GZipPakoCompressionOptions = {}) {
    super(options);
    this.options = options;
  }

  /** Compresses one GZIP payload synchronously. */
  compressSync(input: ArrayBuffer): ArrayBuffer {
    return gzip(new Uint8Array(input), this.options.gzip).slice().buffer as ArrayBuffer;
  }

  /** Decompresses one GZIP payload synchronously. */
  decompressSync(input: ArrayBuffer): ArrayBuffer {
    return ungzip(new Uint8Array(input), this.options.inflate).slice().buffer as ArrayBuffer;
  }
}
