// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderContext} from '@loaders.gl/loader-utils';
import {
  parseFromContext,
  parseInBatchesFromContext,
  toArrayBufferIterator
} from '@loaders.gl/loader-utils';
import * as arrow from 'apache-arrow';
import type {
  ArrowTable,
  ArrowTableBatch,
  BinaryGeometry,
  Field,
  Schema as TableSchema
} from '@loaders.gl/schema';
import {ArrowTableBuilder, convertSchemaToArrow} from '@loaders.gl/schema-utils';
import {
  type GeoParquetGeometryType,
  makeWKBGeometryField,
  setWKBGeometryColumnMetadata
} from '@loaders.gl/gis';
import {Proj4Projection} from '@math.gl/proj4';
import {SHPLoaderWithParser} from './shp-loader-with-parser';
import {DBFLoaderWithParser} from './dbf-loader-with-parser';
import type {ShapefileLoaderOptions} from './shapefile-loader';
import type {SHPResult} from './lib/parsers/parse-shp';
import type {SHPHeader} from './lib/parsers/parse-shp-header';
import {
  convertBinaryGeometryToWKB,
  inferBinaryGeometryTypes
} from './lib/parsers/convert-binary-geometry-to-wkb';
import {loadShapefileSidecarFiles, replaceExtension} from './lib/parsers/parse-shapefile';
const GEOMETRY_COLUMN_NAME = 'geometry';

/** Parses a shapefile and returns an Arrow table with a WKB geometry column. */
export async function parseShapefileToArrow(
  arrayBuffer: ArrayBuffer,
  options?: ShapefileLoaderOptions,
  context?: LoaderContext
): Promise<ArrowTable> {
  const {header, geometries} = (await parseFromContext(
    arrayBuffer,
    SHPLoaderWithParser,
    {
      ...options,
      shp: {
        ...options?.shp,
        shape: 'binary-geometry'
      }
    },
    context!
  )) as SHPResult;
  const {cpg, prj} = await loadShapefileSidecarFiles(options, context);
  const transform = getReprojectionTransform(prj, options);

  let propertySchema: TableSchema | null = null;
  let propertyTable: ArrowTable | null = null;

  const dbfResponse = await context?.fetch(replaceExtension(context?.url || '', 'dbf'));
  if (dbfResponse?.ok) {
    propertyTable = (await parseFromContext(
      dbfResponse as any,
      DBFLoaderWithParser,
      {
        ...options,
        dbf: {
          ...options?.dbf,
          shape: 'arrow-table' as const,
          encoding: cpg || 'latin1'
        }
      },
      context!
    )) as ArrowTable;
    propertySchema = propertyTable.schema || null;
  }

  const schema = buildOutputSchema(propertySchema, geometries, header);
  const geometryTable = makeGeometryArrowTable(geometries, header, transform);
  return propertyTable
    ? appendGeometryColumnToArrowTable(propertyTable, geometryTable, schema)
    : geometryTable;
}

