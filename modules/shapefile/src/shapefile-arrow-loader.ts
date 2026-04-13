// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderContext, LoaderWithParser} from '@loaders.gl/loader-utils';
import {parseFromContext, parseInBatchesFromContext, toArrayBufferIterator} from '@loaders.gl/loader-utils';
import type {
  ArrowTable,
  ArrowTableBatch,
  BinaryGeometry,
  Field,
  Geometry,
  Schema as TableSchema,
  Feature
} from '@loaders.gl/schema';
import {ArrowTableBuilder} from '@loaders.gl/schema-utils';
import {convertBinaryGeometryToGeometry, convertGeometryToWKB, transformGeoJsonCoords} from '@loaders.gl/gis';
import {Proj4Projection} from '@math.gl/proj4';
import {SHP_MAGIC_NUMBER, SHPLoader} from './shp-loader';
import {DBFArrowLoader} from './dbf-arrow-loader';
import {DBFLoader} from './dbf-loader';
import type {ShapefileLoaderOptions} from './shapefile-loader';
import type {SHPHeader} from './lib/parsers/parse-shp-header';
import {loadShapefileSidecarFiles, replaceExtension} from './lib/parsers/parse-shapefile';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

const GEOMETRY_COLUMN_NAME = 'geometry';

/** Options for `ShapefileArrowLoader`. */
export type ShapefileArrowLoaderOptions = ShapefileLoaderOptions;

/**
 * Shapefile loader that returns properties and geometry as an Arrow table.
 *
 * The loader preserves DBF attributes as Arrow columns and appends a WKB
 * `geometry` column annotated with geospatial schema metadata.
 */
export const ShapefileArrowLoader = {
  name: 'Shapefile Arrow',
  id: 'shapefile-arrow',
  module: 'shapefile',
  version: VERSION,
  category: 'geometry',
  extensions: ['shp'],
  mimeTypes: ['application/octet-stream'],
  tests: [new Uint8Array(SHP_MAGIC_NUMBER).buffer],
  options: {
    shapefile: {
      shape: 'v3'
    },
    shp: {
      _maxDimensions: 4
    }
  },
  parse: parseShapefileToArrow,
  parseInBatches: parseShapefileToArrowInBatches
} as const satisfies LoaderWithParser<ArrowTable, ArrowTableBatch, ShapefileArrowLoaderOptions>;

/** Parses a shapefile and returns an Arrow table with a WKB geometry column. */
async function parseShapefileToArrow(
  arrayBuffer: ArrayBuffer,
  options?: ShapefileArrowLoaderOptions,
  context?: LoaderContext
): Promise<ArrowTable> {
  const {header, geometries} = await parseFromContext(arrayBuffer, SHPLoader, options, context!);
  const {cpg, prj} = await loadShapefileSidecarFiles(options, context);

  const geometryObjects = parseGeometries(geometries);
  const features = maybeReprojectFeatures(
    geometryObjects.map(geometry => ({type: 'Feature', geometry, properties: {}})),
    prj,
    options
  );

  let propertySchema: TableSchema | null = null;
  let propertyRows: Record<string, unknown>[] = [];

  const dbfResponse = await context?.fetch(replaceExtension(context?.url || '', 'dbf'));
  if (dbfResponse?.ok) {
    const table = await parseFromContext(
      dbfResponse as any,
      DBFArrowLoader,
      {
        ...options,
        dbf: {
          ...options?.dbf,
          encoding: cpg || 'latin1'
        }
      },
      context!
    );
    propertySchema = table.schema || null;
    propertyRows = getRowsFromArrowTable(table);
  }

  const schema = buildOutputSchema(propertySchema, features.map(feature => feature.geometry), header);
  const tableBuilder = new ArrowTableBuilder(schema);

  const rowCount = Math.max(features.length, propertyRows.length);
  for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
    tableBuilder.addObjectRow(makeArrowRow(propertyRows[rowIndex], features[rowIndex]?.geometry, header));
  }

  return tableBuilder.finishTable();
}

