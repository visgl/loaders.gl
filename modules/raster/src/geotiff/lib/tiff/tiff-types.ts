// loaders.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Numeric TIFF tag values retain their declared signedness and precision. */
export type TiffTagValue = string | number[] | bigint[];

/** One directory parsed independently of any image decoder implementation. */
export type TiffDirectory = {
  /** Absolute byte offset of this directory. */
  readonly offset: number;
  /** Absolute byte offset of the next main-chain directory, or zero. */
  readonly nextOffset: number;
  /** Tag identifiers mapped to decoded values; unknown identifiers are retained. */
  readonly tags: ReadonlyMap<number, TiffTagValue>;
};

/** Parsed TIFF container, retaining SubIFDs separately from the main image chain. */
export type TiffContainer = {
  /** File byte order used for tags and uncompressed samples. */
  readonly littleEndian: boolean;
  /** Whether the file uses the BigTIFF directory layout. */
  readonly bigTiff: boolean;
  /** Images in original main-chain order. */
  readonly directories: readonly TiffDirectory[];
  /** All discovered directories, including SubIFDs, indexed by absolute offset. */
  readonly directoriesByOffset: ReadonlyMap<number, TiffDirectory>;
};

/** Limits applied before metadata reads and allocations. */
export type TiffDirectoryLimits = {
  /** Maximum directories across the main chain and all SubIFDs; default 1024. */
  readonly maxDirectories?: number;
  /** Maximum entries in one directory; default 4096. */
  readonly maxEntriesPerDirectory?: number;
  /** Maximum cumulative directory and tag-value bytes; default 16 MiB. */
  readonly maxMetadataBytes?: number;
};

/** Checked physical block intersecting a requested native pixel window. */
export type TiffBlock = {
  /** Absolute encoded byte offset. */
  readonly offset: number;
  /** Declared encoded byte count. */
  readonly byteLength: number;
  /** First pixel column of the physical block. */
  readonly column: number;
  /** First pixel row of the physical block. */
  readonly row: number;
  /** Physical stored row width, including tiled edge padding. */
  readonly width: number;
  /** Stored block height; final strips contain only their remaining image rows. */
  readonly height: number;
  /** Original band index for planar blocks; undefined for chunky blocks. */
  readonly band?: number;
};