/** Parses a shapefile into Arrow batches while keeping DBF-derived schema stable. */
export async function* parseShapefileToArrowInBatches(
  asyncIterator:
    | AsyncIterable<ArrayBufferLike | ArrayBufferView>
    | Iterable<ArrayBufferLike | ArrayBufferView>,
  options?: ShapefileLoaderOptions,
  context?: LoaderContext
): AsyncIterable<ArrowTableBatch> {
  const {cpg, prj} = await loadShapefileSidecarFiles(options, context);
  const batchSize =
    options?.shapefile?.batchSize || options?.shp?.batchSize || options?.dbf?.batchSize || 10000;

  const shapeIterable = await parseInBatchesFromContext(
    toArrayBufferIterator(asyncIterator),
    SHPLoaderWithParser,
    {
      ...options,
      shp: {
        ...options?.shp,
        shape: 'binary-geometry',
        batchSize
      }
    },
    context!
  );
  const shapeIterator = getAsyncIterator(shapeIterable);

  const shapeHeader = await getNextNonMetadataValue(shapeIterator);
  const header = shapeHeader as SHPHeader;

  let propertyIterator: AsyncIterator<any> | null = null;
  let propertySchema: TableSchema | null = null;

  const dbfResponse = await context?.fetch(replaceExtension(context?.url || '', 'dbf'));
  if (dbfResponse?.ok) {
    const dbfOptions = {
      ...options,
      dbf: {
        ...options?.dbf,
        shape: 'arrow-table' as const,
        batchSize,
        encoding: cpg || 'latin1'
      }
    };
    const propertyIterable = await parseInBatchesFromContext(
      dbfResponse,
      DBFLoaderWithParser,
      dbfOptions,
      context!
    );
    propertyIterator = getAsyncIterator(propertyIterable);

    const firstPropertyBatch = await getNextArrowBatch(propertyIterator);
    propertySchema = firstPropertyBatch?.schema || null;
    const outputSchema = buildOutputSchema(propertySchema, [], header);
    const propertyQueue: arrow.Table[] = [];
    const geometryQueue: arrow.Table[] = [];
    let yieldedDataBatch = false;

    if (firstPropertyBatch && firstPropertyBatch.length > 0) {
      propertyQueue.push(firstPropertyBatch.data);
    }

    let shapeDone = false;
    let propertyDone = false;
    while (
      !shapeDone ||
      !propertyDone ||
      getQueuedRowCount(geometryQueue) > 0 ||
      getQueuedRowCount(propertyQueue) > 0
    ) {
      if (!shapeDone && getQueuedRowCount(geometryQueue) === 0) {
        const shapeBatch = await shapeIterator.next();
        if (shapeBatch.done) {
          shapeDone = true;
        } else if (shapeBatch.value?.batchType !== 'metadata') {
          const transform = getReprojectionTransform(prj, options);
          geometryQueue.push(
            makeGeometryArrowTable(shapeBatch.value as (BinaryGeometry | null)[], header, transform)
              .data
          );
        }
      }

      if (!propertyDone && getQueuedRowCount(propertyQueue) < getQueuedRowCount(geometryQueue)) {
        const propertyBatch = await getNextArrowBatch(propertyIterator);
        if (!propertyBatch) {
          propertyDone = true;
        } else if (propertyBatch.length > 0) {
          propertyQueue.push(propertyBatch.data);
        }
      }

      const rowCount = Math.min(getQueuedRowCount(geometryQueue), getQueuedRowCount(propertyQueue));
      if (rowCount === 0) {
        if (
          (shapeDone && getQueuedRowCount(geometryQueue) === 0) ||
          (propertyDone && getQueuedRowCount(propertyQueue) === 0)
        ) {
          break;
        }
        continue;
      }

      const propertyTable = takeRowsFromQueue(propertyQueue, rowCount);
      const geometryTable = takeRowsFromQueue(geometryQueue, rowCount);
      const batch = appendGeometryColumnToArrowTable(
        {shape: 'arrow-table', schema: propertySchema || undefined, data: propertyTable},
        {shape: 'arrow-table', data: geometryTable},
        outputSchema
      );
      yieldedDataBatch = true;
      yield {
        shape: 'arrow-table',
        batchType: 'data',
        length: batch.data.numRows,
        schema: batch.schema,
        data: batch.data
      };
    }
    if (!yieldedDataBatch) {
      yield makeEmptyArrowBatch(outputSchema);
    }
    return;
  }

  const outputSchema = buildOutputSchema(null, [], header);
  let yieldedDataBatch = false;

  while (true) {
    const shapeBatch = await shapeIterator.next();
    if (shapeBatch.done) {
      break;
    }
    if (shapeBatch.value?.batchType === 'metadata') {
      continue;
    }
    const transform = getReprojectionTransform(prj, options);
    const batchBuilder = new ArrowTableBuilder(outputSchema);
    for (const geometry of shapeBatch.value as (BinaryGeometry | null)[]) {
      batchBuilder.addObjectRow(makeArrowRow(undefined, geometry, header, transform));
    }
    const batch = batchBuilder.finishBatch();
    if (batch) {
      yieldedDataBatch = true;
      yield batch;
    }
  }
  if (!yieldedDataBatch) {
    yield makeEmptyArrowBatch(outputSchema);
  }
}

/** Creates the output Arrow schema by appending the WKB geometry column to DBF fields. */
function buildOutputSchema(
  propertySchema: TableSchema | null,
  geometries: (BinaryGeometry | null)[],
  header?: SHPHeader
): TableSchema {
  const geometryField: Field = makeWKBGeometryField(GEOMETRY_COLUMN_NAME);
  const schema: TableSchema = {
    fields: [...(propertySchema?.fields || []), geometryField],
    metadata: {
      ...(propertySchema?.metadata || {})
    }
  };

  setWKBGeometryColumnMetadata(schema.metadata!, {
    geometryColumnName: GEOMETRY_COLUMN_NAME,
    geometryTypes: inferGeometryTypes(geometries, header)
  });

  return schema;
}

