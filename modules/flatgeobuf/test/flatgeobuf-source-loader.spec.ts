// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {createDataSource, fetchFile, resolvePath} from '@loaders.gl/core';
import {
  FlatGeobufSourceLoader,
  FlatGeobufVectorSource
} from '@loaders.gl/flatgeobuf';
import {convertBinaryFeatureCollectionToGeojson, convertWKBTableToGeoJSON} from '@loaders.gl/gis';
import {getTableRowAsObject} from '@loaders.gl/schema-utils';

const FLATGEOBUF_COUNTRIES_DATA_URL = resolvePath('@loaders.gl/flatgeobuf/test/data/countries.fgb');
const REMOTE_FGB_URL = 'https://example.com/countries.fgb';
const NARROW_BOUNDING_BOX: [[number, number], [number, number]] = [
  [-12, 35],
  [30, 60]
];
const EMPTY_BOUNDING_BOX: [[number, number], [number, number]] = [
  [0, -90],
  [1, -89]
];

test('FlatGeobufSourceLoader#createDataSource selects FlatGeobuf source from URL', async t => {
  const source = createDataSource(REMOTE_FGB_URL, [FlatGeobufSourceLoader], {
    core: {
      loadOptions: {
        core: {
          fetch: await createRangeFetch()
        }
      }
    },
    flatgeobuf: {}
  });

  t.ok(source instanceof FlatGeobufVectorSource, 'returns FlatGeobufVectorSource');
  t.end();
});

test('FlatGeobufSourceLoader#getSchema and getMetadata expose header metadata', async t => {
  const source = await createSource();
  const schema = await source.getSchema();
  const metadata = await source.getMetadata();
  const metadataWithFormatSpecific = await source.getMetadata({formatSpecificMetadata: true});

  t.equal(schema.fields.length, 2, 'returns the property schema');
  t.deepEqual(
    schema.fields.map(field => field.name),
    ['id', 'name'],
    'schema fields follow the FlatGeobuf header'
  );
  t.equal(metadata.name, 'countries', 'infers dataset name from URL');
  t.equal(metadata.layers.length, 1, 'returns one dataset layer');
  t.equal(metadata.layers[0]?.name, 'countries', 'layer name matches dataset');
  t.ok(Array.isArray(metadata.layers[0]?.crs), 'metadata exposes CRS list');
  t.equal(metadata.formatSpecificMetadata, undefined, 'raw metadata is opt-in');
  t.ok(metadataWithFormatSpecific.formatSpecificMetadata, 'returns raw metadata on request');
  t.end();
});

test('FlatGeobufSourceLoader#getFeatures returns matching feature sets across formats', async t => {
  const source = await createSource();
  const geojson = await source.getFeatures({
    layers: 'countries',
    boundingBox: NARROW_BOUNDING_BOX,
    format: 'geojson'
  });
  const binary = await source.getFeatures({
    layers: 'countries',
    boundingBox: NARROW_BOUNDING_BOX,
    format: 'binary'
  });
  const arrow = await source.getFeatures({
    layers: 'countries',
    boundingBox: NARROW_BOUNDING_BOX,
    format: 'arrow'
  });

  t.equal(geojson.shape, 'geojson-table', 'returns GeoJSON tables');
  t.ok(geojson.features.length > 0, 'returns matching features');
  t.ok(geojson.features.length < 179, 'uses indexed subset instead of full dataset');

  const binaryGeojson = convertBinaryFeatureCollectionToGeojson(binary);
  t.deepEqual(
    getFeatureKeys(binaryGeojson.features || []),
    getFeatureKeys(geojson.features),
    'binary source output round-trips to the same features'
  );

  t.equal(arrow.shape, 'arrow-table', 'returns Arrow tables');
  const geometryField = arrow.schema.fields[arrow.schema.fields.length - 1];
  t.equal(geometryField?.name, 'geometry', 'Arrow schema appends geometry');
  t.equal(geometryField?.type, 'binary', 'Arrow geometry is WKB');
  t.ok(arrow.schema.metadata?.geo, 'Arrow schema includes geo metadata');
  const arrowGeojson = convertWKBTableToGeoJSON(
    {shape: 'object-row-table', schema: arrow.schema, data: getRowsFromArrowTable(arrow)},
    arrow.schema
  );
  t.deepEqual(
    getFeatureKeys(arrowGeojson.features),
    getFeatureKeys(geojson.features),
    'Arrow source output round-trips to the same features'
  );
  t.end();
});

test('FlatGeobufSourceLoader#getFeatures reprojects Arrow and GeoJSON consistently', async t => {
  const source = await createSource();
  const geojson = await source.getFeatures({
    layers: 'countries',
    boundingBox: NARROW_BOUNDING_BOX,
    format: 'geojson',
    crs: 'EPSG:3857'
  });
  const arrow = await source.getFeatures({
    layers: 'countries',
    boundingBox: NARROW_BOUNDING_BOX,
    format: 'arrow',
    crs: 'EPSG:3857'
  });
  const arrowGeojson = convertWKBTableToGeoJSON(
    {shape: 'object-row-table', schema: arrow.schema, data: getRowsFromArrowTable(arrow)},
    arrow.schema
  );

  t.deepEqual(
    getFeatureKeys(arrowGeojson.features),
    getFeatureKeys(geojson.features),
    'reprojected Arrow source output matches GeoJSON source output'
  );
  t.end();
});

