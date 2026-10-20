// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** File metadata returned by the Node polyfills. */
export type FileStat = {
  /** File length in bytes as a number. */
  size: number;
  /** File length in bytes as a bigint. */
  bigsize: bigint;
  /** Whether the path names a directory. */
  isDirectory: boolean;
};
