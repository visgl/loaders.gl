// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderWithParser} from '@loaders.gl/loader-utils';
import type {
  ArrowTable,
  ArrowTableBatch,
  BinaryFeatureCollection,
  Feature,
  GeoJSONTable,
  ObjectRowTable,
  Schema,
  TableBatch
} from '@loaders.gl/schema';
import type * as arrow from 'apache-arrow';
import type {JSONLoaderOptions} from './json-loader';
import {geojsonToBinary, type LegacyGeoJSONCRS} from '@loaders.gl/gis';
// import {parseJSONSync} from './lib/parsers/parse-json';
import {parseJSONInBatches} from './lib/parsers/parse-json-in-batches';
import {
  type ArrowConversionOptions,
  convertGeoJSONFeaturesToArrowTable,
  normalizeJSONArrowSchema
} from './lib/parsers/convert-row-table-to-arrow';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export type GeoJSONLoaderOptions = Omit<JSONLoaderOptions, 'json'> & {
  /** GeoJSON-specific loader options. */
  geojson?: {
    /** Requested GeoJSON output shape. */
    shape?: 'geojson-table' | 'arrow-table' | 'binary-feature-collection';
  };
  /** JSON parser and GeoArrow conversion options used by GeoJSONLoader. */
  json?: Omit<NonNullable<JSONLoaderOptions['json']>, 'shape'> & {
    /** Optional schema used when converting GeoJSON features to GeoArrow. */
    schema?: Schema | arrow.Schema;
    /** Optional recovery policy used when converting GeoJSON features to GeoArrow. */
    arrowConversion?: ArrowConversionOptions;
    /** Geometry column name to use when converting GeoJSON features to GeoArrow WKB. */
    geoarrowGeometryColumn?: string;
  };
};

/** Worker-capable GeoJSON loader definition. */
export const GeoJSONWorkerLoader = {
  dataType: null as unknown as GeoJSONTable | BinaryFeatureCollection | ArrowTable,
  batchType: null as unknown as TableBatch | ArrowTableBatch,

  name: 'GeoJSON',
  id: 'geojson',
  module: 'geojson',
  version: VERSION,
  worker: true,
  extensions: ['geojson'],
  mimeTypes: ['application/geo+json'],
  category: 'geometry',
  text: true,
  options: {
    geojson: {
      shape: 'geojson-table'
    },
    json: {
      jsonpaths: ['$.features'],
      schema: undefined,
      arrowConversion: undefined,
      geoarrowGeometryColumn: undefined
    }
  }
} as const satisfies Loader<
  GeoJSONTable | BinaryFeatureCollection | ArrowTable,
  TableBatch | ArrowTableBatch,
  GeoJSONLoaderOptions
>;

/** GeoJSON loader with synchronous, asynchronous and batched parse support. */
export const GeoJSONLoader = {
  ...GeoJSONWorkerLoader,
  parse,
  parseTextSync,
  parseInBatches
} as const satisfies LoaderWithParser<
  GeoJSONTable | BinaryFeatureCollection | ArrowTable,
  TableBatch | ArrowTableBatch,
  GeoJSONLoaderOptions
>;

async function parse(
  arrayBuffer: ArrayBuffer,
  options?: GeoJSONLoaderOptions
): Promise<GeoJSONTable | BinaryFeatureCollection | ArrowTable> {
  return parseTextSync(new TextDecoder().decode(arrayBuffer), options);
}

function parseTextSync(
  text: string,
  options?: GeoJSONLoaderOptions
): GeoJSONTable | BinaryFeatureCollection | ArrowTable {
  // Apps can call the parse method directly, we so apply default options here
  options = {...GeoJSONLoader.options, ...options};
  options.geojson = {...GeoJSONLoader.options.geojson, ...options.geojson};
  options.json = {...GeoJSONLoader.options.json, ...options.json};
  validateGeoJSONArrowOptions(options);

  let geojson;
  try {
    geojson = JSON.parse(text);
  } catch {
    geojson = {};
  }

  const table = makeGeoJSONTable(getGeoJSONFeatures(geojson));

  switch (options.geojson?.shape) {
    case 'binary-feature-collection':
      return geojsonToBinary(table.features);
    case 'arrow-table':
      return convertGeoJSONFeaturesToArrowTable(table.features, {
        schema: options.json?.schema,
        arrowConversion: options.json?.arrowConversion,
        geoarrowGeometryColumn: options.json?.geoarrowGeometryColumn,
        crs: getGeoJSONCRS(geojson),
        log: getGeoJSONLoaderLog(options)
      });
    default:
      return table;
  }
}

