// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {createDataSource, fetchFile, resolvePath} from '@loaders.gl/core';
import {FlatGeobufSourceLoader, FlatGeobufVectorSource} from '@loaders.gl/flatgeobuf';
import {convertBinaryFeatureCollectionToGeojson} from '@loaders.gl/gis';
import {convertGeoArrowToTable} from '@loaders.gl/geoarrow';
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
test('FlatGeobufSourceLoader#createDataSource selects FlatGeobuf source from URL', async () => {
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
  expect(source instanceof FlatGeobufVectorSource, 'returns FlatGeobufVectorSource').toBeTruthy();
});
test('FlatGeobufSourceLoader#getSchema and getMetadata expose header metadata', async () => {
  const source = await createSource();
  const schema = await source.getSchema();
  const metadata = await source.getMetadata();
  const metadataWithFormatSpecific = await source.getMetadata({formatSpecificMetadata: true});
  expect(schema.fields.length, 'returns the property schema').toBe(2);
  expect(
    schema.fields.map(field => field.name),
    'schema fields follow the FlatGeobuf header'
  ).toEqual(['id', 'name']);
  expect(metadata.name, 'infers dataset name from URL').toBe('countries');
  expect(metadata.layers.length, 'returns one dataset layer').toBe(1);
  expect(metadata.layers[0]?.name, 'layer name matches dataset').toBe('countries');
  expect(Array.isArray(metadata.layers[0]?.crs), 'metadata exposes CRS list').toBeTruthy();
  expect(
    metadata.layers[0]?.crs,
    'metadata combines the declared CRS authority and code'
  ).toContain('EPSG:4326');
  expect(metadata.layers[0]?.spatialReference?.crs).toMatchObject({
    state: 'explicit',
    representation: 'wkt',
    provenance: 'metadata'
  });
  expect(
    metadata.layers[0]?.spatialReference?.crs.state === 'explicit'
      ? metadata.layers[0].spatialReference.crs.alternatives
      : undefined
  ).toContainEqual({definition: 'EPSG:4326', representation: 'identifier'});
  expect(metadata.formatSpecificMetadata, 'raw metadata is opt-in').toBe(undefined);
  expect(
    metadataWithFormatSpecific.formatSpecificMetadata,
    'returns raw metadata on request'
  ).toBeTruthy();
  expect(
    (metadataWithFormatSpecific.formatSpecificMetadata as {crs?: {org?: string}}).crs?.org,
    'format-specific metadata preserves the declared CRS authority'
  ).toBe('EPSG');
});
test('FlatGeobufVectorSource#getQueryMetadata discovers panel controls from the header', async () => {
  const source = await createSource();
  const queryMetadata = await source.getQueryMetadata();
  expect(queryMetadata.sourceType, 'identifies the source adapter').toBe('flatgeobuf');
  expect(queryMetadata.execution, 'identifies the common execution entry point').toEqual({
    status: 'supported',
    method: 'read'
  });
  expect(
    queryMetadata.columns.map(column => column.name),
    'includes every query-visible column'
  ).toEqual(['id', 'name', 'geometry']);
  expect(queryMetadata.columns[2]?.role, 'identifies the geometry control').toBe('geometry');
  expect(queryMetadata.capabilities.bounds, 'advertises packed R-tree pruning').toBe('pushdown');
  expect(queryMetadata.spatial?.bounds, 'discovers dataset bounds').toBeTruthy();
  expect(queryMetadata.spatial?.spatialReference?.crs).toMatchObject({
    state: 'explicit',
    representation: 'wkt',
    provenance: 'metadata'
  });
  expect(queryMetadata.statistics?.rowCount, 'discovers feature count').toBe(179);
});
test('FlatGeobufSourceLoader#getFeatures returns matching feature sets across formats', async () => {
  const source = await createSource();
  const defaultTable = await source.getFeatures({
    layers: 'countries',
    boundingBox: NARROW_BOUNDING_BOX
  });
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
  expect(defaultTable.shape, 'returns Arrow tables by default').toBe('arrow-table');
  expect(geojson.shape, 'returns GeoJSON tables').toBe('geojson-table');
  expect(geojson.features.length > 0, 'returns matching features').toBeTruthy();
  expect(geojson.features.length < 179, 'uses indexed subset instead of full dataset').toBeTruthy();
  const binaryGeojson = convertBinaryFeatureCollectionToGeojson(binary);
  expect(
    getFeatureKeys(binaryGeojson as any),
    'binary source output round-trips to the same features'
  ).toEqual(getFeatureKeys(geojson.features));
  expect(arrow.shape, 'returns Arrow tables').toBe('arrow-table');
  const geometryField = arrow.schema.fields[arrow.schema.fields.length - 1];
  expect(geometryField?.name, 'Arrow schema appends geometry').toBe('geometry');
  expect(
    geometryField?.metadata?.['ARROW:extension:name'],
    'Arrow geometry uses compact GeoArrow WKB encoding'
  ).toBe('geoarrow.wkb');
  expect(arrow.schema.metadata?.geo, 'Arrow schema includes geo metadata').toBeTruthy();
  const arrowGeojson = convertGeoArrowToTable(arrow.data, 'geojson-table');
  expect(
    getFeatureKeys(arrowGeojson.features),
    'Arrow source output round-trips to the same features'
  ).toEqual(getFeatureKeys(geojson.features));
});
test('FlatGeobufSourceLoader#getFeatures reprojects Arrow and GeoJSON consistently', async () => {
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
  const arrowGeojson = convertGeoArrowToTable(arrow.data, 'geojson-table');
  expect(
    getFeatureKeys(arrowGeojson.features),
    'reprojected Arrow source output matches GeoJSON source output'
  ).toEqual(getFeatureKeys(geojson.features));
});
test('FlatGeobufSourceLoader#getFeatures returns empty valid tables for no-match bboxes', async () => {
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
  expect(geojson.features.length, 'empty GeoJSON response is valid').toBe(0);
  expect(
    (convertBinaryFeatureCollectionToGeojson(binary) as any).length,
    'empty binary response is valid'
  ).toBe(0);
  expect(arrow.data.numRows, 'empty Arrow response preserves schema').toBe(0);
});
test('FlatGeobufVectorSource#query combines bbox pruning with portable projection and limit', async () => {
  const source = await createSource();
  const table = await source.query({
    boundingBox: NARROW_BOUNDING_BOX,
    columns: ['name'],
    predicate: {op: '<>', args: [{property: 'id'}, '']},
    limit: 2
  });
  expect(
    table.schema.fields.map(field => field.name),
    'projects requested fields'
  ).toEqual(['name']);
  expect(table.data.numRows, 'applies a global limit after the residual predicate').toBe(2);
  expect(source.tableQueryCapabilities.predicate, 'reports conservative capability').toBe(
    'residual'
  );
});
test('FlatGeobufVectorSource#explain reports relational and spatial planning', async () => {
  const source = await createSource();
  const explanation = await source.explain({
    boundingBox: NARROW_BOUNDING_BOX,
    columns: ['name'],
    predicate: {op: '<>', args: [{property: 'id'}, '']},
    limit: 2
  });
  expect(explanation.outputColumns, 'reports visible output columns').toEqual(['name']);
  expect(explanation.requiredColumns, 'retains hidden predicate columns').toEqual(['id', 'name']);
  expect(explanation.spatial.enabled, 'reports requested bounds').toBe(true);
  expect(explanation.spatial.support, 'reports packed R-tree pushdown').toBe('pushdown');
});

