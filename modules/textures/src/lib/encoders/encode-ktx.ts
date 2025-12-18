// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {read} from 'ktx-parse';

export function encodeKTX(texture: Uint8Array) {
  const ktx = read(texture);
  // post process
  return ktx;
}
