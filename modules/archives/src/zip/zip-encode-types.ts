// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** One binary input chunk; typed-array byte offsets and lengths are respected. */
export type ZipByteChunk = ArrayBuffer | ArrayBufferView;

/** Immutable bytes, a Blob, or a lazily consumed byte stream. */
export type ZipByteSource =
  | ZipByteChunk
  | Blob
  | ReadableStream<ZipByteChunk>
  | AsyncIterable<ZipByteChunk>
  | Iterable<ZipByteChunk>;

/** Optional metadata for one named entry. */
export interface ZipEncodeEntry {
  /** Immutable entry bytes or a byte stream consumed once. */
  readonly data: ZipByteSource;
  /** Compression override; directories always use STORE. */
  readonly compression?: 'store' | 'deflate';
  /** UTC modification time; the default is 1980-01-01. */
  readonly date?: Date;
  /** UTF-8 entry comment. */
  readonly comment?: string;
}

/** Named canonical relative paths; directories end in a slash and have empty payloads. */
export type ZipEncodeFiles = Readonly<Record<string, ZipByteSource | ZipEncodeEntry>>;

/** Independent output/input/metadata budgets; these do not cap total application heap. */
export interface ZipEncodeOptions {
  /** Default compression; STORE when omitted. */
  readonly compression?: 'store' | 'deflate';
  /** ZIP64 policy; auto uses ZIP64 for unknown compressed sizes and overflowing fields. */
  readonly zip64?: 'auto' | 'always' | 'never';
  /** UTC modification time, fixed at 1980-01-01 when omitted. */
  readonly date?: Date;
  /** CP437 archive comment; unrepresentable characters reject. */
  readonly comment?: string;
  /** Maximum complete archive bytes, including metadata; default 1 TiB. */
  readonly maxArchiveBytes?: bigint;
  /** Maximum uncompressed bytes per entry; default 1 TiB. */
  readonly maxEntryBytes?: bigint;
  /** Maximum retained central-directory bytes; default 32 MiB. */
  readonly maxDirectoryBytes?: number;
  /** Maximum named entries; default 100000. */
  readonly maxEntries?: number;
  /** Maximum input/output chunk bytes; default 64 KiB. */
  readonly chunkBytes?: number;
  /** Cancellation during source reads and between output pulls. */
  readonly signal?: AbortSignal;
}
