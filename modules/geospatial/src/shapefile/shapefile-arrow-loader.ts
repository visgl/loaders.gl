// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {CRSReprojectionError, type LoaderContext} from '@loaders.gl/core/loader-utils';
import {
  parseFromContext,
  parseInBatchesFromContext,
  toArrayBufferIterator
} from '@loaders.gl/core/loader-utils';
import * as arrow from 'apache-arrow';
import {convertArrowToSchema, isArrowRecordBatch} from '@loaders.gl/core/schema-utils';
import type {Field, Schema as TableSchema} from '@loaders.gl/core/schema';
import {
  makeArrowMetadataBatch,
  makeArrowRecordBatch,
  convertSchemaToArrow
} from '@loaders.gl/core/schema-utils';
import {convertFeaturesToGeoArrowTable} from '@loaders.gl/core/arrow-geometry/feature-table';
import {convertWKBToGeometry} from '@loaders.gl/core/arrow-geometry/geometry-codecs';
import {type GeoParquetGeometryType} from '@loaders.gl/core/schema';
import {
  makeWKBGeometryField,
  setWKBGeometryColumnMetadata
} from '@loaders.gl/core/arrow-geometry/geometry-field';
import {projectionEngine} from '@math.gl/geospatial/projection';
import type {ReadonlyCRSDefinition, WKTCRSDefinition} from '@math.gl/geospatial/crs';
import {SHPLoaderWithParser} from './shp-loader';
import {DBFLoaderWithParser} from './dbf-loader';
import type {ShapefileLoaderOptions} from './shapefile-loader-types';
import type {SHPResult} from './lib/parsers/parse-shp';
import type {SHPHeader} from './lib/parsers/parse-shp-header';
import {loadShapefileSidecarFiles, replaceExtension} from './lib/parsers/parse-shapefile';
import {
  type SHPWKBGeometry,
  makeWKBGeometryArrowTable
} from './lib/parsers/build-wkb-geometry-arrow';
import {makeSHPGeoArrowGeometryTable} from './lib/parsers/build-geoarrow-geometry-arrow';
const GEOMETRY_COLUMN_NAME = 'geometry';

/** Parses a shapefile and returns an Arrow table with a WKB geometry column. */
export async function parseShapefileToArrow(
  arrayBuffer: ArrayBuffer,
  options?: ShapefileLoaderOptions,
  context?: LoaderContext
): Promise<arrow.Table> {
  const {cpg, prj, shx} = await loadShapefileSidecarFiles(options, context);
  const transform = getReprojectionTransform(prj, options);
  const geoArrowEncoding = getTypedGeoArrowEncoding(options);
  let header: SHPHeader | undefined;
  let geometryTable: arrow.Table;

  if (geoArrowEncoding) {
    geometryTable = makeSHPGeoArrowGeometryTable(arrayBuffer, options, {transform});
  } else {
    const shpResult = (await parseFromContext(
      arrayBuffer,
      SHPLoaderWithParser,
      {
        ...options,
        shp: {
          ...options?.shp,
          shape: 'wkb'
        }
      },
      context!
    )) as SHPResult;
    header = shpResult.header;
    geometryTable = makeGeometryArrowTable(
      shpResult.geometries as (SHPWKBGeometry | null)[],
      header,
      transform
    );
    if (
      options?.geoarrow?.encodingPreference === 'geoarrow.geometry' ||
      options?.shapefile?.geoarrow?.encodingPreference === 'geoarrow.geometry'
    ) {
      const geometryColumn = geometryTable.getChild(GEOMETRY_COLUMN_NAME);
      const geometries = geometryColumn?.toArray() || [];
      geometryTable = convertFeaturesToGeoArrowTable(
        geometries.map(geometry => ({
          type: 'Feature' as const,
          geometry: geometry ? convertWKBToGeometry(geometry.slice().buffer) : null,
          properties: {}
        })),
        {encodingPreference: 'geoarrow.geometry'}
      );
    }
  }

  let propertySchema: TableSchema | null = null;
  let propertyTable: arrow.Table | null = null;

  const dbfResponse = context?.url
    ? await context.fetch(replaceExtension(context.url, 'dbf')).catch(() => null)
    : null;
  if (dbfResponse?.ok) {
    const propertyData = (await parseFromContext(
      dbfResponse as any,
      DBFLoaderWithParser,
      {
        ...options,
        dbf: {
          ...options?.dbf,
          shape: 'arrow' as const,
          encoding: cpg || 'latin1'
        }
      },
      context!
    )) as arrow.Table;
    propertySchema = convertArrowToSchema(propertyData.schema);
    propertyTable = propertyData;
  }

  const schema = buildOutputSchema(
    propertySchema,
    header,
    convertArrowToSchema(geometryTable.schema)
  );
  const table = propertyTable
    ? appendGeometryColumnToArrowTable(propertyTable, geometryTable, schema)
    : geometryTable;
  const encoded = encodeShapefileHeader({header, encoding: cpg, prj, shx});
  table.schema.metadata.set(SHAPEFILE_HEADER_KEY, encoded);
  for (const batch of table.batches) batch.schema.metadata.set(SHAPEFILE_HEADER_KEY, encoded);
  return table;
}

