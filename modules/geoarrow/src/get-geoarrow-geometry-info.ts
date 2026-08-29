// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import type {GeoArrowEncoding} from './metadata/geoarrow-metadata';

/**
 * @see https://geoarrow.org/format.html#memory-layouts
 */
export type GeoArrowGeometryInfo = {
  /** Geometry encodings that are compatible with this column (Field) */
  compatibleEncodings: GeoArrowEncoding[];
  /** How many levels of List<> nesting  */
  nesting: 0 | 1 | 2 | 3 | null;
  /** How many values per coordinate */
  dimension: number | null;
  /**
   * - 0: A point is just a Coordinate
   * - 1: A line string or a multipoint is a List<Coordinate>
   * - 2: A polygon or a multilinestring are List<List<Coordinate>>
   * - 3: multipolygons are List<List<List<Coordinate>>>
   */
  /** Coordinate memory layout {x,y,...} vs [x,y,...] */
  coordinates: 'separated' | 'interleaved' | null;
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
// eslint-disable-next-line max-statements
export function getGeoArrowGeometryInfo(arrowField: arrow.Field): GeoArrowGeometryInfo | null {
  if (
    arrowField.type instanceof arrow.Utf8 ||
    arrowField.type instanceof arrow.LargeUtf8 ||
    arrowField.type instanceof arrow.Utf8View
  ) {
    return {
      compatibleEncodings: ['geoarrow.wkt'],
      nesting: 0,
      /** @note: Dimension encoded in WKT */
      dimension: 2,
      coordinates: 'interleaved',
      valueType: 'double'
    };
  }

  if (
    arrowField.type instanceof arrow.Binary ||
    arrowField.type instanceof arrow.LargeBinary ||
    arrowField.type instanceof arrow.BinaryView
  ) {
    return {
      compatibleEncodings: ['geoarrow.wkb'],
      nesting: 0,
      /** @note: Dimension encoded in WKB */
      dimension: 2,
      coordinates: 'interleaved',
      valueType: 'double'
    };
  }

  if (isBoxField(arrowField)) {
    const dimension = (arrowField.type as arrow.Struct).children.length / 2;
    return {
      compatibleEncodings: ['geoarrow.box'],
      nesting: 0,
      dimension,
      coordinates: 'separated',
      valueType: 'double'
    };
  }

  const unionInfo = getUnionGeometryInfo(arrowField.type);
  if (unionInfo) {
    return unionInfo;
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
  if (!isListType(arrowField.type)) {
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
  if (!isListType(arrowField.type)) {
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
  if (!isListType(arrowField.type)) {
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

/** Summarizes dense-union geometry layouts without inspecting any array values. */
function getUnionGeometryInfo(type: arrow.DataType): GeoArrowGeometryInfo | null {
  if (type instanceof arrow.DenseUnion) {
    const childInfos = type.children
      .map(child => getGeometryInfoForType(child.type))
      .filter((info): info is GeoArrowGeometryInfo => Boolean(info));
    if (childInfos.length !== type.children.length || childInfos.length === 0) {
      return null;
    }
    return {
      compatibleEncodings: ['geoarrow.geometry'],
      nesting: getCommonValue(childInfos.map(info => info.nesting)),
      dimension: getCommonValue(childInfos.map(info => info.dimension)),
      coordinates: getCommonValue(childInfos.map(info => info.coordinates)),
      valueType: 'double'
    };
  }

  if (
    (type instanceof arrow.List || type instanceof arrow.LargeList) &&
    type.children[0]?.type instanceof arrow.DenseUnion
  ) {
    const unionInfo = getUnionGeometryInfo(type.children[0].type);
    if (!unionInfo) {
      return null;
    }
    return {
      compatibleEncodings: ['geoarrow.geometrycollection'],
      nesting: 1,
      dimension: unionInfo.dimension,
      coordinates: unionInfo.coordinates,
      valueType: unionInfo.valueType
    };
  }

  return null;
}

/** Gets geometry information for a union child, including nested collections. */
function getGeometryInfoForType(type: arrow.DataType): GeoArrowGeometryInfo | null {
  if (type instanceof arrow.DenseUnion) {
    return getUnionGeometryInfo(type);
  }
  if (
    (type instanceof arrow.List || type instanceof arrow.LargeList) &&
    type.children[0]?.type instanceof arrow.DenseUnion
  ) {
    return getUnionGeometryInfo(type);
  }

  const field = new arrow.Field('geometry', type, true);
  if (isBoxField(field)) {
    return null;
  }
  const coordinateInfo = getCoordinateFieldInfo(field);
  if (coordinateInfo) {
    return {
      compatibleEncodings: ['geoarrow.point'],
      nesting: 0,
      ...coordinateInfo
    };
  }
  if (!(type instanceof arrow.List || type instanceof arrow.LargeList)) {
    return null;
  }

  const childInfo = getCoordinateFieldInfo(type.children[0]);
  if (childInfo) {
    return {
      compatibleEncodings: ['geoarrow.linestring', 'geoarrow.multipoint'],
      nesting: 1,
      ...childInfo
    };
  }
  const nestedType = type.children[0]?.type;
  if (!(nestedType instanceof arrow.List || nestedType instanceof arrow.LargeList)) {
    return null;
  }
  const nestedChildInfo = getCoordinateFieldInfo(nestedType.children[0]);
  if (nestedChildInfo) {
    return {
      compatibleEncodings: ['geoarrow.polygon', 'geoarrow.multilinestring'],
      nesting: 2,
      ...nestedChildInfo
    };
  }
  const deeplyNestedType = nestedType.children[0]?.type;
  if (!(deeplyNestedType instanceof arrow.List || deeplyNestedType instanceof arrow.LargeList)) {
    return null;
  }
  const deeplyNestedChildInfo = getCoordinateFieldInfo(deeplyNestedType.children[0]);
  if (!deeplyNestedChildInfo) {
    return null;
  }
  return {
    compatibleEncodings: ['geoarrow.multipolygon'],
    nesting: 3,
    ...deeplyNestedChildInfo
  };
}

/** Returns a value when all union children agree, or null for mixed children. */
function getCommonValue<T>(values: readonly T[]): T | null {
  const firstValue = values[0];
  return values.every(value => value === firstValue) ? firstValue : null;
}

/** Returns whether an Arrow type is a 32-bit or 64-bit offset list. */
function isListType(type: arrow.DataType): type is arrow.List | arrow.LargeList {
  return type instanceof arrow.List || type instanceof arrow.LargeList;
}

/**
 * @see https://geoarrow.org/format.html#memory-layouts
 */
function getCoordinateFieldInfo(arrowField: arrow.Field): CoordinateFieldInfo | null {
  if (isBoxField(arrowField)) {
    return null;
  }
  // interleaved case
  if (arrowField.type instanceof arrow.FixedSizeList) {
    const dimension = arrowField.type.listSize;
    if (dimension < 2 || dimension > 4) {
      return null;
    }

    const child = arrowField.type.children[0];
    // Spec currently only supports 64 bit coordinates
    if (!child || !(child.type instanceof arrow.Float)) {
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

    const coordinateNames = children.map(child => child.name);
    const validCoordinateNames = [
      ['x', 'y'],
      ['x', 'y', 'z'],
      ['x', 'y', 'm'],
      ['x', 'y', 'z', 'm']
    ];
    if (
      !validCoordinateNames.some(
        names =>
          names.length === coordinateNames.length &&
          names.every((name, index) => coordinateNames[index] === name)
      )
    ) {
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

function isBoxField(arrowField: arrow.Field): boolean {
  if (!(arrowField.type instanceof arrow.Struct)) return false;
  const names = arrowField.type.children.map(child => child.name);
  const expectedNames = [
    ['xmin', 'ymin', 'xmax', 'ymax'],
    ['xmin', 'ymin', 'zmin', 'xmax', 'ymax', 'zmax'],
    ['xmin', 'ymin', 'mmin', 'xmax', 'ymax', 'mmax'],
    ['xmin', 'ymin', 'zmin', 'mmin', 'xmax', 'ymax', 'zmax', 'mmax']
  ];
  return expectedNames.some(
    expected =>
      names.length === expected.length &&
      expected.every((name, index) => names[index] === name) &&
      arrowField.type.children.every(child => child.type instanceof arrow.Float)
  );
}
