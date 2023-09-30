// loaders.gl, MIT license
// Forked from https://github.com/mapbox/geojson-vt under compatible ISC license

import test from 'tape-promise/tape';
import {fetchFile} from '@loaders.gl/core';
import {GeoJSONTileSource, GeoJSONTileSourceOptions} from '@loaders.gl/mvt';

const DATA_PATH = '@loaders.gl/mvt/test/data/geojson-vt';

const square = [
  {
    geometry: [
      [
        [-64, 4160],
        [-64, -64],
        [4160, -64],
        [4160, 4160],
        [-64, 4160]
      ]
    ],
    type: 3,
    tags: {name: 'Pennsylvania', density: 284.3},
    id: '42'
  }
];

test('GeoJSONTileSource#constructor', t => {
  const source = new GeoJSONTileSource({
    data: {
      type: 'FeatureCollection',
      features: []
    }
  });

  t.ok(source, 'GeoJSONTileSource created');
  t.end();
});

test('GeoJSONTileSource#getTileSync#us-states.json', async (t) => {
  const log = console.log;
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  console.log = function () {};

  const geojson = await getJSON('us-states.json');
  const index = new GeoJSONTileSource(geojson, {debug: 2});

  t.same(index.getTileSync({zoom: 7, x: 37, y: 48})?.features, await getJSON('us-states-z7-37-48.json'), 'z7-37-48');
  // t.same(index.getTileSync({zoom: '7',x:  '37', y: '48}')?.features, getJSON('us-states-z7-37-48.json'), 'z, x, y as strings');

  t.same(index.getTileSync({zoom: 9, x: 148, y: 192})?.features, square, 'z9-148-192 (clipped square)');
  // t.same(index.getTileSync({zoom: 11, x: 592, y: 768})?.features, square, 'z11-592-768 (clipped square)');

  t.equal(index.getTileSync({zoom: 11, x: 800, y: 400}), null, 'non-existing tile');
  t.equal(index.getTileSync({zoom: -5, x: 123.25,y:  400.25}), null, 'invalid tile');
  t.equal(index.getTileSync({zoom: 25, x: 200, y: 200}), null, 'invalid tile');

  console.log = log;

  t.equal(index.total, 37);

  t.end();
});

test('GeoJSONTileSource#getTileSync#unbuffered tile left/right edges', (t) => {
  const index = new GeoJSONTileSource(
    {
      type: 'LineString',
      coordinates: [
        [0, 90],
        [0, -90]
      ]
    },
    {
      buffer: 0
    }
  );

  t.same(index.getTileSync({zoom: 2, x: 1, y: 1}), null);
  t.same(index.getTileSync({zoom: 2, x: 2, y: 1})?.features, [
    {
      geometry: [
        [
          [0, 0],
          [0, 4096]
        ]
      ],
      type: 2,
      tags: null
    }
  ]);
  t.end();
});

test('GeoJSONTileSource#getTileSync#unbuffered tile top/bottom edges', (t) => {
  const index = new GeoJSONTileSource(
    {
      type: 'LineString',
      coordinates: [
        [-90, 66.51326044311188],
        [90, 66.51326044311188]
      ]
    },
    {
      buffer: 0
    }
  );

  t.same(index.getTileSync({zoom: 2, x: 1, y: 0})?.features, [
    {
      geometry: [
        [
          [0, 4096],
          [4096, 4096]
        ]
      ],
      type: 2,
      tags: null
    }
  ]);
  t.same(index.getTileSync({zoom: 2, x: 1, y: 1})?.features, []);
  t.end();
});

test('GeoJSONTileSource#getTileSync#polygon clipping on the boundary', (t) => {
  const index = new GeoJSONTileSource(
    {
      type: 'Polygon',
      coordinates: [
        [
          [42.1875, 57.32652122521708],
          [47.8125, 57.32652122521708],
          [47.8125, 54.16243396806781],
          [42.1875, 54.16243396806781],
          [42.1875, 57.32652122521708]
        ]
      ]
    },
    {
      buffer: 1024
    }
  );

  t.same(index.getTileSync({zoom: 5, x: 19, y: 9})?.features, [
    {
      geometry: [
        [
          [3072, 3072],
          [5120, 3072],
          [5120, 5120],
          [3072, 5120],
          [3072, 3072]
        ]
      ],
      type: 3,
      tags: null
    }
  ]);

  t.end();
});

// multi-world spec

const leftPoint = {
  type: 'Feature',
  properties: {},
  geometry: {
    coordinates: [-540, 0],
    type: 'Point'
  }
};

const rightPoint = {
  type: 'Feature',
  properties: {},
  geometry: {
    coordinates: [540, 0],
    type: 'Point'
  }
};

test('GeoJSONTileSource#handle point only in the rightside world', (t) => {
  try {
    const vt = new GeoJSONTileSource(rightPoint);
    t.equal(vt.tiles[0].features[0].geometry[0], 1);
    t.equal(vt.tiles[0].features[0].geometry[1], 0.5);
  } catch (err) {
    t.ifError(err);
  }
  t.end();
});

test('GeoJSONTileSource#handle point only in the leftside world', (t) => {
  try {
    const vt = new GeoJSONTileSource(leftPoint);
    t.equal(vt.tiles[0].features[0].geometry[0], 0);
    t.equal(vt.tiles[0].features[0].geometry[1], 0.5);
  } catch (err) {
    t.ifError(err);
  }
  t.end();
});

test('GeoJSONTileSource#handle points in the leftside world and the rightside world', (t) => {
  try {
    const vt = new GeoJSONTileSource({
      type: 'FeatureCollection',
      features: [leftPoint, rightPoint]
    });

    t.equal(vt.tiles[0].features[0].geometry[0], 0);
    t.equal(vt.tiles[0].features[0].geometry[1], 0.5);

    t.equal(vt.tiles[0].features[1].geometry[0], 1);
    t.equal(vt.tiles[0].features[1].geometry[1], 0.5);
  } catch (err) {
    t.ifError(err);
  }
  t.end();
});

// full spect


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

test('GeoJSONTileSource#throws on invalid GeoJSON', (t) => {
  t.throws(() => {
    genTiles({type: 'Pologon'});
  });
  t.end();
});

function testTiles(inputFile, expectedFile, options) {
  test(`GeoJSONTileSource#full tiling test: ${expectedFile.replace('-tiles.json', '')}`, async (t) => {
    const parsedGeojson = await getJSON(inputFile);
    const tiles = genTiles(parsedGeojson, options);
    // fs.writeFileSync(path.join(__dirname, '/fixtures/' + expectedFile), JSON.stringify(tiles));
    t.same(tiles, await getJSON(expectedFile));
    t.end();
  });
}

test('GeoJSONTileSource#empty geojson', async (t) => {
  t.same({}, genTiles(await getJSON('empty.json')));
  t.end();
});

test('GeoJSONTileSource#null geometry', async (t) => {
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
function genTiles(data, options?: GeoJSONTileSourceOptions) {
  const index = new GeoJSONTileSource(
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
    output[`z${z}-${tile.x}-${tile.y}`] = index.getTileSync({zoom: z, x: tile.x,y:  tile}.y)?.features;
  }

  return output;
}
