// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Forked from https://github.com/mapbox/geojson-vt under compatible ISC license

import test from 'tape-promise/tape';
import {fetchFile} from '@loaders.gl/core';
import {GeoJSONTiler, GeoJSONTilerOptions} from '@loaders.gl/mvt';

const DATA_PATH = '@loaders.gl/mvt/test/data/geojson-vt';

testTiles('us-states.json', 'us-states-tiles.json', {indexMaxZoom: 7, indexMaxPoints: 200});
testTiles('dateline.json', 'dateline-tiles.json', {indexMaxZoom: 0, indexMaxPoints: 10000});
testTiles('dateline.json', 'dateline-metrics-tiles.json', {
  indexMaxZoom: 0,
  indexMaxPoints: 10000,
  lineMetrics: true
});
testTiles('feature.json', 'feature-tiles.json', {indexMaxZoom: 0, indexMaxPoints: 10000});
testTiles('collection.json', 'collection-tiles.json', {indexMaxZoom: 0, indexMaxPoints: 10000});
testTiles('single-geom.json', 'single-geom-tiles.json', {indexMaxZoom: 0, indexMaxPoints: 10000});
testTiles('ids.json', 'ids-promote-id-tiles.json', {indexMaxZoom: 0, promoteId: 'prop0'});
testTiles('ids.json', 'ids-generate-id-tiles.json', {indexMaxZoom: 0, generateId: true});

test('GeoJSONVT#throws on invalid GeoJSON', (t) => {
  t.throws(() => {
    genTiles({type: 'Pologon'});
  });
  t.end();
});

function testTiles(inputFile, expectedFile, options) {
  test(`GeoJSONVT#full tiling test: ${expectedFile.replace('-tiles.json', '')}`, async (t) => {
    const parsedGeojson = await getJSON(inputFile);
    const tiles = genTiles(parsedGeojson, options);
    // fs.writeFileSync(path.join(__dirname, '/fixtures/' + expectedFile), JSON.stringify(tiles));
    t.same(tiles, await getJSON(expectedFile));
    t.end();
  });
}

test('GeoJSONVT#empty geojson', async (t) => {
  t.same({}, genTiles(await getJSON('empty.json')));
  t.end();
});

test('GeoJSONVT#null geometry', async (t) => {
  // should ignore features with null geometry
  t.same({}, genTiles(await getJSON('feature-null-geometry.json')));
  t.end();
});

async function getJSON(name) {
  const response = await fetchFile(`${DATA_PATH}/${name}`);
  const json = await response.json();
  return json;
}

/** Generate tiles for a GeoJSON files */
function genTiles(data, options?: GeoJSONTilerOptions) {
  const index = new GeoJSONTiler(
    data,
    Object.assign(
      {
        indexMaxZoom: 0,
        indexMaxPoints: 10000
      },
      options
    )
  );

  const output = {};

  for (const id in index.tiles) {
    const tile = index.tiles[id];
    const z = tile.z;
    output[`z${z}-${tile.x}-${tile.y}`] = index.getTile(z, tile.x, tile.y)?.features;
  }

  return output;
}
