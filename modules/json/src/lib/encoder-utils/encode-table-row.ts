// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Copyright 2022 Foursquare Labs, Inc.

import type {Feature, Geometry, Table} from '@loaders.gl/schema';
import {getTableRowAsObject} from '@loaders.gl/schema-utils';
import {getRowPropertyObject, parseGeometryString} from './encode-utils';
import {Utf8ArrayBufferEncoder} from './utf8-encoder';

type Row = {[key: string]: unknown};

// Helpers

/**
 * Encode a row. Currently this ignores properties in the geometry column.
 */
export function encodeTableRow(
  table: Table,
  rowIndex: number,
  geometryColumnIndex: number,
  utf8Encoder: Utf8ArrayBufferEncoder
): void {
  const row = getTableRowAsObject(table, rowIndex);
  if (!row) return;
  const featureWithProperties = getFeatureFromRow(table, row, geometryColumnIndex);
  const featureString = JSON.stringify(featureWithProperties);
  utf8Encoder.push(featureString);
}

/**
 * Encode a row as a Feature. Currently this ignores properties objects in the geometry column.
 */
function getFeatureFromRow(table: Table, row: Row, geometryColumnIndex: number): Feature {
  // Extract non-feature/geometry properties
  const properties = getRowPropertyObject(table, row, [geometryColumnIndex]);

  // Extract geometry feature
  const columnName = table.schema?.fields[geometryColumnIndex].name;
  let featureOrGeometry =
    columnName && (row[columnName] as Feature | Geometry | string | null | undefined);

  // GeoJSON support null geometries
  if (!featureOrGeometry) {
    // @ts-ignore Feature type does not support null geometries
    return {type: 'Feature', geometry: null, properties};
  }

  if (typeof featureOrGeometry === 'string') {
    const parsedGeometry = parseGeometryString(featureOrGeometry);
    if (!parsedGeometry) {
      throw new Error('Invalid string geometry');
    }
    featureOrGeometry = parsedGeometry;
  }

  if (typeof featureOrGeometry !== 'object' || typeof featureOrGeometry?.type !== 'string') {
    throw new Error('invalid geometry column value');
  }

  if (featureOrGeometry?.type === 'Feature') {
    // @ts-ignore Feature type does not support null geometries
    return {...featureOrGeometry, properties};
  }

  // @ts-ignore Feature type does not support null geometries
  return {type: 'Feature', geometry: featureOrGeometry, properties};
}
