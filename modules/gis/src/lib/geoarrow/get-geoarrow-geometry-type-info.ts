// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import type {GeoArrowEncoding} from '@loaders.gl/schema';

/**
 * @see https://geoarrow.org/format.html#memory-layouts
 */
export type GeoArrowGeometryTypeInfo = {
  /** Geometry encodings that are compatible with this column (Field) */
  compatibleEncodings: GeoArrowEncoding[];
  /** How many levels of List<> nesting  */
  nesting: 0 | 1 | 2 | 3;
  /** How many values per coordinate */
  dimension: number;
  /**
   * - 0: A point is just a Coordinate
   * - 1: A line string or a multipoint is a List<Coordinate>
   * - 2: A polygon or a multilinestring are List<List<Coordinate>>
   * - 3: multipolygons are List<List<List<Coordinate>>>
   */
  /** Coordinate memory layout {x,y,...} vs [x,y,...] */
  coordinates: 'separated' | 'interleaved';
  /** Coordinate  */
  valueType: 'double'; // 'float'
};

/** Helper type used to test coordinates */
type CoordinateFieldInfo = {
  coordinates: 'interleaved' | 'separated';
  dimension: 2 | 3 | 4;
  valueType: 'double';
};

/**
 * Examines a column containing GeoArrow formatted data and returns information about the geometry type
 * that can be useful during traversal
 * @see https://geoarrow.org/format.html#memory-layouts
 */
export function getGeoArrowGeometryTypeInfo(
  arrowField: arrow.Field
): GeoArrowGeometryTypeInfo | null {
  if (arrowField.type instanceof arrow.Utf8) {
    return {
      compatibleEncodings: ['geoarrow.wkt'],
      nesting: 0,
      /** @note: Dimension encoded in WKT */
      dimension: 2,
      coordinates: 'interleaved',
      valueType: 'double'
    };
  }

  if (arrowField.type instanceof arrow.Binary || arrowField.type instanceof arrow.LargeBinary) {
    return {
      compatibleEncodings: ['geoarrow.wkb'],
      nesting: 0,
      /** @note: Dimension encoded in WKB */
      dimension: 2,
      coordinates: 'interleaved',
      valueType: 'double'
    };
  }
  let coordinateInfo = getCoordinateFieldInfo(arrowField);
  // A point is just a Coordinate
  if (coordinateInfo) {
    return {
      compatibleEncodings: ['geoarrow.point'],
      nesting: 0,
      ...coordinateInfo
    };
  }

  // A line string or a multipoint is a List<Coordinate>
  if (!(arrowField.type instanceof arrow.List)) {
    return null;
  }
  arrowField = arrowField.type.children[0];

  coordinateInfo = getCoordinateFieldInfo(arrowField);
  if (coordinateInfo) {
    return {
      compatibleEncodings: ['geoarrow.linestring', 'geoarrow.multipoint'],
      nesting: 1,
      ...coordinateInfo
    };
  }

  // A polygon or a multiline string are List<List<Coordinate>>
  if (!(arrowField.type instanceof arrow.List)) {
    return null;
  }
  arrowField = arrowField.type.children[0];

  coordinateInfo = getCoordinateFieldInfo(arrowField);
  if (coordinateInfo) {
    return {
      compatibleEncodings: ['geoarrow.polygon', 'geoarrow.multilinestring'],
      nesting: 2,
      ...coordinateInfo
    };
  }

  // A multipolygons are List<List<List<Coordinate>>>
  if (!(arrowField.type instanceof arrow.List)) {
    return null;
  }
  arrowField = arrowField.type.children[0];

  coordinateInfo = getCoordinateFieldInfo(arrowField);
  if (coordinateInfo) {
    return {
      compatibleEncodings: ['geoarrow.multipolygon'],
      nesting: 3,
      ...coordinateInfo
    };
  }

  return null;
}

/**
 * @see https://geoarrow.org/format.html#memory-layouts
 */
function getCoordinateFieldInfo(arrowField: arrow.Field): CoordinateFieldInfo | null {
  // interleaved case
  if (arrowField.type instanceof arrow.FixedSizeList) {
    const dimension = arrowField.type.listSize;
    if (dimension < 2 || dimension > 4) {
      return null;
    }

    const child = arrowField.type.children[0];
    // Spec currently only supports 64 bit coordinates
    if (!(child.type instanceof arrow.Float)) {
      return null;
    }

    return {
      coordinates: 'interleaved',
      dimension: dimension as 2 | 3 | 4,
      valueType: 'double'
    };
  }

  // separated case
  if (arrowField.type instanceof arrow.Struct) {
    const children = arrowField.type.children;

    const dimension = children.length;
    if (dimension < 2 || dimension > 4) {
      return null;
    }

    // Spec currently only supports 64 bit coordinates
    for (const child of children) {
      if (!(child.type instanceof arrow.Float)) {
        return null;
      }
    }

    return {
      coordinates: 'separated',
      dimension: dimension as 2 | 3 | 4,
      valueType: 'double'
    };
  }

  // No other types are valid coordinates
  return null;
}

/*
export const geoarrowSeparatedCoordinateField = new arrow.Field(
  'separated-coordinate',
  new arrow.Struct([
    new arrow.Field('x', new arrow.Float64()),
    new arrow.Field('y', new arrow.Float64()),
    new arrow.Field('z', new arrow.Float64(), true),
    new arrow.Field('m', new arrow.Float64(), true)
  ])
);

export const geoarrowInterleavedCoordinateField = new arrow.Field(
  'interleaved-coordinate',
  new arrow.FixedSizeList([
    new arrow.Field('x', new arrow.Float64()),
    2
  ])
);

export const geoarrowInterleavedPointField = new arrow.Field(
  'point',
  geoarrowInterleavedCoordinateField,
  new arrow.Struct([
    new arrow.Field('x', new arrow.Float64()),
    new arrow.Field('y', new arrow.Float64())
  ])
);


const geoarrowLineStringField = new arrow.Field(
  'lineString',
  new arrow.List(
    geoarrowInterleavedCoordinateField
    ])
  

const geoarrowPolygonField = new arrow.Field(
  'polygon',
  new arrow.List(
    new arrow.List(
      new arrow.Struct([
        new arrow.Field('x', new arrow.Float64()),
        new arrow.Field('y', new arrow.Float64())
      ])
    )
  )
);
*/
