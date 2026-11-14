// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  RecordBatch,
  type Table as ArrowTable,
  type RecordBatch as ArrowTableBatch
} from 'apache-arrow';

import {getLoaderLog} from '@loaders.gl/core/loader-utils';
import {
  convertSchemaToArrow,
  makeArrowMetadataBatch,
  updateArrowTableMetadata
} from '@loaders.gl/core/schema-utils';
import {getGeoMetadata, setGeoMetadata, type Schema} from '@loaders.gl/core/schema';
import {getJSONContainerMetadata} from './lib/parsers/json-container-metadata';
import type {Loader, LoaderWithParser} from '@loaders.gl/core/loader-utils';
import type {
  BinaryFeatureCollection,
  Feature,
  GeoJSONTable,
  ObjectRowTable,
  TableBatch
} from '@loaders.gl/core/schema';
import {convertGeojsonToBinaryFeatureCollection as geojsonToBinary} from '@loaders.gl/core/arrow-geometry/legacy-binary';
import {
  applyLegacyGeoJSONCRSToSchema,
  type LegacyGeoJSONCRS
} from '@loaders.gl/core/arrow-geometry/feature-table';
import {
  serializeGeoJSONWorkerResult,
  deserializeGeoJSONWorkerResult
} from './lib/geojson-worker-transport';
import {serializeJSONWorkerOptions} from './lib/json-worker-transport';
import {parseJSONInBatches} from './lib/parsers/parse-json-in-batches';
import {
  convertGeoJSONFeaturesToArrowTable,
  normalizeJSONArrowSchema
} from './lib/parsers/convert-row-table-to-arrow';
import {
  GeoJSONLoader as GeoJSONWorkerLoaderMetadata,
  GeoJSONLoader as GeoJSONLoaderMetadata,
  type GeoJSONLoaderOptions
} from './geojson-loader-types';

const {preload: _GeoJSONWorkerLoaderPreload, ...GeoJSONWorkerLoaderMetadataWithoutPreload} =
  GeoJSONWorkerLoaderMetadata;
const {preload: _GeoJSONLoaderPreload, ...GeoJSONLoaderMetadataWithoutPreload} =
  GeoJSONLoaderMetadata;

/** GeoJSON worker loader with parser metadata. */
export const GeoJSONWorkerLoaderWithParser = {
  serializeWorkerResult: serializeGeoJSONWorkerResult,
  deserializeWorkerResult: deserializeGeoJSONWorkerResult,
  ...GeoJSONWorkerLoaderMetadataWithoutPreload
} as const satisfies Loader<
  GeoJSONTable | BinaryFeatureCollection | ArrowTable,
  TableBatch | ArrowTableBatch,
  GeoJSONLoaderOptions
>;

/** GeoJSON loader with synchronous, asynchronous and batched parse support. */
export const GeoJSONLoaderWithParser = {
  serializeWorkerOptions: serializeJSONWorkerOptions,
  serializeWorkerResult: serializeGeoJSONWorkerResult,
  deserializeWorkerResult: deserializeGeoJSONWorkerResult,
  ...GeoJSONLoaderMetadataWithoutPreload,
  parse,
  parseTextSync,
  parseInBatches,
  serializeWorkerBatch: serializeGeoJSONWorkerResult,
  deserializeWorkerBatch: deserializeGeoJSONWorkerResult
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
  // Apps can call the parse method directly, so apply default options here.
  options = {...GeoJSONLoaderWithParser.options, ...options};
  options.geojson = {...GeoJSONLoaderWithParser.options.geojson, ...options.geojson};
  options.json = {...GeoJSONLoaderWithParser.options.json, ...options.json};
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
    case 'arrow':
      return updateArrowTableMetadata(
        convertGeoJSONFeaturesToArrowTable(table.features, {
          schema: options.json?.schema,
          arrowConversion: options.json?.arrowConversion,
          geoarrowGeometryColumn: options.json?.geoarrowGeometryColumn,
          geoarrow: options.geoarrow || options.geojson?.geoarrow || options.json?.geoarrow,
          crs: getGeoJSONCRS(geojson),
          log: getLoaderLog(options)
        }),
        getJSONContainerMetadata(geojson, '$.features')
      ).data;
    default:
      return table;
  }
}

