// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Converter} from '@loaders.gl/schema-utils';
import {
  convertGeometry,
  isArrayBufferLike,
  isBinaryGeometry,
  isGeoJSONGeometry
} from './convert-geometry';
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
      return isTWKB(input) && !isWKB(input) ? 'twkb' : 'wkb';
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
    switch (targetShape) {
      case 'geojson-geometry':
        return convertGeometry(input as any, 'geojson-geometry');
      case 'wkb':
        return convertGeometry(input as any, 'wkb');
      case 'wkt':
        return convertGeometry(input as any, 'wkt');
      case 'twkb':
        return convertGeometry(input as any, 'twkb');
      default:
        throw new Error(`Unsupported geometry conversion target: ${targetShape}`);
    }
  }
} as const;

export {convertGeometry};
