// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {copyToArray} from '@loaders.gl/loader-utils';

export function cloneTypeArray(source) {
  const indicesContainer = new Uint8Array(source.byteLength);
  copyToArray(source, indicesContainer, 0);
  return new source.constructor(indicesContainer.buffer);
}
