// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ArrowTable, ArrowTableBatch, BinaryGeometry, Field} from '@loaders.gl/schema';
import {
  type GeoParquetGeometryType,
  makeWKBGeometryField,
  setWKBGeometryColumnMetadata
} from '@loaders.gl/gis';
import {ArrowTableBuilder} from '@loaders.gl/schema-utils';
import {parseSHP, parseSHPInBatches} from './parse-shp';
import {
  convertBinaryGeometryToWKB,
  inferBinaryGeometryTypes
} from './convert-binary-geometry-to-wkb';
import type {SHPHeader} from './parse-shp-header';
import type {SHPLoaderOptions} from './types';

const GEOMETRY_COLUMN_NAME = 'geometry';

export function parseSHPToArrow(arrayBuffer: ArrayBuffer, options?: SHPLoaderOptions): ArrowTable {
  const result = parseSHP(arrayBuffer, options);
  const schema = buildOutputSchema(result.geometries, result.header);
  const tableBuilder = new ArrowTableBuilder(schema);

  for (const geometry of result.geometries) {
    tableBuilder.addObjectRow(makeArrowRow(geometry, result.header));
  }

  return tableBuilder.finishTable();
}

export async function* parseSHPToArrowInBatches(
  asyncIterator:
    | AsyncIterable<ArrayBufferLike | ArrayBufferView>
    | Iterable<ArrayBufferLike | ArrayBufferView>,
  options?: SHPLoaderOptions
): AsyncIterable<ArrowTableBatch> {
  const shpIterator = parseSHPInBatches(asyncIterator, options);
  let header: SHPHeader | undefined;
  let yieldedDataBatch = false;

  for await (const batch of shpIterator) {
    if (isSHPHeader(batch)) {
      header = batch;
      continue;
    }

    const geometries = batch as (BinaryGeometry | null)[];
    const schema = buildOutputSchema(geometries, header);
    const tableBuilder = new ArrowTableBuilder(schema);
    for (const geometry of geometries) {
      tableBuilder.addObjectRow(makeArrowRow(geometry, header));
    }
    const arrowBatch = tableBuilder.finishBatch();
    if (arrowBatch) {
      yieldedDataBatch = true;
      yield arrowBatch;
    }
  }

  if (!yieldedDataBatch) {
    yield makeEmptyArrowBatch(buildOutputSchema([], header));
  }
}

function buildOutputSchema(geometries: (BinaryGeometry | null)[], header?: SHPHeader) {
  const geometryField: Field = makeWKBGeometryField(GEOMETRY_COLUMN_NAME);
  const schema = {
    fields: [geometryField],
    metadata: {}
  };

  setWKBGeometryColumnMetadata(schema.metadata, {
    geometryColumnName: GEOMETRY_COLUMN_NAME,
    geometryTypes: inferGeometryTypes(geometries, header)
  });

  return schema;
}

function makeArrowRow(
  geometry: BinaryGeometry | null,
  header?: SHPHeader
): Record<string, unknown> {
  return {
    [GEOMETRY_COLUMN_NAME]: convertBinaryGeometryToWKB(geometry, header)
  };
}

function isSHPHeader(batch: unknown): batch is SHPHeader {
  return Boolean(batch && typeof batch === 'object' && 'type' in batch && 'length' in batch);
}

function inferGeometryTypes(
  geometries: (BinaryGeometry | null)[],
  header?: SHPHeader
): GeoParquetGeometryType[] {
  const geometryTypes = inferBinaryGeometryTypes(geometries);
  if (geometryTypes.length > 0) {
    return geometryTypes;
  }

  const fallbackType = getGeometryTypeFromHeader(header?.type);
  return fallbackType ? [fallbackType] : [];
}

function getGeometryTypeFromHeader(type?: number): GeoParquetGeometryType | null {
  switch (type) {
    case 1:
    case 11:
    case 21:
      return type === 11 ? 'Point Z' : 'Point';
    case 3:
    case 13:
    case 23:
      return type === 13 ? 'LineString Z' : 'LineString';
    case 5:
    case 15:
    case 25:
      return type === 15 ? 'Polygon Z' : 'Polygon';
    case 8:
    case 18:
    case 28:
      return type === 18 ? 'MultiPoint Z' : 'MultiPoint';
    default:
      return null;
  }
}

function makeEmptyArrowBatch(schema: ArrowTable['schema']): ArrowTableBatch {
  if (!schema) {
    throw new Error('SHP Arrow batch requires a schema');
  }
  const table = new ArrowTableBuilder(schema).finishTable();
  return {
    shape: 'arrow-table',
    batchType: 'data',
    length: 0,
    schema,
    data: table.data
  };
}
