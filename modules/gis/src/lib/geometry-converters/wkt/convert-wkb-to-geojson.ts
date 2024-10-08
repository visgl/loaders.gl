// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Geometry} from '@loaders.gl/schema';
import {convertBinaryGeometryToGeometry} from '../convert-binary-geometry-to-geojson';
import {convertWKBToBinaryGeometry} from './convert-wkb-to-binary-geometry';

export type convertWKBOptions = {
  /** Does the GeoJSON input have Z values? */
  hasZ?: boolean;

  /** Does the GeoJSON input have M values? */
  hasM?: boolean;

  /** Spatial reference for input GeoJSON */
  srid?: any;
};

export function convertWKBToGeometry(arrayBuffer: ArrayBuffer): Geometry {
  const binaryGeometry = convertWKBToBinaryGeometry(arrayBuffer);
  return convertBinaryGeometryToGeometry(binaryGeometry);
}
