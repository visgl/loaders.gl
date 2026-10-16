// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {makeLineIterator, type LoaderWithParser} from '@loaders.gl/loader-utils';
import type {
  ArrowTable,
  ArrowTableBatch,
  Feature,
  ObjectRowTable,
  TableBatch
} from '@loaders.gl/schema';
import {NDGeoJSONLoader, type NDGeoJSONLoaderOptions} from './ndgeojson-loader-types';
import {
  convertGeoJSONFeaturesToArrowTable,
  normalizeJSONArrowSchema
} from './lib/parsers/convert-row-table-to-arrow';

const {preload: _preload, ...metadata} = NDGeoJSONLoader;

/** Parses newline-delimited features into GeoArrow tables or explicit object rows. */
export const NDGeoJSONLoaderWithParser = {
  ...metadata,
  parse: async (data: ArrayBuffer, options?: NDGeoJSONLoaderOptions) =>
    parseText(new TextDecoder().decode(data), options),
  parseTextSync: parseText,
  parseInBatches
} as const satisfies LoaderWithParser<
  ArrowTable | ObjectRowTable,
  ArrowTableBatch | TableBatch,
  NDGeoJSONLoaderOptions
>;

/** Parses a complete GeoJSON Lines document, including optional record separators. */
function parseText(text: string, options?: NDGeoJSONLoaderOptions): ArrowTable | ObjectRowTable {
  const features = text.split('\n').flatMap((line, index) => {
    const feature = parseLine(line, index + 1);
    return feature ? [feature] : [];
  });
  return convertFeatures(features, options);
}

/** Validates one feature without hiding conversion errors behind a JSON parse error. */
function parseLine(line: string, lineNumber: number): Feature | null {
  const text = line.replace(/^\s*\x1e/, '').trim();
  if (!text) return null;
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new Error(`NDGeoJSONLoader: invalid JSON on line ${lineNumber}`);
  }
  if (!value || typeof value !== 'object' || (value as Feature).type !== 'Feature') {
    throw new Error(`NDGeoJSONLoader: expected a GeoJSON Feature on line ${lineNumber}`);
  }
  return value as Feature;
}

/** Converts a bounded feature batch using the shared GeoJSON Arrow conversion policy. */
function convertFeatures(
  features: Feature[],
  options?: NDGeoJSONLoaderOptions
): ArrowTable | ObjectRowTable {
  if (options?.geojson?.shape === 'object-row-table') {
    return {shape: 'object-row-table', data: features};
  }
  const hasFeatureIds = features.some(feature => feature.id !== undefined);
  const arrowFeatures = hasFeatureIds
    ? features.map(feature => {
        if (feature.properties && Object.hasOwn(feature.properties, 'id')) {
          throw new Error(
            'NDGeoJSONLoader: feature id conflicts with a property named id; use object-row-table to preserve both'
          );
        }
        return {...feature, properties: {...feature.properties, id: feature.id ?? null}};
      })
    : features;
  return convertGeoJSONFeaturesToArrowTable(arrowFeatures, {
    schema: options?.json?.schema,
    arrowConversion: options?.json?.arrowConversion,
    geoarrowGeometryColumn: options?.json?.geoarrowGeometryColumn,
    geoarrow: options?.geoarrow || options?.json?.geoarrow,
    log: options?.core?.log
  });
}

/** Streams bounded batches with a schema frozen by the first nonempty Arrow batch. */
async function* parseInBatches(
  iterator:
    | AsyncIterable<string | ArrayBufferLike | ArrayBufferView>
    | Iterable<string | ArrayBufferLike | ArrayBufferView>,
  options?: NDGeoJSONLoaderOptions
): AsyncIterable<ArrowTableBatch | TableBatch> {
  const configuredBatchSize = options?.core?.batchSize ?? options?.batchSize;
  const batchSize =
    configuredBatchSize === undefined || configuredBatchSize === 'auto'
      ? 1000
      : configuredBatchSize;
  if (typeof batchSize !== 'number' || !Number.isInteger(batchSize) || batchSize < 1) {
    throw new Error('NDGeoJSONLoader: batchSize must be a positive integer');
  }
  const lines = makeLineIterator(decodeChunks(iterator));
  let features: Feature[] = [];
  let lineNumber = 0;
  const configuredGeoArrowOptions = options?.geoarrow || options?.json?.geoarrow;
  const preference = configuredGeoArrowOptions?.encodingPreference;
  let batchOptions: NDGeoJSONLoaderOptions = {
    ...options,
    geoarrow:
      preference && preference !== 'geoarrow.wkb'
        ? {encodingPreference: 'geoarrow.geometry'}
        : configuredGeoArrowOptions
  };
  let batchCount = 0;
  for await (const line of lines) {
    const feature = parseLine(line, ++lineNumber);
    if (feature) features.push(feature);
    if (features.length === batchSize) {
      const table = convertFeatures(features, batchOptions);
      if (table.shape === 'arrow-table') {
        batchOptions = {
          ...batchOptions,
          json: {...batchOptions.json, schema: normalizeJSONArrowSchema(table.data.schema)}
        };
      }
      yield {...table, batchType: 'data', length: features.length, batchCount: batchCount++};
      features = [];
    }
  }
  if (features.length) {
    yield {
      ...convertFeatures(features, batchOptions),
      batchType: 'data',
      length: features.length,
      batchCount
    };
  }
}

/** Decodes UTF-8 incrementally while also accepting text chunks supplied through core. */
async function* decodeChunks(
  iterator:
    | AsyncIterable<string | ArrayBufferLike | ArrayBufferView>
    | Iterable<string | ArrayBufferLike | ArrayBufferView>
): AsyncIterable<string> {
  const decoder = new TextDecoder();
  for await (const chunk of iterator) {
    yield typeof chunk === 'string'
      ? decoder.decode() + chunk
      : decoder.decode(chunk, {stream: true});
  }
  yield decoder.decode();
}