test('FlatGeobufVectorSource#explain reports plans without spatial bounds', async () => {
  const source = await createSource();
  const explanation = await source.explain({});

  expect(explanation.outputColumns).toEqual(['id', 'name', 'geometry']);
  expect(explanation.requiredColumns).toEqual(['id', 'name', 'geometry']);
  expect(explanation.spatial).toEqual({enabled: false, support: 'pushdown'});
});

test('FlatGeobufVectorSource#read emits one bounded Arrow batch', async () => {
  const source = await createSource();
  const batches = [];
  for await (const batch of source.read({limit: 1})) batches.push(batch);

  expect(batches).toHaveLength(1);
  expect(batches[0]?.shape).toBe('arrow-table');
  expect(batches[0]?.data.numRows).toBe(1);
});

test('FlatGeobufSourceLoader recognizes URL query and fragment suffixes', () => {
  expect(FlatGeobufSourceLoader.testURL('https://example.com/countries.fgb?download=1')).toBe(true);
  expect(FlatGeobufSourceLoader.testURL('https://example.com/countries.fgb#map')).toBe(true);
  expect(FlatGeobufSourceLoader.testURL('https://example.com/countries.geojson')).toBe(false);
});
test('FlatGeobufSourceLoader#getFeatures respects abort signals', async () => {
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
    (() => {
      throw new Error('expected request to abort');
    })();
  } catch (error) {
    expect((error as Error).name, 'throws AbortError').toBe('AbortError');
  }
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
  return normalizeFeatures(features).map(
    feature => `${feature.properties?.id || ''}|${feature.properties?.name || ''}`
  );
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
