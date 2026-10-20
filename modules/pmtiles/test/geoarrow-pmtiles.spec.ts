// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import * as arrow from 'apache-arrow';
import {decodeTile} from '@maplibre/mlt';
import {PMTiles, type Source} from 'pmtiles';
import {parse} from '@loaders.gl/core';
import {MVTLoader} from '@loaders.gl/mvt';
import {encodeGeoArrowPMTiles} from '../src/geoarrow';
import {convertFeaturesToGeoArrowTable} from '@loaders.gl/arrow-geometry/feature-table';
import type {GeoArrowEncodingPreference, Geometry} from '@loaders.gl/core/schema';

/** Two separated source points make partial selection and empty-address handling observable. */
function createTable(encodingPreference: GeoArrowEncodingPreference = 'geoarrow.wkb') {
  return convertFeaturesToGeoArrowTable(
    [
      {
        type: 'Feature',
        geometry: {type: 'Point', coordinates: [-90, 40]},
        properties: {id: 1, name: 'west', enabled: true}
      },
      {
        type: 'Feature',
        geometry: {type: 'Point', coordinates: [90, -40]},
        properties: {id: 2, name: 'east', enabled: false}
      }
    ],
    {encodingPreference}
  );
}

/** Independent PMTiles reader; all data is local and small. */
function openArchive(data: ArrayBuffer): PMTiles {
  const source: Source = {
    getKey: () => 'geoarrow-export',
    getBytes: async (offset, length) => ({data: data.slice(offset, offset + length)})
  };
  return new PMTiles(source);
}

const TABLE_OPTIONS = {maxZoom: 2, indexMaxZoom: 0, buffer: 0};
const SELECTED = [
  {z: 1, x: 0, y: 0},
  {z: 1, x: 0, y: 1},
  {z: 1, x: 1, y: 1}
];

test.each([
  'geoarrow.wkb',
  'optimized',
  'geoarrow.geometry'
] as const)('GeoArrow %s export reuses tiling and preserves MVT properties and IDs', async encoding => {
  const input = createTable(encoding);
  const bytes = await encodeGeoArrowPMTiles(input, {
    tiles: SELECTED,
    table: TABLE_OPTIONS,
    mvt: {layerName: 'places', idColumn: 'id'},
    pmtiles: {
      internalCompression: 'gzip',
      metadata: {
        name: 'sample',
        minzoom: 99,
        bounds: [0, 0, 1, 1],
        vector_layers: [{id: 'stale'}],
        tilestats: {old: true}
      }
    }
  });
  const archive = openArchive(bytes);
  expect(await archive.getHeader()).toMatchObject({
    tileType: 1,
    tileCompression: 1,
    internalCompression: 2,
    minZoom: 1,
    maxZoom: 1,
    numAddressedTiles: 2
  });
  expect(await archive.getMetadata()).toEqual({
    name: 'sample',
    vector_layers: [{id: 'places', fields: {id: 'Number', name: 'String', enabled: 'Boolean'}}]
  });
  expect(await archive.getZxy(1, 0, 1)).toBeUndefined();
  for (const [x, y, id, name] of [
    [0, 0, 1, 'west'],
    [1, 1, 2, 'east']
  ] as const) {
    const tile = await archive.getZxy(1, x, y);
    const decoded = await parse(tile!.data, MVTLoader, {
      core: {worker: false},
      mvt: {shape: 'geojson-table', tileIndex: {z: 1, x, y}, coordinates: 'wgs84'}
    });
    expect(decoded.features).toHaveLength(1);
    expect(decoded.features[0].id).toBe(id);
    expect(decoded.features[0].properties).toMatchObject({id, name, enabled: id === 1});
    expect(decoded.features[0].geometry.coordinates[0]).toBeCloseTo(id === 1 ? -90 : 90, 2);
    expect(decoded.features[0].geometry.coordinates[1]).toBeCloseTo(id === 1 ? 40 : -40, 1);
  }
  expect(input.data.numRows).toBe(2);
});

