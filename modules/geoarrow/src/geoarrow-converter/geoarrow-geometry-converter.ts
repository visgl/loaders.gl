// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Converter} from '@loaders.gl/schema-utils';
import type {GeoArrowEncoding} from '../metadata/geoarrow-metadata';
import {
  convertGeoArrowGeometry,
  type GeoArrowGeometryConvertOptions
} from './convert-geoarrow-geometry';
import {isGeoArrowApacheTable} from './convert-geoarrow';

/**
 * Shapes supported by the GeoArrow geometry converter.
 */
export type GeoArrowGeometryShape = 'geoarrow' | GeoArrowEncoding;

/**
 * Leaf converter that rewrites geometry columns in a GeoArrow Arrow table to a target GeoArrow encoding.
 */
export const GeoArrowGeometryConverter: Converter<
  GeoArrowGeometryShape,
  GeoArrowGeometryConvertOptions
> = {
  id: 'geoarrow-geometry',
  from: ['geoarrow'],
  to: [
    'geoarrow.geometry',
    'geoarrow.geometrycollection',
    'geoarrow.wkb',
    'geoarrow.wkt',
    'geoarrow.point',
    'geoarrow.linestring',
    'geoarrow.polygon',
    'geoarrow.multipoint',
    'geoarrow.multilinestring',
    'geoarrow.multipolygon'
  ],
  canConvert(sourceShape, targetShape) {
    return sourceShape === 'geoarrow' && targetShape !== 'geoarrow';
  },
  detectInputShape(input) {
    return isGeoArrowApacheTable(input as any) ? 'geoarrow' : null;
  },
  convert(input, targetShape, options) {
    if (targetShape === 'geoarrow') {
      throw new Error('GeoArrowGeometryConverter requires a concrete GeoArrow target encoding.');
    }
    return convertGeoArrowGeometry(input as any, targetShape, options);
  }
} as const;

/**
 * Opt-in converter bundle for GeoArrow geometry encoding conversions.
 */
export const GEOARROW_GEOMETRY_CONVERTERS = [GeoArrowGeometryConverter] as const;

/**
 * Converts one or more geometry columns in a GeoArrow table to a concrete GeoArrow encoding.
 */
export {convertGeoArrowGeometry};
