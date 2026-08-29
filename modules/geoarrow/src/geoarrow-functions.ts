// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/**
 * @note Conforms to the GeoArrow memory layout
 * @see https://geoarrow.org/format.html#memory-layouts
 * @note this is aligned with the geoarrow-js library (MIT license)
 * @see https://github.com/geoarrow/geoarrow-js/
 */

import {DataType, LargeList, List} from 'apache-arrow/type';

import type {
  GeoArrowBoxType,
  GeoArrowPoint,
  GeoArrowList,
  GeoArrowLineString,
  GeoArrowPolygon,
  GeoArrowMultiPoint,
  GeoArrowMultiLineString,
  GeoArrowMultiPolygon,
  GeoArrowGeometry
} from './geoarrow-types';

/** Checks whether the given Apache Arrow JS type is a canonical GeoArrow Box struct. */
export function isGeoArrowBox(type: DataType): type is GeoArrowBoxType {
  if (!DataType.isStruct(type)) return false;
  const coordinateNames = type.children.map(field => field.name);
  const validCoordinateNames = [
    ['xmin', 'ymin', 'xmax', 'ymax'],
    ['xmin', 'ymin', 'zmin', 'xmax', 'ymax', 'zmax'],
    ['xmin', 'ymin', 'mmin', 'xmax', 'ymax', 'mmax'],
    ['xmin', 'ymin', 'zmin', 'mmin', 'xmax', 'ymax', 'zmax', 'mmax']
  ];
  return validCoordinateNames.some(
    names =>
      names.length === coordinateNames.length &&
      names.every((name, index) => coordinateNames[index] === name) &&
      type.children.every(field => DataType.isFloat(field.type))
  );
}

/** Checks whether the given Apache Arrow JS type is a Point data type */
export function isGeoArrowPoint(type: DataType): type is GeoArrowPoint {
  if (DataType.isFixedSizeList(type)) {
    // Check list size
    if (![2, 3, 4].includes(type.listSize)) {
      return false;
    }

    // Check child of FixedSizeList is floating type
    if (!DataType.isFloat(type.children[0])) {
      return false;
    }

    return true;
  }

  if (DataType.isStruct(type)) {
    const coordinateNames = type.children.map(field => field.name);
    const validCoordinateNames = [
      ['x', 'y'],
      ['x', 'y', 'z'],
      ['x', 'y', 'm'],
      ['x', 'y', 'z', 'm']
    ];
    return validCoordinateNames.some(
      names =>
        names.length === coordinateNames.length &&
        names.every((name, index) => coordinateNames[index] === name) &&
        type.children.every(field => DataType.isFloat(field.type))
    );
  }

  return false;
}

/** Checks whether the given Apache Arrow JS type is a Point data type */
export function isGeoArrowLineString(type: DataType): type is GeoArrowLineString {
  // Check the outer type is a List
  if (!isGeoArrowList(type)) {
    return false;
  }

  // Check the child is a point type
  if (!isGeoArrowPoint(type.children[0].type)) {
    return false;
  }

  return true;
}

/** Checks whether the given Apache Arrow JS type is a Polygon data type */
export function isGeoArrowPolygon(type: DataType): type is GeoArrowPolygon {
  // Check the outer vector is a List
  if (!isGeoArrowList(type)) {
    return false;
  }

  // Check the child is a linestring vector
  if (!isGeoArrowLineString(type.children[0].type)) {
    return false;
  }

  return true;
}

/** Checks whether the given Apache Arrow JS type is a Polygon data type */
export function isGeoArrowMultiPoint(type: DataType): type is GeoArrowMultiPoint {
  // Check the outer vector is a List
  if (!isGeoArrowList(type)) {
    return false;
  }

  // Check the child is a point vector
  if (!isGeoArrowPoint(type.children[0].type)) {
    return false;
  }

  return true;
}

/** Checks whether the given Apache Arrow JS type is a Polygon data type */
export function isGeoArrowMultiLineString(type: DataType): type is GeoArrowMultiLineString {
  // Check the outer vector is a List
  if (!isGeoArrowList(type)) {
    return false;
  }

  // Check the child is a linestring vector
  if (!isGeoArrowLineString(type.children[0].type)) {
    return false;
  }

  return true;
}