function parseInBatches(
  asyncIterator,
  options?: GeoJSONLoaderOptions
): AsyncIterable<TableBatch | ArrowTableBatch> {
  // Apps can call the parse method directly, we so apply default options here
  options = {...GeoJSONLoader.options, ...options};
  options.json = {...GeoJSONLoader.options.json, ...options.json};
  options.geojson = {...GeoJSONLoader.options.geojson, ...options.geojson};
  validateGeoJSONArrowOptions(options);

  const emitMetadataBatches = getGeoJSONLoaderMetadata(options);
  const geojsonIterator = parseJSONInBatches(
    asyncIterator,
    getRowBatchJSONOptions(options, options.geojson?.shape === 'arrow-table')
  );

  switch (options.geojson?.shape) {
    case 'binary-feature-collection':
      return makeBinaryGeometryIterator(geojsonIterator);
    case 'arrow-table':
      return makeGeoJSONArrowBatchIterator(geojsonIterator, options, emitMetadataBatches);
    default:
      return geojsonIterator as AsyncIterable<TableBatch>;
  }
}

/** Returns JSON row-batch parser options used before GeoJSON-specific output conversion. */
function getRowBatchJSONOptions(
  options: GeoJSONLoaderOptions,
  forceMetadata = false
): GeoJSONLoaderOptions {
  return {
    ...options,
    metadata: forceMetadata ? true : (options as any).metadata,
    json: {
      ...options.json,
      shape: 'object-row-table'
    }
  } as GeoJSONLoaderOptions;
}

/** Converts streamed GeoJSON feature batches to binary feature collection batches. */
async function* makeBinaryGeometryIterator(geojsonIterator): AsyncIterable<TableBatch> {
  for await (const batch of geojsonIterator) {
    if (batch.batchType === 'data') {
      batch.data = geojsonToBinary(batch.data);
    }
    yield batch;
  }
}

/** Converts streamed GeoJSON feature batches to GeoArrow WKB Arrow table batches. */
async function* makeGeoJSONArrowBatchIterator(
  geojsonIterator,
  options: GeoJSONLoaderOptions,
  emitMetadataBatches: boolean
): AsyncIterable<TableBatch | ArrowTableBatch> {
  let frozenSchema = options.json?.schema ? normalizeJSONArrowSchema(options.json.schema) : null;
  let crs: LegacyGeoJSONCRS | null = null;

  for await (const batch of geojsonIterator) {
    if (batch.batchType !== 'data') {
      crs ||= getGeoJSONCRS(batch.container);
      if (emitMetadataBatches) {
        yield batch;
      }
      continue;
    }

    if (batch.shape !== 'object-row-table') {
      throw new Error(
        `GeoJSONLoader: arrow-table shape requires object-row-table feature batches, got ${batch.shape}`
      );
    }

    const featureBatch = batch as ObjectRowTable & TableBatch;
    const arrowTable = convertGeoJSONFeaturesToArrowTable(featureBatch.data as Feature[], {
      schema: frozenSchema || undefined,
      arrowConversion: options.json?.arrowConversion,
      geoarrowGeometryColumn: options.json?.geoarrowGeometryColumn,
      crs,
      log: getGeoJSONLoaderLog(options)
    });

    if (!frozenSchema && arrowTable.data.numRows > 0) {
      frozenSchema = arrowTable.schema || null;
    }

    yield {
      ...batch,
      shape: 'arrow-table',
      schema: arrowTable.schema,
      data: arrowTable.data,
      length: arrowTable.data.numRows
    };
  }
}

/** Builds the GeoJSON table wrapper returned by the default GeoJSON loader shape. */
function makeGeoJSONTable(features: Feature[]): GeoJSONTable {
  return {
    shape: 'geojson-table',
    type: 'FeatureCollection',
    features
  };
}

/** Extracts GeoJSON features from a FeatureCollection or root feature array. */
function getGeoJSONFeatures(geojson: {features?: Feature[]} | Feature[] | null): Feature[] {
  if (Array.isArray(geojson)) {
    return geojson;
  }
  return geojson?.features || [];
}

/** Extracts a legacy GeoJSON root CRS object when one is present. */
function getGeoJSONCRS(geojson: unknown): LegacyGeoJSONCRS | null {
  if (!geojson || typeof geojson !== 'object' || Array.isArray(geojson)) {
    return null;
  }

  const crs = (geojson as {crs?: unknown}).crs;
  return crs && typeof crs === 'object' && !Array.isArray(crs) ? (crs as LegacyGeoJSONCRS) : null;
}

/** Returns the loader log object from normalized or deprecated option locations. */
function getGeoJSONLoaderLog(options: GeoJSONLoaderOptions): any {
  return (options.core as {log?: any} | undefined)?.log || (options as {log?: any}).log;
}

/** Returns whether caller-visible metadata batches were requested. */
function getGeoJSONLoaderMetadata(options: GeoJSONLoaderOptions): boolean {
  return Boolean(
    (options.core as {metadata?: boolean} | undefined)?.metadata || (options as any).metadata
  );
}

/** Throws when GeoJSON Arrow-only options are used without Arrow output. */
function validateGeoJSONArrowOptions(options: GeoJSONLoaderOptions): void {
  const hasArrowOnlyOptions = Boolean(
    options.json?.schema || options.json?.arrowConversion || options.json?.geoarrowGeometryColumn
  );
  if (hasArrowOnlyOptions && options.geojson?.shape !== 'arrow-table') {
    throw new Error(
      'GeoJSONLoader: json.schema, json.arrowConversion and json.geoarrowGeometryColumn require geojson.shape to be "arrow-table"'
    );
  }
}