test('GeoArrow partial export bounds the selection, includes only chosen properties and is deterministic', async () => {
  const input = createTable();
  const options = {
    tiles: [SELECTED[0]],
    table: TABLE_OPTIONS,
    mvt: {propertyColumns: ['name']},
    pmtiles: {bounds: [-100, 30, -80, 50] as const}
  };
  const bytes = await encodeGeoArrowPMTiles(input.data, options);
  expect(await encodeGeoArrowPMTiles(input, options)).toEqual(bytes);
  const archive = openArchive(bytes);
  expect(await archive.getHeader()).toMatchObject({
    numAddressedTiles: 1,
    minLon: -100,
    minLat: 30,
    maxLon: -80,
    maxLat: 50
  });
  expect(await archive.getMetadata()).toEqual({
    vector_layers: [{id: 'features', fields: {name: 'String'}}]
  });
});

test('GeoArrow MVT export preserves clipped polygon holes and line attributes', async () => {
  const geometries: Geometry[] = [
    {
      type: 'Polygon',
      coordinates: [
        [
          [-20, -20],
          [20, -20],
          [20, 20],
          [-20, 20],
          [-20, -20]
        ],
        [
          [-5, -5],
          [-5, 5],
          [5, 5],
          [5, -5],
          [-5, -5]
        ]
      ]
    },
    {
      type: 'LineString',
      coordinates: [
        [-180, 10],
        [0, 10],
        [180, 10]
      ]
    }
  ];
  const table = convertFeaturesToGeoArrowTable(
    geometries.map((geometry, index) => ({type: 'Feature', geometry, properties: {id: index}})),
    {encodingPreference: 'geoarrow.wkb'}
  );
  const archive = openArchive(
    await encodeGeoArrowPMTiles(table, {tiles: [{z: 0, x: 0, y: 0}], mvt: {idColumn: 'id'}})
  );
  const tile = await archive.getZxy(0, 0, 0);
  const decoded = await parse(tile!.data, MVTLoader, {
    core: {worker: false},
    mvt: {shape: 'geojson-table'}
  });
  expect(
    decoded.features.some(
      feature => feature.geometry.type === 'Polygon' && feature.geometry.coordinates.length === 2
    )
  ).toBe(true);
  expect(
    decoded.features.some(
      feature => feature.geometry.type === 'LineString' && feature.properties.id === 1
    )
  ).toBe(true);
});

test('GeoArrow export rejects rich attributes unless explicitly projected and rejects unsafe integers', async () => {
  const base = createTable().data;
  const nested = base.assign(
    new arrow.Table({
      nested: arrow.vectorFromArray(
        [{value: 1}, {value: 2}],
        new arrow.Struct([new arrow.Field('value', new arrow.Int32())])
      )
    })
  );
  await expect(encodeGeoArrowPMTiles(nested, {tiles: SELECTED})).rejects.toThrow(
    'Unsupported vector tile attribute'
  );
  await expect(
    encodeGeoArrowPMTiles(nested, {tiles: SELECTED, mvt: {propertyColumns: ['name']}})
  ).resolves.toBeInstanceOf(ArrayBuffer);
  const unsafe = base.assign(
    new arrow.Table({
      id: arrow.vectorFromArray([9007199254740993n, 2n], new arrow.Int64())
    })
  );
  await expect(
    encodeGeoArrowPMTiles(unsafe, {tiles: [SELECTED[0]], mvt: {idColumn: 'id'}})
  ).rejects.toThrow('safe integer');
});

test('GeoArrow cancellation closes selected-address iterators and counts empty requests against the budget', async () => {
  const controller = new AbortController();
  let closed = false;
  async function* addresses() {
    try {
      yield SELECTED[0];
      controller.abort();
      yield SELECTED[2];
    } finally {
      closed = true;
    }
  }
  await expect(
    encodeGeoArrowPMTiles(createTable(), {tiles: addresses(), pmtiles: {signal: controller.signal}})
  ).rejects.toThrow();
  expect(closed).toBe(true);
  const empty = [
    {z: 2, x: 0, y: 3},
    {z: 2, x: 1, y: 3}
  ];
  await expect(
    encodeGeoArrowPMTiles(createTable(), {
      tiles: empty,
      table: TABLE_OPTIONS,
      pmtiles: {maxTiles: 1}
    })
  ).rejects.toThrow('requested tile limit');
});

