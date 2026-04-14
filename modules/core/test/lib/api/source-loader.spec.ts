import {expect, test} from 'vitest';
import {createDataSource, load, parse} from '@loaders.gl/core';
import {
  MVTSourceLoader,
  MVTTileSource,
  TableTileSourceLoader,
  TableVectorTileSource
} from '@loaders.gl/mvt';
import {PMTilesSourceLoader, PMTilesTileSource} from '@loaders.gl/pmtiles';
import {WMSSourceLoader, WMSImageSource} from '@loaders.gl/wms';
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
  const source = await load('https://example.com/tiles.pmtiles', PMTilesSourceLoader);
  expect(source).toBeInstanceOf(PMTilesTileSource);
});

test('load#load returns TableVectorTileSource for TableTileSourceLoader', async () => {
  const source = await load(GEOJSON_TABLE, TableTileSourceLoader);
  expect(source).toBeInstanceOf(TableVectorTileSource);
});

test('parse#parse rejects SourceLoader candidates', async () => {
  await expect(parse('https://example.com/service=wms', [WMSSourceLoader])).rejects.toThrow(
    'SourceLoader'
  );
});
