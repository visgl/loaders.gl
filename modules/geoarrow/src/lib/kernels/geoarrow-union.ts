// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import type {GeoArrowDimension} from '@loaders.gl/schema';

export {getGeoArrowUnionGeometryKind, type GeoArrowUnionGeometryKind} from '@loaders.gl/gis';

/** Resolves a dense-union child dimension from its name, physical type, or canonical ID. */
export function getGeoArrowUnionDimension(
  fieldName: string | undefined,
  type: arrow.DataType | undefined,
  typeId: number
): GeoArrowDimension | null {
  if (fieldName && /\sZM$/i.test(fieldName)) return 'xyzm';
  if (fieldName && /\sM$/i.test(fieldName)) return 'xym';
  if (fieldName && /\sZ$/i.test(fieldName)) return 'xyz';
  const physicalDimension = getPhysicalCoordinateDimension(type);
  if (physicalDimension) return physicalDimension;
  const dimensionBand = Math.floor(typeId / 10);
  return dimensionBand === 3
    ? 'xyzm'
    : dimensionBand === 2
      ? 'xym'
      : dimensionBand === 1
        ? 'xyz'
        : dimensionBand === 0
          ? 'xy'
          : null;
}

/** Infers the coordinate memory layout used below a union child type. */
export function getGeoArrowUnionCoordinateLayout(
  type: arrow.DataType | undefined
): 'interleaved' | 'separated' | null {
  if (!type) return null;
  if (type instanceof arrow.FixedSizeList) return 'interleaved';
  if (type instanceof arrow.Struct) return 'separated';
  if (type instanceof arrow.List || type instanceof arrow.LargeList) {
    return getGeoArrowUnionCoordinateLayout(type.children[0]?.type);
  }
  if (type instanceof arrow.DenseUnion) {
    const layouts = type.children
      .map(child => getGeoArrowUnionCoordinateLayout(child.type))
      .filter((layout): layout is 'interleaved' | 'separated' => layout !== null);
    return layouts.length > 0 && layouts.every(layout => layout === layouts[0]) ? layouts[0] : null;
  }
  return null;
}

/** Infers the coordinate dimension from a concrete native Arrow type. */
function getPhysicalCoordinateDimension(
  type: arrow.DataType | undefined
): GeoArrowDimension | null {
  if (!type) return null;
  let coordinateType = type;
  while (coordinateType instanceof arrow.List || coordinateType instanceof arrow.LargeList) {
    coordinateType = coordinateType.children[0]?.type;
    if (!coordinateType) return null;
  }
  if (coordinateType instanceof arrow.FixedSizeList) {
    return coordinateType.listSize === 4
      ? 'xyzm'
      : coordinateType.listSize === 3
        ? 'xyz'
        : coordinateType.listSize === 2
          ? 'xy'
          : null;
  }
  if (coordinateType instanceof arrow.Struct) {
    const names = new Set(coordinateType.children.map(field => field.name));
    if (names.has('z') && names.has('m')) return 'xyzm';
    if (names.has('m')) return 'xym';
    if (names.has('z')) return 'xyz';
    if (names.has('x') && names.has('y')) return 'xy';
  }
  return null;
}