/** Parses a shapefile into Arrow batches while keeping DBF-derived schema stable. */
export async function* parseShapefileToArrowInBatches(
  asyncIterator:
    | AsyncIterable<ArrayBufferLike | ArrayBufferView>
    | Iterable<ArrayBufferLike | ArrayBufferView>,
  options?: ShapefileLoaderOptions,
  context?: LoaderContext
): AsyncIterable<arrow.RecordBatch> {
  if (getTypedGeoArrowEncoding(options)) {
    throw new Error('Typed GeoArrow shapefile output is only supported for non-streaming parse.');
  }

  const {cpg, prj, shx} = await loadShapefileSidecarFiles(options, context);
  const batchSize =
    typeof options?.core?.batchSize === 'number'
      ? options.core.batchSize
      : (options?.shapefile?.batchSize ??
        options?.shp?.batchSize ??
        options?.dbf?.batchSize ??
        10000);
  const childOptions = {
    ...options,
    core: {...options?.core, batchMaxRowsPerSecond: 0}
  };

  const shapeIterable = await parseInBatchesFromContext(
    toArrayBufferIterator(asyncIterator),
    SHPLoaderWithParser,
    {
      ...childOptions,
      shp: {
        ...options?.shp,
        shape: 'wkb',
        batchSize
      }
    },
    context!
  );
  const shapeIterator = getAsyncIterator(shapeIterable);

  const shapeHeader = await getNextNonMetadataValue(shapeIterator);
  const header = shapeHeader as SHPHeader;
  const encodedHeader = encodeShapefileHeader({header, encoding: cpg, prj, shx});

  let propertyIterator: AsyncIterator<any> | null = null;
  let propertySchema: TableSchema | null = null;

  const dbfResponse = context?.url
    ? await context.fetch(replaceExtension(context.url, 'dbf')).catch(() => null)
    : null;
  if (dbfResponse?.ok) {
    const dbfOptions = {
      ...childOptions,
      dbf: {
        ...options?.dbf,
        shape: 'arrow' as const,
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
    propertySchema = firstPropertyBatch ? convertArrowToSchema(firstPropertyBatch.schema) : null;
    const outputSchema = buildOutputSchema(propertySchema, header);
    const propertyQueue: arrow.Table[] = [];
    const geometryQueue: arrow.Table[] = [];
    let yieldedDataBatch = false;

    if (firstPropertyBatch && firstPropertyBatch.numRows > 0) {
      propertyQueue.push(new arrow.Table(firstPropertyBatch.schema, [firstPropertyBatch]));
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
            makeGeometryArrowTable(shapeBatch.value as (SHPWKBGeometry | null)[], header, transform)
          );
        }
      }

      if (!propertyDone && getQueuedRowCount(propertyQueue) < getQueuedRowCount(geometryQueue)) {
        const propertyBatch = await getNextArrowBatch(propertyIterator);
        if (!propertyBatch) {
          propertyDone = true;
        } else if (propertyBatch.numRows > 0) {
          propertyQueue.push(new arrow.Table(propertyBatch.schema, [propertyBatch]));
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
      const batch = appendGeometryColumnToArrowTable(propertyTable, geometryTable, outputSchema);
      yieldedDataBatch = true;
      const recordBatch = batch.batches[0];
      recordBatch.schema.metadata.set(SHAPEFILE_HEADER_KEY, encodedHeader);
      yield recordBatch;
    }
    if (!yieldedDataBatch) {
      yield makeEmptyArrowBatch(outputSchema, encodedHeader);
    }
    return;
  }

  const outputSchema = buildOutputSchema(null, header);
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
    const arrowTable = makeGeometryArrowTable(
      shapeBatch.value as (SHPWKBGeometry | null)[],
      header,
      transform
    );
    yieldedDataBatch = true;
    for (const batch of arrowTable.batches) {
      batch.schema.metadata.set(SHAPEFILE_HEADER_KEY, encodedHeader);
      yield batch;
    }
  }
  if (!yieldedDataBatch) {
    yield makeEmptyArrowBatch(outputSchema, encodedHeader);
  }
}

/** Creates the output Arrow schema by appending the WKB geometry column to DBF fields. */
function buildOutputSchema(
  propertySchema: TableSchema | null,
  header?: SHPHeader,
  geometrySchema?: TableSchema
): TableSchema {
  const geometryField: Field =
    geometrySchema?.fields[0] || makeWKBGeometryField(GEOMETRY_COLUMN_NAME);
  const schema: TableSchema = {
    fields: [...(propertySchema?.fields || []), geometryField],
    metadata: {
      ...(propertySchema?.metadata || {}),
      ...(geometrySchema?.metadata || {})
    }
  };

  if (!geometrySchema) {
    setWKBGeometryColumnMetadata(schema.metadata!, {
      geometryColumnName: GEOMETRY_COLUMN_NAME,
      geometryTypes: inferGeometryTypes(header)
    });
  }

  return schema;
}