/** Parses a shapefile into Arrow batches while keeping DBF-derived schema stable. */
async function* parseShapefileToArrowInBatches(
  asyncIterator:
    | AsyncIterable<ArrayBufferLike | ArrayBufferView>
    | Iterable<ArrayBufferLike | ArrayBufferView>,
  options?: ShapefileArrowLoaderOptions,
  context?: LoaderContext
): AsyncIterable<ArrowTableBatch> {
  const {cpg, prj} = await loadShapefileSidecarFiles(options, context);

  const shapeIterable = await parseInBatchesFromContext(
    toArrayBufferIterator(asyncIterator),
    SHPLoader,
    options,
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
        shape: 'object-row-table' as const,
        encoding: cpg || 'latin1'
      }
    };
    const schemaResponse = 'clone' in dbfResponse ? dbfResponse.clone() : await context?.fetch(replaceExtension(context?.url || '', 'dbf'));
    const propertyTable = await parseFromContext(schemaResponse as any, DBFLoader, dbfOptions, context!);
    propertySchema = propertyTable?.schema || null;

    const propertyIterable = await parseInBatchesFromContext(
      dbfResponse,
      DBFLoader,
      dbfOptions,
      context!
    );
    propertyIterator = getAsyncIterator(propertyIterable);

    const outputSchema = buildOutputSchema(propertySchema, [], header);
    const propertyQueue: Record<string, unknown>[] = [];
    const geometryQueue: Geometry[] = [];
    let yieldedDataBatch = false;

    const firstPropertyBatch = await getNextPropertyBatch(propertyIterator);
    if (firstPropertyBatch) {
      propertyQueue.push(...firstPropertyBatch);
    }

    let shapeDone = false;
    let propertyDone = false;
    while (!shapeDone || !propertyDone || geometryQueue.length > 0 || propertyQueue.length > 0) {
      if (!shapeDone && geometryQueue.length === 0) {
        const shapeBatch = await shapeIterator.next();
        if (shapeBatch.done) {
          shapeDone = true;
        } else if (shapeBatch.value?.batchType !== 'metadata') {
          geometryQueue.push(...parseGeometries(shapeBatch.value as BinaryGeometry[]));
        }
      }

      if (!propertyDone && propertyQueue.length < geometryQueue.length) {
        const propertyBatch = await propertyIterator.next();
        if (propertyBatch.done) {
          propertyDone = true;
        } else if (Array.isArray(propertyBatch.value)) {
          propertyQueue.push(...propertyBatch.value);
        }
      }

      const rowCount = Math.min(geometryQueue.length, propertyQueue.length);
      if (rowCount === 0) {
        if ((shapeDone && geometryQueue.length === 0) || (propertyDone && propertyQueue.length === 0)) {
          break;
        }
        continue;
      }

      const features = maybeReprojectFeatures(
        geometryQueue.splice(0, rowCount).map(geometry => ({type: 'Feature', geometry, properties: {}})),
        prj,
        options
      );
      const propertyRows = propertyQueue.splice(0, rowCount);
      const batchBuilder = new ArrowTableBuilder(outputSchema);
      for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
        batchBuilder.addObjectRow(makeArrowRow(propertyRows[rowIndex], features[rowIndex]?.geometry, header));
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
    const features = maybeReprojectFeatures(
      parseGeometries(shapeBatch.value as BinaryGeometry[]).map(geometry => ({
        type: 'Feature',
        geometry,
        properties: {}
      })),
      prj,
      options
    );
    const batchBuilder = new ArrowTableBuilder(outputSchema);
    for (const feature of features) {
      batchBuilder.addObjectRow(makeArrowRow(undefined, feature.geometry, header));
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
  geometries: Geometry[],
  header?: SHPHeader
): TableSchema {
  const geometryTypes = inferGeometryTypes(geometries, header);
  const metadata = {
    geo: JSON.stringify({
      version: '1.1.0',
      primary_column: GEOMETRY_COLUMN_NAME,
      columns: {
        [GEOMETRY_COLUMN_NAME]: {
          encoding: 'wkb',
          geometry_types: geometryTypes
        }
      }
    })
  };
  const geometryField: Field = {
    name: GEOMETRY_COLUMN_NAME,
    type: 'binary',
    nullable: true,
    metadata: {}
  };

  return {
    fields: [...(propertySchema?.fields || []), geometryField],
    metadata: {
      ...(propertySchema?.metadata || {}),
      ...metadata
    }
  };
}

/** Combines one property row and one geometry into an Arrow-builder friendly object row. */
function makeArrowRow(
  propertyRow: Record<string, unknown> | undefined,
  geometry: Geometry | undefined,
  header?: SHPHeader
): Record<string, unknown> {
  return {
    ...(propertyRow || {}),
    [GEOMETRY_COLUMN_NAME]: geometry ? new Uint8Array(convertGeometryToWKB(geometry, getWKBOptions(geometry, header))) : null
  };
}

/** Materializes Arrow rows as plain objects for row-wise joining with SHP geometry output. */
function getRowsFromArrowTable(table: ArrowTable | ArrowTableBatch): Record<string, unknown>[] {
  const rows: Record<string, unknown>[] = [];
  for (let rowIndex = 0; rowIndex < table.data.numRows; rowIndex++) {
    rows.push(table.data.get(rowIndex)?.toJSON() || {});
  }
  return rows;
}

/** Converts binary SHP geometries to GeoJSON geometries. */
function parseGeometries(geometries: BinaryGeometry[]): Geometry[] {
  return geometries.map(geometry => convertBinaryGeometryToGeometry(geometry));
}

/** Reprojects features when requested through standard shapefile GIS options. */
function maybeReprojectFeatures(
  features: Feature[],
  sourceCrs: string | undefined,
  options?: ShapefileArrowLoaderOptions
): Feature[] {
  const {reproject = false, _targetCrs = 'WGS84'} = options?.gis || {};
  if (!reproject) {
    return features;
  }
  const projection = new Proj4Projection({from: sourceCrs || 'WGS84', to: _targetCrs || 'WGS84'});
  return transformGeoJsonCoords(features, coord => projection.project(coord));
}

/** Selects WKB dimensional flags from the shapefile header and parsed coordinate dimensionality. */
function getWKBOptions(geometry: Geometry, header?: SHPHeader): {hasZ?: boolean; hasM?: boolean} {
  const dimensions = getCoordinateDimensions(getGeometrySampleCoordinates(geometry));
  switch (header?.type) {
    case 11:
    case 13:
    case 15:
    case 18:
      return {hasZ: dimensions > 2, hasM: dimensions > 3};
    case 21:
    case 23:
    case 25:
    case 28:
      return {hasM: dimensions > 2};
    default:
      return {hasZ: dimensions > 2, hasM: dimensions > 3};
  }
}

/** Returns the coordinate dimensionality of the first coordinate tuple in a geometry. */
function getCoordinateDimensions(coordinates: unknown): number {
  if (!Array.isArray(coordinates)) {
    return 2;
  }
  if (typeof coordinates[0] === 'number') {
    return coordinates.length;
  }
  if (coordinates.length === 0) {
    return 2;
  }
  return getCoordinateDimensions(coordinates[0]);
}

/** Infers GeoParquet geometry type metadata from parsed geometries or the SHP header. */
function inferGeometryTypes(geometries: Geometry[], header?: SHPHeader): string[] {
  const geometryTypes = new Set<string>();
  for (const geometry of geometries) {
    const dimensions = getCoordinateDimensions(getGeometrySampleCoordinates(geometry));
    geometryTypes.add(dimensions > 2 ? `${geometry.type} Z` : geometry.type);
  }
  if (geometryTypes.size > 0) {
    return [...geometryTypes];
  }

  const fallbackType = getGeometryTypeFromHeader(header?.type);
  return fallbackType ? [fallbackType] : [];
}

/** Maps SHP header geometry type codes to GeoParquet geometry type strings. */
function getGeometryTypeFromHeader(type?: number): string | null {
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

/** Extracts a representative coordinate array from any GeoJSON geometry. */
function getGeometrySampleCoordinates(geometry: Geometry): unknown {
  if ('coordinates' in geometry) {
    return geometry.coordinates;
  }
  if ('geometries' in geometry && geometry.geometries.length > 0) {
    return getGeometrySampleCoordinates(geometry.geometries[0]);
  }
  return undefined;
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

/** Reads the next DBF row batch, skipping header objects. */
async function getNextPropertyBatch(
  iterator: AsyncIterator<any>
): Promise<Record<string, unknown>[] | null> {
  while (true) {
    const result = await iterator.next();
    if (result.done) {
      return null;
    }
    if (Array.isArray(result.value)) {
      return result.value;
    }
  }
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
