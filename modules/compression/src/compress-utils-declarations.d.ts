// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Type declarations for optional compress-utils encoder subpaths. */
declare module 'compress-utils/*/compress' {
  /** Stateful incremental encoder. */
  export type CompressStream = {
    write(input: Uint8Array): Uint8Array;
    finish(): Uint8Array;
    destroy(): void;
  };

  /** Compresses one payload. */
  export function compress(
    input: Uint8Array,
    options?: Record<string, unknown>
  ): Promise<Uint8Array>;

  /** Creates an incremental encoder. */
  export function createCompressStream(options?: Record<string, unknown>): Promise<CompressStream>;
}

/** Type declarations for optional compress-utils decoder subpaths. */
declare module 'compress-utils/*/decompress' {
  /** Stateful incremental decoder. */
  export type DecompressStream = {
    write(input: Uint8Array): Uint8Array;
    finish(): Uint8Array;
    destroy(): void;
  };

  /** Decompresses one payload. */
  export function decompress(
    input: Uint8Array,
    options?: Record<string, unknown>
  ): Promise<Uint8Array>;

  /** Creates an incremental decoder. */
  export function createDecompressStream(): Promise<DecompressStream>;
}