function makeGeometryArrowTable(
  geometries: (SHPWKBGeometry | null | undefined)[],
  header?: SHPHeader,
  transform?: (coordinate: number[]) => number[]
) {
  const geometrySchema = buildOutputSchema(null, header);
  return makeWKBGeometryArrowTable(geometries, geometrySchema, transform);
}

function appendGeometryColumnToArrowTable(
  propertyTable: arrow.Table,
  geometryTable: arrow.Table,
  schema: TableSchema
): arrow.Table {
  const propertyBatch = propertyTable.batches[0];
  const geometryBatch = geometryTable.batches[0];
  const arrowSchema = convertSchemaToArrow(schema);
  const structField = new arrow.Struct(arrowSchema.fields);
  const children = [...propertyBatch.data.children, geometryBatch.data.children[0]];
  const rowCount = Math.max(propertyTable.numRows, geometryTable.numRows);
  const structData = new arrow.Data(structField, 0, rowCount, 0, undefined, children);
  const recordBatch = new arrow.RecordBatch(arrowSchema, structData);

  return new arrow.Table(arrowSchema, [recordBatch]);
}

function getReprojectionTransform(
  sourceCrs: WKTCRSDefinition | undefined,
  options?: ShapefileLoaderOptions
): ((coordinate: number[]) => number[]) | undefined {
  const {reproject = false, targetCrs = 'WGS84'} = options?.gis || {};
  if (!reproject) {
    return undefined;
  }
  if (!sourceCrs) {
    throw new CRSReprojectionError(
      'missing-source-crs',
      'Shapefile reprojection requires a source CRS from the .prj sidecar file',
      {targetCrs}
    );
  }
  try {
    const projection = projectionEngine.createProjection({
      from: sourceCrs,
      to: (targetCrs || 'WGS84') as ReadonlyCRSDefinition
    });
    return coordinate => projection.projectSync(coordinate);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new CRSReprojectionError(
      'transformation-failed',
      `Shapefile reprojection failed: ${message}`,
      {sourceCrs, targetCrs: targetCrs || 'WGS84', cause: error}
    );
  }
}

function getTypedGeoArrowEncoding(options?: ShapefileLoaderOptions): boolean {
  const encoding = options?.shapefile?.geoarrowEncoding || options?.shp?.geoarrowEncoding;
  const preference =
    options?.geoarrow?.encodingPreference ||
    options?.shapefile?.geoarrow?.encodingPreference ||
    options?.shp?.geoarrow?.encodingPreference;
  return encoding === 'geoarrow' || preference === 'optimized';
}

/** Infers GeoParquet geometry type metadata from parsed geometries or the SHP header. */
function inferGeometryTypes(header?: SHPHeader): GeoParquetGeometryType[] {
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

/** Reads native DBF batches and imports columns originating from another Arrow build. */
async function getNextArrowBatch(
  iterator: AsyncIterator<unknown>
): Promise<arrow.RecordBatch | null> {
  while (true) {
    const result = await iterator.next();
    if (result.done) return null;
    if (isArrowRecordBatch(result.value)) {
      const batch = result.value;
      return Object.getPrototypeOf(batch) === arrow.RecordBatch.prototype
        ? batch
        : importDBFRecordBatch(batch, convertArrowToSchema(batch.schema));
    }
  }
}

/** Rebuilds primitive DBF columns with local Arrow classes while reusing their buffers. */
function importDBFRecordBatch(
  batch: arrow.RecordBatch,
  tableSchema: TableSchema
): arrow.RecordBatch {
  const schema = convertSchemaToArrow(tableSchema);
  const children = batch.data.children.map(
    (column, index) =>
      new arrow.Data(
        schema.fields[index].type,
        column.offset,
        column.length,
        column.nullCount,
        column.buffers,
        undefined,
        undefined,
        column.variadicBuffers
      )
  );
  const data = arrow.makeData({
    type: new arrow.Struct(schema.fields),
    length: batch.numRows,
    children
  });
  return makeArrowRecordBatch(schema, data, batch.metadata);
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
  queue[0] = table.slice(rowCount);
  return result;
}

/** Creates an explicit empty Arrow batch so zero-row shapefiles still expose their schema. */
function makeEmptyArrowBatch(schema: TableSchema, header: string): arrow.RecordBatch {
  const nativeSchema = convertSchemaToArrow(schema);
  nativeSchema.metadata.set(SHAPEFILE_HEADER_KEY, header);
  return makeArrowMetadataBatch(nativeSchema);
}

/** Schema metadata key for the Shapefile header and sidecar data. */
export const SHAPEFILE_HEADER_KEY = 'loaders.gl.shapefile.header';

/** Encodes Shapefile sidecars for schema and worker transport. */
function encodeShapefileHeader({
  shx,
  ...header
}: {
  header?: SHPHeader;
  encoding?: string;
  prj?: WKTCRSDefinition;
  shx?: {offsets: Int32Array; lengths: Int32Array};
}): string {
  return JSON.stringify({
    ...header,
    ...(shx ? {shx: {offsets: Array.from(shx.offsets), lengths: Array.from(shx.lengths)}} : {})
  });
}
