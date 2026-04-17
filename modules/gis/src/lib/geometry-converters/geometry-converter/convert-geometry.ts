// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Geometry as GeoJSONGeometry} from '@loaders.gl/schema';
import {convertGeometryToWKB} from '../wkb/convert-geometry-to-wkb';
import {convertGeometryToWKT} from '../wkb/convert-geometry-to-wkt';
import {convertGeometryToTWKB} from '../wkb/convert-geometry-to-twkb';
import {convertWKTToGeometry} from '../wkb/convert-wkt-to-geometry';
import {convertWKBToGeometry} from '../wkb/convert-wkb-to-geometry';
import {convertTWKBToGeometry} from '../wkb/convert-twkb-to-geometry';
import {isTWKB, isWKB} from '../wkb/helpers/parse-wkb-header';
import type {GeometryShape} from './geometry-converter';

/**
 * Converts between single-geometry representations.
 */
export function convertGeometry(input: GeoJSONGeometry, shape: 'wkb'): ArrayBuffer;
export function convertGeometry(input: GeoJSONGeometry, shape: 'wkt'): string;
export function convertGeometry(input: GeoJSONGeometry, shape: 'twkb'): ArrayBuffer;
export function convertGeometry(
  input: string | ArrayBufferLike,
  shape: 'geojson-geometry'
): GeoJSONGeometry;
export function convertGeometry(
  input: GeoJSONGeometry | string | ArrayBufferLike,
  shape: GeometryShape
): GeoJSONGeometry | string | ArrayBuffer {
  if (typeof input === 'string') {
    if (shape !== 'geojson-geometry') {
      throw new Error(`Unsupported geometry conversion target: ${shape}`);
    }
    return convertWKTToGeometry(input)!;
  }

  if (isArrayBufferLike(input)) {
    if (shape !== 'geojson-geometry') {
      throw new Error(`Unsupported geometry conversion target: ${shape}`);
    }
    if (isTWKB(input) && !isWKB(input)) {
      return convertTWKBToGeometry(toArrayBuffer(input));
    }
    return convertWKBToGeometry(input);
  }

  switch (shape) {
    case 'wkb':
      return convertGeometryToWKB(input);
    case 'wkt':
      return convertGeometryToWKT(input);
    case 'twkb':
      return convertGeometryToTWKB(input);
    default:
      throw new Error(`Unsupported geometry conversion target: ${shape}`);
  }
}

/**
 * Checks whether an input is backed by an ArrayBuffer.
 */
export function isArrayBufferLike(input: unknown): input is ArrayBufferLike {
  return input instanceof ArrayBuffer || ArrayBuffer.isView(input);
}

/**
 * Checks whether an input looks like a GeoJSON geometry object.
 */
export function isGeoJSONGeometry(input: unknown): input is GeoJSONGeometry {
  return (
    typeof input === 'object' &&
    input !== null &&
    'type' in input &&
    typeof input.type === 'string' &&
    ('coordinates' in input || input.type === 'GeometryCollection')
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
