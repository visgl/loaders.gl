// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Geometry} from '@loaders.gl/schema';
import {binaryToGeometry} from '../../../binary-features/binary-to-geojson';
import {convertWKBToBinaryGeometry} from './convert-wkb-to-binary-geometry';

export function convertWKBToGeoJSON(arrayBuffer: ArrayBuffer): Geometry {
  const binaryGeometry = convertWKBToBinaryGeometry(arrayBuffer);
  return binaryToGeometry(binaryGeometry);
}
