// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** One encoded tile, addressed using the XYZ convention (north-origin Y). */
export interface PMTilesTile {
  /** Tile zoom, an integer from 0 through 26. */
  readonly z: number;
  /** Tile column at this zoom. */
  readonly x: number;
  /** Tile row at this zoom. */
  readonly y: number;
  /** Encoded payload; views preserve their byte offset and length. */
  readonly data: ArrayBuffer | ArrayBufferView | Blob;
}

/** Explicit finite tile enumeration; async iteration does not imply streaming output. */
export type PMTilesTileInput = Iterable<PMTilesTile> | AsyncIterable<PMTilesTile>;

/** A single payload format applies to every tile in the archive. */
export type PMTilesTileType = 'mvt' | 'mlt' | 'png' | 'jpeg' | 'webp' | 'avif';

/** Encoding controls for a bounded, in-memory PMTiles v3 archive. */
export interface PMTilesEncodeOptions {
  /** Declares the existing payload format; required, never inferred from opaque bytes. */
  readonly tileType: PMTilesTileType;
  /** Existing compression of all payloads; default none. Payloads are not recompressed. */
  readonly tileCompression?: 'none' | 'gzip' | 'brotli' | 'zstd';
  /** Directory and metadata compression; default none. */
  readonly internalCompression?: 'none' | 'gzip';
  /** JSON metadata. MVT requires TileJSON vector_layers with layer IDs and fields. */
  readonly metadata?: Readonly<Record<string, unknown>>;
  /** Geographic bounds [west, south, east, north]; defaults to selected tile footprints. */
  readonly bounds?: readonly [number, number, number, number];
  /** Initial view [longitude, latitude, zoom]; defaults to bounds midpoint and minimum zoom. */
  readonly center?: readonly [number, number, number];
  /** Maximum enumerated tiles; default 100,000. */
  readonly maxTiles?: number;
  /** Maximum archive bytes, including headers and directories; default 256 MiB. */
  readonly maxOutputBytes?: number;
  /** Maximum UTF-8 JSON metadata bytes before compression; default 1 MiB. */
  readonly maxMetadataBytes?: number;
  /** Cancellation checked during enumeration and between encoding stages. */
  readonly signal?: AbortSignal;
}
