// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ReadableFile} from '@loaders.gl/loader-utils';

/** Immutable archive bytes or an owned random-access file. */
export type ZipArchiveInput = ArrayBuffer | ArrayBufferView | Blob | ReadableFile;

/** Independent bounds; decoded limits do not bound decoder intermediates or total heap. */
export interface ZipArchiveOptions {
  /** Maximum archive length; default 1 TiB. */
  readonly maxArchiveBytes?: bigint;
  /** Maximum central-directory bytes; default 32 MiB. */
  readonly maxDirectoryBytes?: number;
  /** Maximum directory records; default 100000. */
  readonly maxEntries?: number;
  /** Maximum bytes in one physical read; default 1 MiB. */
  readonly maxReadBytes?: number;
  /** Maximum compressed bytes consumed for a complete entry; default 64 MiB. */
  readonly maxCompressedBytes?: bigint;
  /** Maximum decoded bytes consumed for a complete entry; default 64 MiB. */
  readonly maxDecodedBytes?: bigint;
  /** Maximum streaming input block; default 64 KiB, capped by maxReadBytes. */
  readonly chunkBytes?: number;
  /** Cancellation shared by initialization and subsequent reads. */
  readonly signal?: AbortSignal;
}

/** Validated immutable entry metadata. Byte locations and lengths retain ZIP64 precision. */
export interface ZipEntry {
  /** Canonical relative path, including a final slash for a directory. */
  readonly path: string;
  /** Whether this record represents a directory. */
  readonly directory: boolean;
  /** Compression method: STORE or raw DEFLATE. */
  readonly compression: 'store' | 'deflate';
  /** Compressed payload length. */
  readonly compressedSize: bigint;
  /** Decoded payload length. */
  readonly size: bigint;
  /** Expected CRC-32 of the complete decoded payload. */
  readonly crc32: number;
  /** Absolute local-header byte offset. */
  readonly localHeaderOffset: bigint;
  /** Absolute payload byte offset. */
  readonly dataOffset: bigint;
  /** Decoded central-directory comment, empty for direct local-header access. */
  readonly comment: string;
}

/** Options for a complete entry read or streaming decode. */
export interface ZipReadOptions {
  /** Cancellation for this operation in addition to the archive lifetime. */
  readonly signal?: AbortSignal;
}

/** A bounded STORE slice; end is exclusive. CRC cannot be verified for a partial entry. */
export interface ZipRangeOptions extends ZipReadOptions {
  /** Inclusive decoded byte offset. */
  readonly start: bigint;
  /** Exclusive decoded byte offset. */
  readonly end: bigint;
}