test('FlatGeobufSourceLoader#getFeatures returns empty valid tables for no-match bboxes', async t => {
  const source = await createSource();
  const geojson = await source.getFeatures({
    layers: 'countries',
    boundingBox: EMPTY_BOUNDING_BOX,
    format: 'geojson'
  });
  const binary = await source.getFeatures({
    layers: 'countries',
    boundingBox: EMPTY_BOUNDING_BOX,
    format: 'binary'
  });
  const arrow = await source.getFeatures({
    layers: 'countries',
    boundingBox: EMPTY_BOUNDING_BOX,
    format: 'arrow'
  });

  t.equal(geojson.features.length, 0, 'empty GeoJSON response is valid');
  t.equal(
    (convertBinaryFeatureCollectionToGeojson(binary).features || []).length,
    0,
    'empty binary response is valid'
  );
  t.equal(arrow.data.numRows, 0, 'empty Arrow response preserves schema');
  t.end();
});

test('FlatGeobufSourceLoader#getFeatures respects abort signals', async t => {
  const abortController = new AbortController();
  const delayedSource = createDataSource(REMOTE_FGB_URL, [FlatGeobufSourceLoader], {
    core: {
      loadOptions: {
        core: {
          fetch: await createRangeFetch({delayMs: 20})
        }
      }
    },
    flatgeobuf: {}
  }) as FlatGeobufVectorSource;

  await delayedSource.getMetadata();

  const pending = delayedSource.getFeatures({
    layers: 'countries',
    boundingBox: NARROW_BOUNDING_BOX,
    format: 'geojson',
    signal: abortController.signal
  });

  abortController.abort();

  try {
    await pending;
    t.fail('expected request to abort');
  } catch (error) {
    t.equal((error as Error).name, 'AbortError', 'throws AbortError');
  }
  t.end();
});

async function createSource(fetchOverride?: typeof fetch): Promise<FlatGeobufVectorSource> {
  const fetch = fetchOverride || (await createRangeFetch());
  return createDataSource(REMOTE_FGB_URL, [FlatGeobufSourceLoader], {
    core: {
      loadOptions: {
        core: {
          fetch
        }
      }
    },
    flatgeobuf: {}
  }) as FlatGeobufVectorSource;
}

async function createRangeFetch(options: {delayMs?: number} = {}) {
  const bytes = new Uint8Array(
    await (await fetchFile(FLATGEOBUF_COUNTRIES_DATA_URL)).arrayBuffer()
  );

  return async (_url: string, requestInit?: RequestInit) => {
    const signal = requestInit?.signal;
    if (signal?.aborted) {
      throw createAbortError();
    }

    if (options.delayMs) {
      await waitForDelay(options.delayMs, signal);
    }

    const headers = new Headers(requestInit?.headers);
    const rangeHeader = headers.get('Range');
    const match = rangeHeader?.match(/^bytes=(\d+)-(\d+)$/);

    if (!match) {
      return new Response(bytes, {status: 200});
    }

    const start = Number(match[1]);
    const end = Math.min(Number(match[2]), bytes.byteLength - 1);
    return new Response(bytes.subarray(start, end + 1), {
      status: 206,
      headers: {
        'Content-Range': `bytes ${start}-${end}/${bytes.byteLength}`
      }
    });
  };
}

function getRowsFromArrowTable(table): Record<string, unknown>[] {
  const rows: Record<string, unknown>[] = [];
  for (let rowIndex = 0; rowIndex < table.data.numRows; rowIndex++) {
    rows.push(getTableRowAsObject(table, rowIndex, {}));
  }
  return rows;
}

function normalizeFeatures(features: any[]) {
  return features
    .map(feature => ({
      ...feature,
      geometry: normalizeGeometry(feature.geometry),
      properties: {...(feature.properties || {})}
    }))
    .sort(compareFeatures);
}

function getFeatureKeys(features: any[]) {
  return normalizeFeatures(features).map(feature => `${feature.properties?.id || ''}|${feature.properties?.name || ''}`);
}

function normalizeGeometry(geometry: any) {
  if (!geometry) {
    return geometry;
  }

  const normalizedGeometry = {
    ...geometry,
    coordinates: roundCoordinates(geometry.coordinates)
  };

  switch (geometry.type) {
    case 'MultiPoint':
      return normalizedGeometry.coordinates.length === 1
        ? {type: 'Point', coordinates: normalizedGeometry.coordinates[0]}
        : normalizedGeometry;
    case 'MultiLineString':
      return normalizedGeometry.coordinates.length === 1
        ? {type: 'LineString', coordinates: normalizedGeometry.coordinates[0]}
        : normalizedGeometry;
    case 'MultiPolygon':
      return normalizedGeometry.coordinates.length === 1
        ? {type: 'Polygon', coordinates: normalizedGeometry.coordinates[0]}
        : normalizedGeometry;
    default:
      return normalizedGeometry;
  }
}

function waitForDelay(delayMs: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      cleanup();
      resolve();
    }, delayMs);

    const abort = () => {
      cleanup();
      reject(createAbortError());
    };

    const cleanup = () => {
      clearTimeout(timeoutId);
      signal?.removeEventListener('abort', abort);
    };

    signal?.addEventListener('abort', abort, {once: true});
  });
}

function createAbortError(): Error {
  const error = new Error('Aborted');
  error.name = 'AbortError';
  return error;
}

function compareFeatures(left: any, right: any): number {
  const leftKey = `${left.properties?.id || ''}|${left.properties?.name || ''}`;
  const rightKey = `${right.properties?.id || ''}|${right.properties?.name || ''}`;
  return leftKey.localeCompare(rightKey);
}

function roundCoordinates(coordinates: any): any {
  if (Array.isArray(coordinates)) {
    return coordinates.map(value => roundCoordinates(value));
  }

  return typeof coordinates === 'number' ? Number(coordinates.toFixed(6)) : coordinates;
}
