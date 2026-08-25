// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {decompress} from 'fzstd';

/** Decompresses Zstandard data with the compact JavaScript fallback. */
export function decompressZstd(input: Uint8Array): Uint8Array {
  return decompress(input);
}
