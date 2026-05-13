// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ArrowTable, ArrowTableBatch, Field} from '@loaders.gl/schema';
import {
  type GeoParquetGeometryType,
  makeWKBGeometryField,
  setWKBGeometryColumnMetadata
} from '@loaders.gl/gis';
import {ArrowTableBuilder} from '@loaders.gl/schema-utils';
import {parseSHPInBatches} from './parse-shp';
import {parseSHPHeader, type SHPHeader} from './parse-shp-header';
import type {SHPLoaderOptions} from './types';
import {
  type SHPWKBGeometry,
  makeSHPWKBGeometryArrowTable,
  makeWKBGeometryArrowTable
} from './build-wkb-geometry-arrow';
import {makeSHPGeoArrowGeometryTable} from './build-geoarrow-geometry-arrow';

const GEOMETRY_COLUMN_NAME = 'geometry';
const SHP_HEADER_SIZE = 100;

export function parseSHPToArrow(arrayBuffer: ArrayBuffer, options?: SHPLoaderOptions): ArrowTable {
  if (shouldUseTypedGeoArrow(options?.shp?.geoarrowEncoding)) {
    return makeSHPGeoArrowGeometryTable(arrayBuffer, options);
  }

  const header = parseSHPHeader(new DataView(arrayBuffer, 0, SHP_HEADER_SIZE));
  const schema = buildOutputSchema(header);
  return makeSHPWKBGeometryArrowTable(arrayBuffer, schema, options);
}

export async function* parseSHPToArrowInBatches(
  asyncIterator:
    | AsyncIterable<ArrayBufferLike | ArrayBufferView>
    | Iterable<ArrayBufferLike | ArrayBufferView>,
  options?: SHPLoaderOptions
): AsyncIterable<ArrowTableBatch> {
  if (shouldUseTypedGeoArrow(options?.shp?.geoarrowEncoding)) {
    throw new Error('Typed GeoArrow SHP output is only supported for non-streaming parse.');
  }

  const shpIterator = parseSHPInBatches(asyncIterator, getWKBOptions(options));
  let header: SHPHeader | undefined;
  let yieldedDataBatch = false;

  for await (const batch of shpIterator) {
    if (isSHPHeader(batch)) {
      header = batch;
      continue;
    }

    const geometries = batch as (SHPWKBGeometry | null)[];
    const schema = buildOutputSchema(header);
    const arrowTable = makeWKBGeometryArrowTable(geometries, schema);
    yieldedDataBatch = true;
    yield {
      shape: 'arrow-table',
      batchType: 'data',
      length: arrowTable.data.numRows,
      schema: arrowTable.schema,
      data: arrowTable.data
    };
  }

  if (!yieldedDataBatch) {
    yield makeEmptyArrowBatch(buildOutputSchema(header));
  }
}

function shouldUseTypedGeoArrow(encoding: unknown): boolean {
  return encoding === 'geoarrow';
}

function buildOutputSchema(header?: SHPHeader) {
  const geometryField: Field = makeWKBGeometryField(GEOMETRY_COLUMN_NAME);
  const schema = {
    fields: [geometryField],
    metadata: {}
  };

  setWKBGeometryColumnMetadata(schema.metadata, {
    geometryColumnName: GEOMETRY_COLUMN_NAME,
    geometryTypes: inferGeometryTypes(header)
  });

  return schema;
}

function isSHPHeader(batch: unknown): batch is SHPHeader {
  return Boolean(batch && typeof batch === 'object' && 'type' in batch && 'length' in batch);
}

function inferGeometryTypes(header?: SHPHeader): GeoParquetGeometryType[] {
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

function getWKBOptions(options?: SHPLoaderOptions): SHPLoaderOptions {
  return {
    ...options,
    shp: {
      ...options?.shp,
      shape: 'wkb'
    }
  };
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
