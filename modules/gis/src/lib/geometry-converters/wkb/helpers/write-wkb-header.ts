// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {BinaryWriter} from '../../../utils/binary-writer';
import type {WKBOptions} from './wkb-types';

/**
 * Construct and write WKB integer code
 * Reference: https://en.wikipedia.org/wiki/Well-known_text_representation_of_geometry#Well-known_binary
 */
export function writeWkbHeader(
  writer: BinaryWriter,
  geometryType: number,
  options?: WKBOptions
): void {
  // little endian
  writer.writeInt8(1);
  const {hasZ, hasM, srid} = options || {};

  let dimensionType = 0;

  if (!srid) {
    if (hasZ && hasM) {
      dimensionType += 3000;
    } else if (hasZ) {
      dimensionType += 1000;
    } else if (hasM) {
      dimensionType += 2000;
    }
  } else {
    if (hasZ) {
      dimensionType |= 0x80000000;
    }
    if (hasM) {
      dimensionType |= 0x40000000;
    }
  }

  writer.writeUInt32LE((dimensionType + geometryType) >>> 0);
}
