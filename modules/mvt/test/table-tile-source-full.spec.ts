// loaders.gl
// SPDX-License-Identifier: MIT AND ISC
// Copyright (c) vis.gl contributors
// Forked from https://github.com/mapbox/geojson-vt under compatible ISC license

import {expect, test} from 'vitest';
import {fetchFile} from '@loaders.gl/core';
import {TableTileSource, TableTileSourceProps} from '@loaders.gl/mvt';

const DATA_PATH = '@loaders.gl/mvt/test/data/geojson-vt';

const TEST_CASES = [
  {
    inputFile: 'us-states.json',
    expectedFile: 'us-states-tiles.json',
    options: {indexMaxZoom: 7, indexMaxPoints: 200}
  },
  {
    inputFile: 'dateline.json',
    expectedFile: 'dateline-tiles.json',
    options: {indexMaxZoom: 0, indexMaxPoints: 10000}
  },
  {
    inputFile: 'dateline.json',
    expectedFile: 'dateline-metrics-tiles.json',
    options: {
      indexMaxZoom: 0,
      indexMaxPoints: 10000,
      lineMetrics: true
    }
  },
  {
    inputFile: 'feature.json',
    expectedFile: 'feature-tiles.json',
    options: {indexMaxZoom: 0, indexMaxPoints: 10000}
  },
  {
    inputFile: 'collection.json',
    expectedFile: 'collection-tiles.json',
    options: {indexMaxZoom: 0, indexMaxPoints: 10000}
  },
  {
    inputFile: 'single-geom.json',
    expectedFile: 'single-geom-tiles.json',
    options: {indexMaxZoom: 0, indexMaxPoints: 10000}
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
    expect(
      tiles,
      `Tiling ${inputFile}: ${expectedFile.replace('-tiles.json', '')}`
    ).toEqual(await getJSON(expectedFile));
  }
});

test('GeoJSONVT#throws on invalid GeoJSON', async () => {
  expect(() => {
    genTiles({type: 'Pologon'});
  }).toThrow();
});

test('GeoJSONVT#empty geojson', async () => {
  expect(await genTiles(await getJSON('empty.json'))).toEqual({});
});

test('GeoJSONVT#null geometry', async () => {
  // should ignore features with null geometry
  expect(await genTiles(await getJSON('feature-null-geometry.json'))).toEqual({});
});

// Helpers

async function getJSON(name) {
  const response = await fetchFile(`${DATA_PATH}/${name}`);
  const json = await response.json();
  return json;
}

/** Generate tiles for a GeoJSON files */
async function genTiles(data, options?: TableTileSourceProps) {
  const source = new TableTileSource(
    data,
    Object.assign(
      {
        indexMaxZoom: 0,
        indexMaxPoints: 10000
      },
      options
    )
  );
  await source.ready;

  const output = {};

  for (const id in source.tiles) {
    const tile = source.tiles[id];
    output[`z${tile.z}-${tile.x}-${tile.y}`] = source.getProtoTile({
      z: tile.z,
      x: tile.x,
      y: tile.y
    })?.protoFeatures;
  }

  return output;
}
