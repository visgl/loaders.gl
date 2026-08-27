// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {fetchFile} from '@loaders.gl/core';
import {TableVectorTileSource, TableTileSourceLoaderOptions} from '@loaders.gl/mvt';
const DATA_PATH = '@loaders.gl/mvt/test/data/geojson-vt';
const TEST_CASES = [
  {
    inputFile: 'us-states.json',
    expectedFile: 'us-states-tiles.json',
    options: {indexMaxZoom: 7, maxPointsPerTile: 200}
  },
  {
    inputFile: 'dateline.json',
    expectedFile: 'dateline-tiles.json',
    options: {indexMaxZoom: 0, maxPointsPerTile: 10000}
  },
  {
    inputFile: 'dateline.json',
    expectedFile: 'dateline-metrics-tiles.json',
    options: {
      indexMaxZoom: 0,
      maxPointsPerTile: 10000,
      lineMetrics: true
    }
  },
  {
    inputFile: 'feature.json',
    expectedFile: 'feature-tiles.json',
    options: {indexMaxZoom: 0, maxPointsPerTile: 10000}
  },
  {
    inputFile: 'collection.json',
    expectedFile: 'collection-tiles.json',
    options: {indexMaxZoom: 0, maxPointsPerTile: 10000}
  },
  {
    inputFile: 'single-geom.json',
    expectedFile: 'single-geom-tiles.json',
    options: {indexMaxZoom: 0, maxPointsPerTile: 10000}
  },
  {
    inputFile: 'ids.json',
    expectedFile: 'ids-promote-id-tiles.json',
    options: {indexMaxZoom: 0, promoteId: 'prop0'}
  },
  {
    inputFile: 'ids.json',
    expectedFile: 'ids-generate-id-tiles.json',
    options: {indexMaxZoom: 0, generateId: true}
  }
];
test('GeoJSONVT#full tiling test', async () => {
  for (const tc of TEST_CASES) {
    const {inputFile, expectedFile, options} = tc;
    const parsedGeojson = await getJSON(inputFile);
    const tiles = await genTiles(parsedGeojson, options);
    // fs.writeFileSync(path.join(__dirname, '/fixtures/' + expectedFile), JSON.stringify(tiles));
    expect(tiles, `Tiling ${inputFile}: ${expectedFile.replace('-tiles.json', '')}`).toEqual(
      await getJSON(expectedFile)
    );
  }
});
test('GeoJSONVT#throws on invalid GeoJSON', async () => {
  await await expect(async () => {
    await genTiles({type: 'Pologon'});
  }).rejects.toBeDefined();
});
test('GeoJSONVT#empty geojson', async () => {
  expect({}).toEqual(await genTiles(await getJSON('empty.json')));
});
test('GeoJSONVT#null geometry', async () => {
  // should ignore features with null geometry
  expect({}).toEqual(await genTiles(await getJSON('feature-null-geometry.json')));
});
// Helpers
async function getJSON(name) {
  const response = await fetchFile(`${DATA_PATH}/${name}`);
  const json = await response.json();
  return json;
}
/** Generate tiles for a GeoJSON files */
async function genTiles(
  data,
  options?: TableTileSourceLoaderOptions['table']
): Promise<Record<string, unknown>> {
  const geojsonType = data?.type;
  const isGeometryType = [
    'Point',
    'MultiPoint',
    'LineString',
    'MultiLineString',
    'Polygon',
    'MultiPolygon',
    'GeometryCollection'
  ].includes(geojsonType);
  if (
    data?.shape !== 'geojson-table' &&
    !Array.isArray(data?.features) &&
    geojsonType !== 'Feature' &&
    !isGeometryType
  ) {
    throw new Error('TableVectorTileSource requires a GeoJSON FeatureCollection or GeoJSONTable');
  }
  const table =
    data?.shape === 'geojson-table'
      ? data
      : data?.type === 'Feature'
        ? {
            shape: 'geojson-table',
            type: 'FeatureCollection',
            features: [data]
          }
        : isGeometryType
          ? {
              shape: 'geojson-table',
              type: 'FeatureCollection',
              features: [{type: 'Feature', geometry: data, properties: null}]
            }
          : {
              shape: 'geojson-table',
              type: 'FeatureCollection',
              features: data?.features || []
            };
  const source = new TableVectorTileSource(table, {
    table: Object.assign(
      {
        indexMaxZoom: 0,
        maxPointsPerTile: 10000
      },
      options
    )
  });
  await source.ready;
  const output = {};
  for (const id in source.tiles) {
    const tile = source.tiles[id];
    const protoFeatures =
      source.getProtoTile({
        z: tile.z,
        x: tile.x,
        y: tile.y
      })?.protoFeatures || [];
    output[`z${tile.z}-${tile.x}-${tile.y}`] = protoFeatures.map(feature => ({
      geometry: feature.geometry,
      type: feature.simplifiedType,
      tags: feature.tags,
      id: feature.id
    }));
  }
  return output;
}
