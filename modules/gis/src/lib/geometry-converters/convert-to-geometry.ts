// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Geometry, BinaryGeometry} from '@loaders.gl/schema';

import {convertGeometryToWKB} from './wkt/convert-geometry-to-wkb';
import {convertGeometryToWKT} from './wkt/convert-geometry-to-wkt';
import {convertWKBToBinaryGeometry} from './wkt/convert-wkb-to-binary-geometry';
import {convertWKTToGeometry} from './wkt/convert-wkt-to-geometry';

import {convertBinaryGeometryToGeometry} from './convert-binary-geometry-to-geometry';

export function convertToGeoJSON(geometry: ArrayBuffer | string): Geometry {
  if (geometry instanceof ArrayBuffer) {
    const binaryGeometry = convertWKBToBinaryGeometry(geometry);
    return convertBinaryGeometryToGeometry(binaryGeometry);
  }

  // Assume string encoded WKT
  if (typeof geometry === 'string') {
    return convertWKTToGeometry(geometry)!;
  }

  throw new Error('Geo conversion not implemented');
}

export function convertToBinaryGeometry(geometry: ArrayBuffer | string | Geometry): BinaryGeometry {
  if (geometry instanceof ArrayBuffer) {
    return convertWKBToBinaryGeometry(geometry);
  }

  // Assume string encoded WKT
  if (typeof geometry === 'string') {
    // const geometry = convertWKTToGeometry(geometry);
    // return convertGeometryToBinaryGeometry(geometry);
  }

  throw new Error('Geo conversion not implemented');
}

export function convertToWKT(geometry: Geometry): string {
  return convertGeometryToWKT(geometry);
}

export function convertToWKB(geometry: Geometry): ArrayBuffer {
  return convertGeometryToWKB(geometry);
}

// export function convertToTWKB(geometry: Geometry): ArrayBuffer {
//   return convertGeometryToTWKB(geometry);
// }