test.each([
  {tiles: []},
  {tiles: [SELECTED[0], SELECTED[0]]},
  {tiles: [{z: 1, x: -1, y: 0}]},
  {tiles: [{z: 3, x: 0, y: 0}], table: TABLE_OPTIONS},
  {tiles: SELECTED, maxInputRows: 1},
  {tiles: SELECTED, maxInputRows: 0},
  {tiles: SELECTED, pmtiles: {maxTiles: 0}},
  {tiles: SELECTED, mvt: {propertyColumns: ['missing']}},
  {tiles: SELECTED, mvt: {propertyColumns: ['geometry']}},
  {tiles: SELECTED, mvt: {propertyColumns: ['name', 'name']}},
  {tiles: SELECTED, pmtiles: {maxOutputBytes: 150}},
  {tiles: SELECTED, table: {maxZoom: 2, indexMaxZoom: 3}}
])('GeoArrow export rejects invalid selection or limits %j', async overrides => {
  await expect(encodeGeoArrowPMTiles(createTable(), overrides as any)).rejects.toThrow();
});

test.each([
  'geoarrow.wkb',
  'optimized',
  'geoarrow.geometry'
] as const)('GeoArrow %s authors MLT through the existing tiler and independent PMTiles/MLT readers', async encoding => {
  const archive = openArchive(
    await encodeGeoArrowPMTiles(createTable(encoding), {
      tileType: 'mlt',
      tiles: SELECTED,
      table: TABLE_OPTIONS,
      mlt: {layerName: 'places', idColumn: 'id', propertyColumns: ['name', 'enabled']},
      pmtiles: {bounds: [-180, -80, 180, 80], metadata: {minzoom: 99}}
    })
  );
  expect(await archive.getHeader()).toMatchObject({
    tileType: 6,
    tileCompression: 1,
    numAddressedTiles: 2,
    minLon: -180,
    maxLat: 80
  });
  expect(await archive.getMetadata()).toEqual({
    vector_layers: [{id: 'places', fields: {name: 'String', enabled: 'Boolean'}}]
  });
  expect(await archive.getZxy(1, 0, 1)).toBeUndefined();
  const tile = await archive.getZxy(1, 0, 0);
  const layer = decodeTile(new Uint8Array(tile!.data))[0];
  expect(layer.name).toBe('places');
  expect(layer.getFeatures()[0]).toMatchObject({id: 1, properties: {name: 'west', enabled: true}});
  expect(layer.getFeatures()[0].geometry.coordinates[0][0].x).toBe(2048);
});

test('MLT export shares selection budgets, cancellation and per-tile feature limits', async () => {
  const input = createTable();
  const options = {tileType: 'mlt' as const, tiles: SELECTED, table: TABLE_OPTIONS};
  await expect(encodeGeoArrowPMTiles(input, {...options, pmtiles: {maxTiles: 1}})).rejects.toThrow(
    /requested tile limit/
  );
  await expect(encodeGeoArrowPMTiles(input, {...options, mlt: {maxFeatures: 0}})).rejects.toThrow(
    /feature limit/
  );
  await expect(
    encodeGeoArrowPMTiles(input, {...options, pmtiles: {maxOutputBytes: 1}})
  ).rejects.toThrow();
  const controller = new AbortController();
  let closed = false;
  /** Cancels between selected addresses and records iterator cleanup. */
  async function* selectedTiles() {
    try {
      yield SELECTED[0];
      controller.abort();
      yield SELECTED[2];
    } finally {
      closed = true;
    }
  }
  await expect(
    encodeGeoArrowPMTiles(input, {
      ...options,
      tiles: selectedTiles(),
      pmtiles: {signal: controller.signal}
    })
  ).rejects.toThrow();
  expect(closed).toBe(true);
});
