// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {WKBOptions} from './wkb-types';
import {WKBGeometryType} from './wkb-types';

const WKBGeometryTypeNames = {
  Point: WKBGeometryType.Point,
  LineString: WKBGeometryType.LineString,
  Polygon: WKBGeometryType.Polygon,
  MultiPoint: WKBGeometryType.MultiPoint,
  MultiLineString: WKBGeometryType.MultiLineString,
  MultiPolygon: WKBGeometryType.MultiPolygon,
  GeometryCollection: WKBGeometryType.GeometryCollection
} as const satisfies Record<string, WKBGeometryType>;

/** Convert a WKB geometry type integer to GeoJSON style geometry type string*/
export function getGeometryTypeFromWKBType(
  wkbGeometryType: WKBGeometryType
): keyof typeof WKBGeometryTypeNames {
  for (const key in WKBGeometryTypeNames) {
    if (WKBGeometryTypeNames[key] === wkbGeometryType) {
      return key as keyof typeof WKBGeometryTypeNames;
    }
  }
  throw new Error(String(wkbGeometryType));
}

/** Convert a GeoJSON style geometry type string to a WKB geometry type integer*/
export function getWKBTypeFromGeometryType(
  geometryType: keyof typeof WKBGeometryTypeNames
): WKBGeometryType {
  return WKBGeometryTypeNames[geometryType];
}

/** Sanity: Adjust Z/M dimensions with actual point size */
export function matchWKBOptionsToPointSize(
  pointSize: number,
  options?: WKBOptions
): Required<WKBOptions> {
  const wkbOptions: Required<WKBOptions> = {hasZ: false, hasM: false, srid: undefined, ...options};

  // Align options with actual point size
  switch (pointSize) {
    case 4:
      wkbOptions.hasZ = true;
      wkbOptions.hasM = true;
      break;

    case 3:
      // Prefer Z over M
      if (wkbOptions.hasZ && wkbOptions.hasM) {
        wkbOptions.hasM = false;
      }
      if (!wkbOptions.hasZ && !wkbOptions.hasM) {
        wkbOptions.hasZ = true;
      }
      break;

    case 2:
      wkbOptions.hasZ = false;
      wkbOptions.hasM = false;
      break;

    default:
    // ignore - broken input data?
  }

  return wkbOptions;
}

/** Get coordinate size given Z/M dimensions */
export function getCoordinateByteSize(options?: WKBOptions): number {
  let coordinateByteSize = 16;

  if (options?.hasZ) {
    coordinateByteSize += 8;
  }
  if (options?.hasM) {
    coordinateByteSize += 8;
  }

  return coordinateByteSize;
}
