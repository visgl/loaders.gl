// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Geometry, BinaryGeometry} from '@loaders.gl/schema';

import {convertGeoJSONToWKB} from './wkt/convert-geojson-to-wkb';
import {convertGeoJSONToWKT} from './wkt/convert-geojson-to-wkt';
import {convertWKBToBinaryGeometry} from './wkt/convert-wkb-to-binary-geometry';
import {convertWKTToGeoJSON} from './wkt/convert-wkt-to-geojson';

import {convertBinaryGeometryToGeoJSON} from './convert-binary-geometry-to-geojson';

export function convertToGeoJSON(geometry: ArrayBuffer | string): Geometry {
  if (geometry instanceof ArrayBuffer) {
    const binaryGeometry = convertWKBToBinaryGeometry(geometry);
    return convertBinaryGeometryToGeoJSON(binaryGeometry);
  }

  // Assume string encoded WKT
  if (typeof geometry === 'string') {
    return convertWKTToGeoJSON(geometry)!;
  }

  throw new Error('Geo conversion not implemented');
}

export function convertToBinaryGeometry(geometry: ArrayBuffer | string | Geometry): BinaryGeometry {
  if (geometry instanceof ArrayBuffer) {
    return convertWKBToBinaryGeometry(geometry);
  }

  // Assume string encoded WKT
  if (typeof geometry === 'string') {
    // const geometry = convertWKTToGeoJSON(geometry);
    // return convertGeometryToBinaryGeometry(geometry);
  }

  throw new Error('Geo conversion not implemented');
}

export function convertToWKT(geometry: Geometry): string {
  return convertGeoJSONToWKT(geometry);
}

export function convertToWKB(geometry: Geometry): ArrayBuffer {
  return convertGeoJSONToWKB(geometry);
}

// export function convertToTWKB(geometry: Geometry): ArrayBuffer {
//   return convertGeoJSONToTWKB(geometry);
// }