/** Combines one property row and one geometry into an Arrow-builder friendly object row. */
function makeArrowRow(
  propertyRow: Record<string, unknown> | undefined,
  geometry: BinaryGeometry | null | undefined,
  header?: SHPHeader,
  transform?: (coordinate: number[]) => number[]
): Record<string, unknown> {
  return {
    ...(propertyRow || {}),
    [GEOMETRY_COLUMN_NAME]: convertBinaryGeometryToWKB(geometry || null, header, transform)
  };
}

function makeGeometryArrowTable(
  geometries: (BinaryGeometry | null | undefined)[],
  header?: SHPHeader,
  transform?: (coordinate: number[]) => number[]
) {
  const geometrySchema = buildOutputSchema(
    null,
    geometries.filter(Boolean) as BinaryGeometry[],
    header
  );
  const tableBuilder = new ArrowTableBuilder(geometrySchema);
  for (const geometry of geometries) {
    tableBuilder.addObjectRow(makeArrowRow(undefined, geometry, header, transform));
  }
  return tableBuilder.finishTable();
}

function appendGeometryColumnToArrowTable(
  propertyTable: ArrowTable,
  geometryTable: ArrowTable,
  schema: TableSchema
): ArrowTable {
  const propertyBatch = propertyTable.data.batches[0];
  const geometryBatch = geometryTable.data.batches[0];
  const arrowSchema = convertSchemaToArrow(schema);
  const structField = new arrow.Struct(arrowSchema.fields);
  const children = [...propertyBatch.data.children, geometryBatch.data.children[0]];
  const rowCount = Math.max(propertyTable.data.numRows, geometryTable.data.numRows);
  const structData = new arrow.Data(structField, 0, rowCount, 0, undefined, children);
  const recordBatch = new arrow.RecordBatch(arrowSchema, structData);

  return {
    shape: 'arrow-table',
    schema,
    data: new arrow.Table(arrowSchema, [recordBatch])
  };
}

function getReprojectionTransform(
  sourceCrs: string | undefined,
  options?: ShapefileLoaderOptions
): ((coordinate: number[]) => number[]) | undefined {
  const {reproject = false, _targetCrs = 'WGS84'} = options?.gis || {};
  if (!reproject) {
    return undefined;
  }
  const projection = new Proj4Projection({from: sourceCrs || 'WGS84', to: _targetCrs || 'WGS84'});
  return coordinate => projection.project(coordinate);
}

/** Infers GeoParquet geometry type metadata from parsed geometries or the SHP header. */
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

/** Maps SHP header geometry type codes to GeoParquet geometry type strings. */
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

/** Normalizes sync or async iterables to a single async iterator interface. */
function getAsyncIterator(iterable: AsyncIterable<any> | Iterable<any>): AsyncIterator<any> {
  const iterator = iterable[Symbol.asyncIterator]?.() || iterable[Symbol.iterator]?.();
  return iterator as AsyncIterator<any>;
}

/** Reads the next non-metadata value from a parser iterator. */
async function getNextNonMetadataValue(iterator: AsyncIterator<any>): Promise<any> {
  while (true) {
    const result = await iterator.next();
    if (result.done) {
      return null;
    }
    if (result.value?.batchType !== 'metadata') {
      return result.value;
    }
  }
}

async function getNextArrowBatch(iterator: AsyncIterator<any>): Promise<ArrowTableBatch | null> {
  while (true) {
    const result = await iterator.next();
    if (result.done) {
      return null;
    }
    if (result.value?.shape === 'arrow-table') {
      return result.value;
    }
  }
}

function getQueuedRowCount(queue: arrow.Table[]): number {
  return queue.reduce((rowCount, table) => rowCount + table.numRows, 0);
}

function takeRowsFromQueue(queue: arrow.Table[], rowCount: number): arrow.Table {
  const table = queue[0];
  if (rowCount === table.numRows) {
    queue.shift();
    return table;
  }
  const result = table.slice(0, rowCount);
  queue[0] = table.slice(rowCount, table.numRows - rowCount);
  return result;
}

/** Creates an explicit empty Arrow batch so zero-row shapefiles still expose schema in batch mode. */
function makeEmptyArrowBatch(schema: TableSchema): ArrowTableBatch {
  const table = new ArrowTableBuilder(schema).finishTable();
  return {
    shape: 'arrow-table',
    batchType: 'data',
    length: 0,
    schema,
    data: table.data
  };
}
