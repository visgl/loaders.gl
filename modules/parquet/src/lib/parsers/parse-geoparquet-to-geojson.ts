// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ReadableFile} from '@loaders.gl/loader-utils';
import type {
  GeoJSONTable,
  GeoJSONTableBatch,
  ArrowTableBatch,
  ObjectRowTable
} from '@loaders.gl/schema';
import {convertWKBTableToGeoJSON} from '@loaders.gl/gis';
import {convertArrowToTable} from '@loaders.gl/schema-utils';

import type {ParquetLoaderOptions} from '../../parquet-loader-options';
import {parseParquetArrowTable, parseParquetArrowTableInBatches} from './parse-parquet-tables';

export async function parseGeoParquetFile(
  file: ReadableFile,
  options?: ParquetLoaderOptions
): Promise<GeoJSONTable> {
  const arrowTable = await parseParquetArrowTable(file, options || {});
  const objectRowTable = convertArrowToTable(arrowTable.data, 'object-row-table') as ObjectRowTable;
  return convertWKBTableToGeoJSON(objectRowTable, objectRowTable.schema!);
}

export async function* parseGeoParquetFileInBatches(
  file: ReadableFile,
  options?: ParquetLoaderOptions
): AsyncIterable<GeoJSONTableBatch> {
  const tableBatches = parseParquetArrowTableInBatches(file, options || {});

  for await (const batch of tableBatches) {
    yield convertGeoParquetArrowBatch(batch);
  }
}

function convertGeoParquetArrowBatch(batch: ArrowTableBatch): GeoJSONTableBatch {
  const objectRowTable = convertArrowToTable(batch.data, 'object-row-table') as ObjectRowTable;
  const geojsonTable = convertWKBTableToGeoJSON(objectRowTable, objectRowTable.schema!);
  return {
    batchType: batch.batchType,
    shape: geojsonTable.shape,
    type: geojsonTable.type,
    schema: geojsonTable.schema,
    features: geojsonTable.features,
    length: batch.length
  };
}
