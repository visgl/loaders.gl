// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Table} from 'apache-arrow';
import type {ReadableFile} from '@loaders.gl/core/loader-utils';
import type {GeoJSONTable, GeoJSONTableBatch, ObjectRowTable} from '@loaders.gl/core/schema';
import {convertWKBTableToGeoJSON} from '@loaders.gl/core/arrow-geometry/wkb-table';
import {convertArrowToTable} from '@loaders.gl/core/schema-utils';

import type {ParquetLoaderOptions} from '../../parquet-loader-options';
import {parseParquetArrowTable, parseParquetArrowTableInBatches} from './parse-parquet-tables';

export async function parseGeoParquetFile(
  file: ReadableFile,
  options?: ParquetLoaderOptions
): Promise<GeoJSONTable> {
  const arrowTable = await parseParquetArrowTable(file, options || {});
  const objectRowTable = convertArrowToTable(arrowTable, 'object-row-table') as ObjectRowTable;
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

function convertGeoParquetArrowBatch(batch: Table): GeoJSONTableBatch {
  const objectRowTable = convertArrowToTable(batch, 'object-row-table') as ObjectRowTable;
  const geojsonTable = convertWKBTableToGeoJSON(objectRowTable, objectRowTable.schema!);
  return {
    batchType: 'data',
    shape: geojsonTable.shape,
    type: geojsonTable.type,
    schema: geojsonTable.schema,
    features: geojsonTable.features,
    length: batch.numRows
  };
}
