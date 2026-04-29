// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {BinaryGeometry, Geometry as GeoJSONGeometry} from '@loaders.gl/schema';
import type {Converter} from '@loaders.gl/schema-utils';
import {convertBinaryGeometryToGeometry} from '../convert-binary-geometry-to-geojson';
import {convertBinaryGeometryToWKB} from '../wkb/convert-binary-geometry-to-wkb';
import {convertGeometryToWKB} from '../wkb/convert-geometry-to-wkb';
import {convertGeometryToWKT} from '../wkb/convert-geometry-to-wkt';
import {convertGeometryToTWKB} from '../wkb/convert-geometry-to-twkb';
import {convertTWKBToGeometry} from '../wkb/convert-twkb-to-geometry';
import {convertWKBToGeometry} from '../wkb/convert-wkb-to-geometry';
import {convertWKTToGeometry} from '../wkb/convert-wkt-to-geometry';
import {isTWKB, isWKB} from '../wkb/helpers/parse-wkb-header';

/**
 * Shapes supported by the single-geometry converter.
 */
export type GeometryShape = 'geojson-geometry' | 'binary-geometry' | 'wkb' | 'wkt' | 'twkb';

/**
 * Leaf converter for single geometry values.
 */
export const GeometryConverter: Converter<GeometryShape> = {
  id: 'geometry',
  from: ['geojson-geometry', 'binary-geometry', 'wkb', 'wkt', 'twkb'],
  to: ['geojson-geometry', 'wkb', 'wkt', 'twkb'],
  canConvert(sourceShape, targetShape) {
    if (sourceShape === targetShape) {
      return false;
    }
    if (sourceShape === 'geojson-geometry') {
      return targetShape === 'wkb' || targetShape === 'wkt' || targetShape === 'twkb';
    }
    if (sourceShape === 'binary-geometry') {
      return targetShape === 'geojson-geometry' || targetShape === 'wkb';
    }
    return targetShape === 'geojson-geometry';
  },
  detectInputShape(input) {
    if (typeof input === 'string') {
      return 'wkt';
    }
    if (isArrayBufferLike(input)) {
      const arrayBuffer = toArrayBuffer(input);
      return isTWKB(arrayBuffer) && !isWKB(arrayBuffer) ? 'twkb' : 'wkb';
    }
    if (isGeoJSONGeometry(input)) {
      return 'geojson-geometry';
    }
    if (isBinaryGeometry(input)) {
      return 'binary-geometry';
    }
    return null;
  },
  convert(input, targetShape) {
    if (typeof input === 'string') {
      if (targetShape === 'geojson-geometry') {
        return convertWKTToGeometry(input);
      }
      throw new Error(`Unsupported geometry conversion target: ${targetShape}`);
    }

    if (isArrayBufferLike(input)) {
      if (targetShape === 'geojson-geometry') {
        const arrayBuffer = toArrayBuffer(input);
        return isTWKB(arrayBuffer) && !isWKB(arrayBuffer)
          ? convertTWKBToGeometry(arrayBuffer)
          : convertWKBToGeometry(arrayBuffer);
      }
      throw new Error(`Unsupported geometry conversion target: ${targetShape}`);
    }

    if (isBinaryGeometry(input)) {
      if (targetShape === 'geojson-geometry') {
        return convertBinaryGeometryToGeometry(input);
      }
      if (targetShape === 'wkb') {
        return convertBinaryGeometryToWKB(input);
      }
      throw new Error(`Unsupported geometry conversion target: ${targetShape}`);
    }

    if (isGeoJSONGeometry(input)) {
      switch (targetShape) {
        case 'wkb':
          return convertGeometryToWKB(input);
        case 'wkt':
          return convertGeometryToWKT(input);
        case 'twkb':
          return convertGeometryToTWKB(input);
        default:
          throw new Error(`Unsupported geometry conversion target: ${targetShape}`);
      }
    }

    throw new Error('Unsupported geometry conversion input');
  }
} as const;

/**
 * Checks whether an input is backed by an ArrayBuffer.
 */
function isArrayBufferLike(input: unknown): input is ArrayBufferLike {
  return input instanceof ArrayBuffer || ArrayBuffer.isView(input);
}

/**
 * Checks whether an input looks like a GeoJSON geometry object.
 */
function isGeoJSONGeometry(input: unknown): input is GeoJSONGeometry {
  return (
    typeof input === 'object' &&
    input !== null &&
    'type' in input &&
    typeof input.type === 'string' &&
    ('coordinates' in input || input.type === 'GeometryCollection')
  );
}

/**
 * Checks whether an input looks like a binary geometry object.
 */
function isBinaryGeometry(input: unknown): input is BinaryGeometry {
  return (
    typeof input === 'object' &&
    input !== null &&
    'type' in input &&
    (input.type === 'Point' || input.type === 'LineString' || input.type === 'Polygon') &&
    'positions' in input
  );
}

function toArrayBuffer(input: ArrayBufferLike): ArrayBuffer {
  if (input instanceof ArrayBuffer) {
    return input;
  }
  if (ArrayBuffer.isView(input)) {
    return input.buffer.slice(input.byteOffset, input.byteOffset + input.byteLength) as ArrayBuffer;
  }
  return input as unknown as ArrayBuffer;
}