/** Checks whether the given Apache Arrow JS type is a Polygon data type */
export function isGeoArrowMultiPolygon(type: DataType): type is GeoArrowMultiPolygon {
  // Check the outer vector is a List
  if (!isGeoArrowList(type)) {
    return false;
  }

  // Check the child is a polygon vector
  if (!isGeoArrowPolygon(type.children[0].type)) {
    return false;
  }

  return true;
}

/** Checks both Arrow list widths used by the GeoArrow specification. */
function isGeoArrowList(type: DataType): type is GeoArrowList<DataType> {
  return type instanceof List || type instanceof LargeList;
}

/**
 * Checks if a given Arrow data type is a valid GeoArrowGeometry
 * @note this is somewhat inefficient, it checks the same things multiple times
 */
export function isGeoArrowGeometry(type: DataType): type is GeoArrowGeometry {
  return (
    isGeoArrowPoint(type) ||
    isGeoArrowLineString(type) ||
    isGeoArrowPolygon(type) ||
    isGeoArrowMultiPoint(type) ||
    isGeoArrowMultiLineString(type) ||
    isGeoArrowMultiPolygon(type)
  );
}

// CHILD EXTRACTION

/**
 * Strongly typed accessors for children, since arrow.Data.children[] is untyped
 
import { Data } from "apache-arrow/data";
import { Vector } from "apache-arrow/vector";
import { Float } from "apache-arrow/type";
import {
  LineStringData,
  MultiLineStringData,
  MultiPointData,
  MultiPolygonData,
  PointData,
  PolygonData,
} from "./data";
import {
  LineStringVector,
  MultiLineStringVector,
  MultiPointVector,
  MultiPolygonVector,
  PointVector,
  PolygonVector,
} from "./vector";

export function getPointChild(input: PointData): Data<Float>;
export function getPointChild(input: PointVector): Vector<Float>;

export function getPointChild(
  input: PointData | PointVector,
): Data<Float> | Vector<Float> {
  if ("data" in input) {
    return input.getChildAt(0)!;
  }

  return input.children[0] as Data<Float>;
}

export function getLineStringChild(input: LineStringData): PointData;
export function getLineStringChild(input: LineStringVector): PointVector;

export function getLineStringChild(
  input: LineStringData | LineStringVector,
): PointData | PointVector {
  if ("data" in input) {
    return input.getChildAt(0)!;
  }

  return input.children[0] as PointData;
}

export function getPolygonChild(input: PolygonData): LineStringData;
export function getPolygonChild(input: PolygonVector): LineStringVector;

export function getPolygonChild(
  input: PolygonData | PolygonVector,
): LineStringData | LineStringVector {
  if ("data" in input) {
    return input.getChildAt(0)!;
  }

  return input.children[0] as LineStringData;
}

export function getMultiPointChild(input: MultiPointData): PointData;
export function getMultiPointChild(input: MultiPointVector): PointVector;

export function getMultiPointChild(
  input: MultiPointData | MultiPointVector,
): PointData | PointVector {
  if ("data" in input) {
    return input.getChildAt(0)!;
  }

  return input.children[0] as PointData;
}

export function getMultiLineStringChild(
  input: MultiLineStringData,
): LineStringData;
export function getMultiLineStringChild(
  input: MultiLineStringVector,
): LineStringVector;

export function getMultiLineStringChild(
  input: MultiLineStringData | MultiLineStringVector,
): LineStringData | LineStringVector {
  if ("data" in input) {
    return input.getChildAt(0)!;
  }

  return input.children[0] as LineStringData;
}

export function getMultiPolygonChild(input: MultiPolygonData): PolygonData;
export function getMultiPolygonChild(input: MultiPolygonVector): PolygonVector;

export function getMultiPolygonChild(
  input: MultiPolygonData | MultiPolygonVector,
): PolygonData | PolygonVector {
  if ("data" in input) {
    return input.getChildAt(0)!;
  }

  return input.children[0] as PolygonData;
}
*/