function parseInBatches(
  asyncIterator:
    | AsyncIterable<ArrayBufferLike | ArrayBufferView>
    | Iterable<ArrayBufferLike | ArrayBufferView>,
  options?: GeoJSONLoaderOptions
): AsyncIterable<TableBatch | ArrowTableBatch> {
  // Apps can call the parse method directly, so apply default options here.
  options = {...GeoJSONLoaderWithParser.options, ...options};
  options.json = {...GeoJSONLoaderWithParser.options.json, ...options.json};
  options.geojson = {...GeoJSONLoaderWithParser.options.geojson, ...options.geojson};
  validateGeoJSONArrowOptions(options);

  const geojsonIterator = parseJSONInBatches(
    asyncIterator,
    getRowBatchJSONOptions(options, options.geojson?.shape === 'arrow')
  );

  switch (options.geojson?.shape) {
    case 'binary-feature-collection':
      return makeBinaryGeometryIterator(geojsonIterator);
    case 'arrow':
      return makeGeoJSONArrowBatchIterator(geojsonIterator, options);
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
async function* makeBinaryGeometryIterator(
  geojsonIterator: AsyncIterable<any>
): AsyncIterable<TableBatch> {
  for await (const batch of geojsonIterator) {
    if (batch.batchType === 'data') {
      batch.data = geojsonToBinary(batch.data as Feature[]);
    }
    yield batch;
  }
}

/** Converts streamed GeoJSON feature batches to GeoArrow WKB Arrow table batches. */
async function* makeGeoJSONArrowBatchIterator(
  geojsonIterator: AsyncIterable<any>,
  options: GeoJSONLoaderOptions
): AsyncIterable<TableBatch | ArrowTableBatch> {
  let frozenSchema = options.json?.schema ? normalizeJSONArrowSchema(options.json.schema) : null;
  let crs: LegacyGeoJSONCRS | null = null;
  let containerMetadata: Record<string, string> = {};
  let emittedSchema: Schema | undefined;
  const configuredGeoArrowOptions =
    options.geoarrow || options.geojson?.geoarrow || options.json?.geoarrow;
  const configuredPreference = configuredGeoArrowOptions?.encodingPreference;
  const streamingPreference =
    configuredPreference && configuredPreference !== 'geoarrow.wkb'
      ? 'geoarrow.geometry'
      : configuredPreference;

  for await (const batch of geojsonIterator) {
    if (batch.batchType !== 'data') {
      crs = getGeoJSONCRS(batch.container) || crs;
      containerMetadata = {
        ...containerMetadata,
        ...getJSONContainerMetadata(batch.container, '$.features')
      };
      if (batch.batchType === 'final-result') {
        const schema = emittedSchema
          ? structuredClone(emittedSchema)
          : convertGeoJSONFeaturesToArrowTable([], {
              schema: frozenSchema || undefined,
              arrowConversion: options.json?.arrowConversion,
              geoarrowGeometryColumn: options.json?.geoarrowGeometryColumn,
              geoarrow: streamingPreference
                ? {encodingPreference: streamingPreference}
                : configuredGeoArrowOptions,
              crs,
              log: getLoaderLog(options)
            }).schema!;
        applyLegacyGeoJSONCRSToSchema(
          schema,
          options.json?.geoarrowGeometryColumn || 'geometry',
          crs
        );
        schema.metadata = {...schema.metadata, ...containerMetadata};
        if (JSON.stringify(schema) !== JSON.stringify(emittedSchema)) {
          const finalBatch = makeArrowMetadataBatch(convertSchemaToArrow(schema));
          const metadata = new Map(finalBatch.metadata);
          if (batch.jsonpath) metadata.set('jsonpath', String(batch.jsonpath));
          yield new RecordBatch(finalBatch.schema, finalBatch.data, metadata);
        }
      }
      continue;
    }

    if (batch.shape !== 'object-row-table') {
      throw new Error(
        `GeoJSONLoader: arrow shape requires object-row-table feature batches, got ${batch.shape}`
      );
    }

    const featureBatch = batch as ObjectRowTable & TableBatch;
    const arrowTable = convertGeoJSONFeaturesToArrowTable(featureBatch.data as Feature[], {
      schema: frozenSchema || undefined,
      arrowConversion: options.json?.arrowConversion,
      geoarrowGeometryColumn: options.json?.geoarrowGeometryColumn,
      geoarrow: streamingPreference
        ? {encodingPreference: streamingPreference}
        : configuredGeoArrowOptions,
      crs,
      log: getLoaderLog(options)
    });

    if (!frozenSchema && arrowTable.data.numRows > 0) {
      frozenSchema = arrowTable.schema || null;
    }

    const geoMetadata = getGeoMetadata(arrowTable.schema?.metadata);
    const previousGeoMetadata = getGeoMetadata(emittedSchema?.metadata);
    if (geoMetadata && previousGeoMetadata) {
      for (const [name, column] of Object.entries(geoMetadata.columns)) {
        column.geometry_types = [
          ...new Set([
            ...(previousGeoMetadata.columns[name]?.geometry_types || []),
            ...column.geometry_types
          ])
        ];
      }
      setGeoMetadata(arrowTable.schema!.metadata!, geoMetadata);
    }
    const refinedTable = updateArrowTableMetadata(arrowTable, {
      ...arrowTable.schema?.metadata,
      ...containerMetadata
    });
    emittedSchema = structuredClone(refinedTable.schema);
    for (const recordBatch of refinedTable.data.batches) {
      const metadata = new Map(recordBatch.metadata);
      if (batch.jsonpath) metadata.set('jsonpath', String(batch.jsonpath));
      yield new RecordBatch(recordBatch.schema, recordBatch.data, metadata);
    }
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

/** Throws when GeoJSON Arrow-only options are used without Arrow output. */
function validateGeoJSONArrowOptions(options: GeoJSONLoaderOptions): void {
  if ((options.geojson?.shape as string) === 'arrow-table') {
    throw new Error('This loader uses shape: "arrow" for native Arrow output');
  }
  const hasArrowOnlyOptions = Boolean(
    options.json?.schema || options.json?.arrowConversion || options.json?.geoarrowGeometryColumn
  );
  if (hasArrowOnlyOptions && options.geojson?.shape !== 'arrow') {
    throw new Error(
      'GeoJSONLoader: json.schema, json.arrowConversion and json.geoarrowGeometryColumn require geojson.shape to be "arrow"'
    );
  }
}

export type {GeoJSONLoaderOptions} from './geojson-loader-types';
