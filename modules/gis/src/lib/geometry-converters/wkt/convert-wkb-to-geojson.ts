// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Geometry} from '@loaders.gl/schema';
import {convertBinaryGeometryToGeoJSON} from '../convert-binary-geometry-to-geojson';
import {convertWKBToBinaryGeometry} from './convert-wkb-to-binary-geometry';

export function convertWKBToGeoJSON(arrayBuffer: ArrayBuffer): Geometry {
  const binaryGeometry = convertWKBToBinaryGeometry(arrayBuffer);
  return convertBinaryGeometryToGeoJSON(binaryGeometry);
}
