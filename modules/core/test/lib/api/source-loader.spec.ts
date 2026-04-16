import {pathToFileURL} from 'node:url';
import {expect, test} from 'vitest';
import {createDataSource, fetchFile, load, parse, resolvePath} from '@loaders.gl/core';
import {
  MVTSourceLoader,
  MVTTileSource,
  TableTileSourceLoader,
  TableVectorTileSource
} from '@loaders.gl/mvt';
import {PMTilesSourceLoader, PMTilesTileSource} from '@loaders.gl/pmtiles';
import {WMSSourceLoader, WMSImageSource} from '@loaders.gl/wms';
import {OMEZarrSourceLoader, OMEZarrImageSource} from '@loaders.gl/zarr';
import type {Feature, GeoJSONTable} from '@loaders.gl/schema';

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
  '@loaders.gl/pmtiles/test/data/pmtiles-v2/test_fixture_1.pmtiles'
);
const OME_ZARR_FIXTURE_URL = resolvePath('@loaders.gl/zarr/test/data/ome.zarr');
const OME_ZARR_V3_FIXTURE_URL = pathToFileURL(
  resolvePath('@loaders.gl/zarr/test/data/spatialdata-v3.zarr')
).href;

async function createPmtilesFixtureBlob(): Promise<Blob> {
  const response = await fetchFile(PMTILES_FIXTURE_URL);
  return await response.blob();
}

test('createDataSource#createDataSource returns WMSImageSource for WMSSourceLoader', () => {
  const source = createDataSource('https://example.com/service=wms', [WMSSourceLoader], {});
  expect(source).toBeInstanceOf(WMSImageSource);
});

test('load#load returns WMSImageSource for WMSSourceLoader', async () => {
  const source = await load('https://example.com/service=wms', WMSSourceLoader);
  expect(source).toBeInstanceOf(WMSImageSource);
});

test('load#load returns MVTTileSource for MVTSourceLoader', async () => {
  const source = await load('https://example.com/tiles', MVTSourceLoader);
  expect(source).toBeInstanceOf(MVTTileSource);
});

test('createDataSource#createDataSource returns MVTTileSource for MVTSourceLoader', () => {
  const source = createDataSource('https://example.com/tiles', [MVTSourceLoader], {});
  expect(source).toBeInstanceOf(MVTTileSource);
});

test('load#load returns PMTilesTileSource for PMTilesSourceLoader', async () => {
  const source = await load(await createPmtilesFixtureBlob(), PMTilesSourceLoader);
  expect(source).toBeInstanceOf(PMTilesTileSource);
});

test('load#load returns TableVectorTileSource for TableTileSourceLoader', async () => {
  const source = await load(GEOJSON_TABLE, TableTileSourceLoader);
  expect(source).toBeInstanceOf(TableVectorTileSource);
});

test('load#load returns OMEZarrImageSource for OMEZarrSourceLoader', async () => {
  const source = await load(OME_ZARR_FIXTURE_URL, OMEZarrSourceLoader);
  expect(source).toBeInstanceOf(OMEZarrImageSource);
});

test('createDataSource#createDataSource returns OMEZarrImageSource for OMEZarrSourceLoader', () => {
  const source = createDataSource(OME_ZARR_FIXTURE_URL, [OMEZarrSourceLoader], {});
  expect(source).toBeInstanceOf(OMEZarrImageSource);
});

test('createDataSource#createDataSource returns OMEZarrImageSource for v3 OMEZarrSourceLoader', async () => {
  const source = createDataSource(OME_ZARR_V3_FIXTURE_URL, [OMEZarrSourceLoader], {
    zarr: {path: 'images/example-image'}
  });
  expect(source).toBeInstanceOf(OMEZarrImageSource);
  await expect(source.getMetadata()).resolves.toMatchObject({
    width: 439,
    height: 167,
    bandCount: 3
  });
});

test('parse#parse rejects SourceLoader candidates', async () => {
  await expect(parse('https://example.com/service=wms', [WMSSourceLoader])).rejects.toThrow(
    'SourceLoader'
  );
});
