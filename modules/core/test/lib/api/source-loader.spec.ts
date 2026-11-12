// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {
  createDataSource,
  _selectSource as selectSource,
  createDataSourceSync,
  fetchFile,
  load,
  parse,
  resolvePath
} from '@loaders.gl/core';
import {
  MVTSourceLoader,
  MVTTileSource,
  TableTileSourceLoader,
  TableVectorTileSource
} from '@loaders.gl/tiles/mvt';
import {PMTilesSourceLoader, PMTilesTileSource} from '@loaders.gl/tiles/pmtiles';
import {WMSSourceLoader, WMSImageSource} from '@loaders.gl/ogc/wms';
import {OMEZarrSourceLoader, OMEZarrImageSource} from '@loaders.gl/scientific/zarr';
import type {Feature, GeoJSONTable} from '@loaders.gl/core/schema';

const GEOJSON_TABLE: GeoJSONTable = {
  shape: 'geojson-table',
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {type: 'Point', coordinates: [0, 0]},
      properties: {name: 'origin'}
    } as Feature
  ]
};

const PMTILES_FIXTURE_URL = resolvePath(
  '@loaders.gl/tiles/pmtiles/test/data/pmtiles-v2/test_fixture_1.pmtiles'
);
const OME_ZARR_FIXTURE_URL = resolvePath('@loaders.gl/scientific/test/zarr/data/ome.zarr');

test('source entrypoints share flat loading controls and parser namespaces', async () => {
  const fetchResource = vi.fn(async () => new Response('ok'));
  const options = {
    core: {type: 'wms', fetch: fetchResource, worker: false},
    wms: {substituteCRS84: false, minimalErrors: true},
    imagebitmap: {imageOrientation: 'flipY' as const}
  };
  const selected = createDataSourceSync(
    'https://example.com/service',
    [MVTSourceLoader, WMSSourceLoader],
    options
  );
  const loaded = await createDataSource('https://example.com/service', WMSSourceLoader, options);
  for (const source of [selected, loaded]) {
    expect(source).toBeInstanceOf(WMSImageSource);
    expect(source.loadOptions.wms).toEqual(options.wms);
    expect(source.loadOptions.imagebitmap).toEqual(options.imagebitmap);
    expect(source.loadOptions.core).toEqual({fetch: fetchResource, worker: false});
    await source.fetch('memory://subresource');
  }
  expect(fetchResource).toHaveBeenCalledTimes(2);
});

async function createPmtilesFixtureBlob(): Promise<Blob> {
  const response = await fetchFile(PMTILES_FIXTURE_URL);
  return await response.blob();
}

test('createDataSource#createDataSource returns WMSImageSource for WMSSourceLoader', () => {
  const source = createDataSourceSync('https://example.com/service=wms', [WMSSourceLoader], {});
  expect(source).toBeInstanceOf(WMSImageSource);
});

test('load#load returns WMSImageSource for WMSSourceLoader', async () => {
  const source = await createDataSource('https://example.com/service=wms', WMSSourceLoader);
  expect(source).toBeInstanceOf(WMSImageSource);
});

test('load#load returns MVTTileSource for MVTSourceLoader', async () => {
  const source = await createDataSource('https://example.com/tiles', MVTSourceLoader);
  expect(source).toBeInstanceOf(MVTTileSource);
});

test('createDataSource#createDataSource returns MVTTileSource for MVTSourceLoader', () => {
  const source = createDataSourceSync('https://example.com/tiles', [MVTSourceLoader], {});
  expect(source).toBeInstanceOf(MVTTileSource);
});

test('load#load returns PMTilesTileSource for PMTilesSourceLoader', async () => {
  const source = await createDataSource(await createPmtilesFixtureBlob(), PMTilesSourceLoader);
  expect(source).toBeInstanceOf(PMTilesTileSource);
});

test('load#load returns TableVectorTileSource for TableTileSourceLoader', async () => {
  const source = await createDataSource(GEOJSON_TABLE, TableTileSourceLoader);
  expect(source).toBeInstanceOf(TableVectorTileSource);
});

test('load#load returns OMEZarrImageSource for OMEZarrSourceLoader', async () => {
  const source = await createDataSource(OME_ZARR_FIXTURE_URL, OMEZarrSourceLoader);
  expect(source).toBeInstanceOf(OMEZarrImageSource);
});

test('createDataSource#createDataSource returns OMEZarrImageSource for OMEZarrSourceLoader', () => {
  const source = createDataSourceSync(OME_ZARR_FIXTURE_URL, [OMEZarrSourceLoader], {});
  expect(source).toBeInstanceOf(OMEZarrImageSource);
});

test('parse#parse rejects SourceLoader candidates', async () => {
  await expect(parse('https://example.com/service=wms', [WMSSourceLoader])).rejects.toThrow(
    'SourceLoader'
  );
});

test('selectSource#selectSource selects an explicit source type', () => {
  expect(selectSource('https://example.com/service=wms', [WMSSourceLoader], {type: 'wms'})).toBe(
    WMSSourceLoader
  );
});

test('selectSource#selectSource returns null for an unknown type with nothrow', () => {
  expect(
    selectSource('https://example.com/service=wms', [WMSSourceLoader], {
      type: 'unknown',
      nothrow: true
    })
  ).toBeNull();
});

test('one lazy loader can parse data and construct a source explicitly', async () => {
  const createDataSourceSyncFactory = vi.fn((data: unknown) => ({input: data}));
  const metadata = {
    name: 'Dual capability test',
    id: 'dual-test',
    module: 'test',
    version: '1',
    extensions: ['dual-test'],
    mimeTypes: ['text/plain'],
    options: {},
    text: true
  };
  const implementation = {
    ...metadata,
    parseText: async (text: string) => text.toUpperCase(),
    createDataSourceSync: createDataSourceSyncFactory
  };
  const loader = {...metadata, preload: vi.fn(async () => implementation)};
  const url = 'https://example.test/data.dual-test';
  const fetch = vi.fn(async () => new Response('hello', {headers: {'Content-Type': 'text/plain'}}));

  expect(() => createDataSourceSync(url, loader)).toThrow('no synchronous source factory');
  expect(await load(url, loader, {core: {fetch}})).toBe('HELLO');
  expect(createDataSourceSyncFactory).not.toHaveBeenCalled();
  expect(await createDataSource(url, loader)).toEqual({input: url});
  expect(createDataSourceSync(url, loader)).toEqual({input: url});
  expect(loader.preload).toHaveBeenCalledTimes(1);
  expect(fetch).toHaveBeenCalledTimes(1);
});

test('load rejects source-only loaders without constructing a source', async () => {
  const factory = vi.fn();
  const metadata = {
    name: 'Source factory test',
    id: 'factory-test',
    module: 'test',
    version: '1',
    extensions: ['factory-test'],
    mimeTypes: [],
    options: {}
  };
  const implementation = {...metadata, createDataSourceSync: factory};
  const loader = {...metadata, preload: async () => implementation};
  const url = 'https://example.test/data.factory-test';

  await expect(load(url, loader)).rejects.toThrow('Use createDataSource()');
  await expect(load('https://example.test/service?service=wms', WMSSourceLoader)).rejects.toThrow(
    'Use createDataSource()'
  );
  expect(factory).not.toHaveBeenCalled();
});
