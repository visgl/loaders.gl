// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {beforeAll, expect, test, vi} from 'vitest';
import {WMTSImageTileSource, WMTSCapabilitiesLoader} from '@loaders.gl/wms';
import type {WMTSCapabilities} from '@loaders.gl/wms';

const CAPABILITIES_XML = `<wmts:Capabilities xmlns:wmts="http://www.opengis.net/wmts/1.0" xmlns:ows="http://www.opengis.net/ows/1.1"><wmts:Contents>
  <wmts:Layer><ows:Identifier>imagery</ows:Identifier><wmts:Format>image/png</wmts:Format>
    <wmts:Dimension><ows:Identifier>Time</ows:Identifier><ows:Title xml:lang="en">Acquisition</ows:Title><ows:Abstract>Monthly images</ows:Abstract><ows:UOM reference="urn:units:iso8601">ISO8601</ows:UOM><wmts:UnitSymbol>t</wmts:UnitSymbol><wmts:Default>2026-09-01T00:00:00Z</wmts:Default><wmts:Current>true</wmts:Current><wmts:Value>2026-01-01/2026-12-31/P1M</wmts:Value><wmts:Value>current</wmts:Value></wmts:Dimension>
    <wmts:Dimension><ows:Identifier>Elevation</ows:Identifier><wmts:Default>0</wmts:Default><wmts:Current>false</wmts:Current><wmts:Value>0</wmts:Value></wmts:Dimension>
    <wmts:Dimension><ows:Identifier>Band</ows:Identifier><wmts:Default>007</wmts:Default><wmts:Value>007</wmts:Value><wmts:Value>010</wmts:Value></wmts:Dimension>
    <wmts:TileMatrixSetLink><wmts:TileMatrixSet>regional</wmts:TileMatrixSet><wmts:TileMatrixSetLimits>
      <wmts:TileMatrixLimits><wmts:TileMatrix>detail</wmts:TileMatrix><wmts:MinTileRow>1</wmts:MinTileRow><wmts:MaxTileRow>2</wmts:MaxTileRow><wmts:MinTileCol>2</wmts:MinTileCol><wmts:MaxTileCol>3</wmts:MaxTileCol></wmts:TileMatrixLimits>
    </wmts:TileMatrixSetLimits></wmts:TileMatrixSetLink>
  </wmts:Layer>
  <wmts:TileMatrixSet><ows:Identifier>regional</ows:Identifier><ows:SupportedCRS>EPSG:3857</ows:SupportedCRS>
    <wmts:TileMatrix><ows:Identifier>overview</ows:Identifier><wmts:MatrixWidth>1</wmts:MatrixWidth><wmts:MatrixHeight>1</wmts:MatrixHeight></wmts:TileMatrix>
    <wmts:TileMatrix><ows:Identifier>detail</ows:Identifier><wmts:MatrixWidth>8</wmts:MatrixWidth><wmts:MatrixHeight>4</wmts:MatrixHeight></wmts:TileMatrix>
  </wmts:TileMatrixSet>
</wmts:Contents></wmts:Capabilities>`;

let capabilities: WMTSCapabilities;
let parseCapabilities: (text: string) => WMTSCapabilities;

beforeAll(async () => {
  const parser = await WMTSCapabilitiesLoader.preload();
  parseCapabilities = text => parser.parseTextSync(text);
  capabilities = parseCapabilities(CAPABILITIES_XML);
});

/** Creates a source with isolated capabilities for mutation boundary cases. */
function createSource() {
  const suppliedCapabilities = structuredClone(capabilities);
  return {
    suppliedCapabilities,
    source: new WMTSImageTileSource('https://example.com/wmts?token=demo', {
      wmts: {capabilities: suppliedCapabilities}
    })
  };
}

test('WMTS parser preserves dimension metadata and inclusive matrix limits', () => {
  const layer = capabilities.contents.layers[0];
  expect(layer.dimensions).toEqual([
    {
      identifier: 'Time',
      title: 'Acquisition',
      abstract: 'Monthly images',
      unitsOfMeasure: 'ISO8601',
      unitSymbol: 't',
      default: '2026-09-01T00:00:00Z',
      current: true,
      values: ['2026-01-01/2026-12-31/P1M', 'current']
    },
    {
      identifier: 'Elevation',
      title: undefined,
      abstract: undefined,
      unitsOfMeasure: undefined,
      unitSymbol: undefined,
      default: '0',
      current: false,
      values: ['0']
    },
    {
      identifier: 'Band',
      title: undefined,
      abstract: undefined,
      unitsOfMeasure: undefined,
      unitSymbol: undefined,
      default: '007',
      current: undefined,
      values: ['007', '010']
    }
  ]);
  expect(layer.tileMatrixSetLinks[0].limits).toEqual([
    {
      tileMatrix: 'detail',
      minimumTileRow: 1,
      maximumTileRow: 2,
      minimumTileColumn: 2,
      maximumTileColumn: 3
    }
  ]);
  const absent = parseCapabilities(
    CAPABILITIES_XML.replace(/<wmts:TileMatrixSetLimits>[\s\S]*?<\/wmts:TileMatrixSetLimits>/, '')
  );
  expect(absent.contents.layers[0].tileMatrixSetLinks[0].limits).toBeUndefined();
  const empty = parseCapabilities(
    CAPABILITIES_XML.replace(/<wmts:TileMatrixLimits>[\s\S]*?<\/wmts:TileMatrixLimits>/, '')
  );
  expect(empty.contents.layers[0].tileMatrixSetLinks[0].limits).toEqual([]);
});

test.each([
  '-1',
  '1.5',
  '9007199254740992',
  '',
  'invalid'
])('WMTS parser rejects invalid limit indices (%s)', value => {
  expect(() =>
    parseCapabilities(
      CAPABILITIES_XML.replace(
        '<wmts:MinTileRow>1</wmts:MinTileRow>',
        `<wmts:MinTileRow>${value}</wmts:MinTileRow>`
      )
    )
  ).toThrow('safe integers');
});

test.each(['MinTileRow', 'MinTileCol'])('WMTS parser rejects reversed %s limits', field => {
  expect(() =>
    parseCapabilities(
      CAPABILITIES_XML.replace(new RegExp(`<wmts:${field}>[^<]+`), `<wmts:${field}>9`)
    )
  ).toThrow('reversed');
});

test('WMTS parser rejects duplicate or missing limit identifiers', () => {
  const limit = CAPABILITIES_XML.match(
    /<wmts:TileMatrixLimits>[\s\S]*?<\/wmts:TileMatrixLimits>/
  )![0];
  expect(() => parseCapabilities(CAPABILITIES_XML.replace(limit, limit + limit))).toThrow('unique');
  expect(() =>
    parseCapabilities(
      CAPABILITIES_XML.replace('<wmts:TileMatrix>detail</wmts:TileMatrix>', '<wmts:TileMatrix/>')
    )
  ).toThrow('unique');
});

test('WMTS layer limits admit inclusive boundaries and omit unavailable matrices without a fetch', async () => {
  const {source} = createSource();
  source.fetch = vi.fn();
  for (const [x, y] of [
    [2, 1],
    [3, 2]
  ]) {
    expect(source.isTileAvailable({x, y, z: 1})).toBe(true);
    expect(new URL(source.getTileURL({x, y, z: 1})).searchParams.get('TILEMATRIX')).toBe('detail');
  }
  for (const [x, y, z] of [
    [1, 1, 1],
    [4, 1, 1],
    [2, 0, 1],
    [2, 3, 1],
    [0, 0, 0],
    [0, 0, 2]
  ]) {
    expect(source.isTileAvailable({x, y, z})).toBe(false);
    expect(() => source.getTileURL({x, y, z})).toThrow('outside advertised');
    expect(await source.getTile({x, y, z})).toBeNull();
  }
  expect(
    await source.getTileData({
      index: {x: 0, y: 0, z: 0},
      id: '0/0/0',
      bbox: {west: 0, south: 0, east: 1, north: 1}
    })
  ).toBeNull();
  expect(source.fetch).not.toHaveBeenCalled();
});

test('WMTS absent limits use full per-matrix sizes; empty limits advertise no tiles', () => {
  const {source, suppliedCapabilities} = createSource();
  const link = suppliedCapabilities.contents.layers[0].tileMatrixSetLinks[0];
  delete link.limits;
  expect(source.isTileAvailable({x: 0, y: 0, z: 0})).toBe(true);
  expect(source.isTileAvailable({x: 7, y: 3, z: 1})).toBe(true);
  expect(source.isTileAvailable({x: 8, y: 3, z: 1})).toBe(false);
  expect(source.isTileAvailable({x: 7, y: 4, z: 1})).toBe(false);
  link.limits = [];
  expect(source.isTileAvailable({x: 2, y: 1, z: 1})).toBe(false);
});

test('WMTS validates supplied bounds and matrix sizes before fetching', async () => {
  const {source, suppliedCapabilities} = createSource();
  source.fetch = vi.fn();
  const limit = suppliedCapabilities.contents.layers[0].tileMatrixSetLinks[0].limits![0];
  limit.maximumTileColumn = 8;
  await expect(source.getTile({x: 2, y: 1, z: 1})).rejects.toThrow('exceed');
  limit.maximumTileColumn = 3;
  limit.minimumTileRow = -1;
  expect(() => source.isTileAvailable({x: 2, y: 1, z: 1})).toThrow('safe integers');
  limit.minimumTileRow = 1;
  suppliedCapabilities.contents.tileMatrixSets[0].matrices[1].matrixWidth = 0;
  await expect(source.getTile({x: 2, y: 1, z: 1})).rejects.toThrow('positive');
  expect(source.fetch).not.toHaveBeenCalled();
});

test.each([
  'x',
  'y',
  'z'
])('WMTS rejects invalid %s indices without rounding, wrapping or fetching', async name => {
  const source = new WMTSImageTileSource('https://example.com/wmts');
  source.fetch = vi.fn();
  for (const value of [-1, 0.5, Infinity, NaN, Number.MAX_SAFE_INTEGER + 1]) {
    const parameters = {x: 0, y: 0, z: 0, [name]: value};
    expect(() => source.getTileURL(parameters)).toThrow(name);
    await expect(source.getTile(parameters)).rejects.toThrow(name);
  }
  expect(source.fetch).not.toHaveBeenCalled();
});

test.each([
  false,
  true
])('WMTS applies dimension defaults and option/endpoint overrides (REST: %s)', useRestTemplate => {
  const {source, suppliedCapabilities} = createSource();
  const options = source.options.wmts!;
  if (useRestTemplate)
    options.urlTemplate =
      'https://example.com/{Time}/{Elevation}/{Band}/{TileMatrix}/{TileRow}/{TileCol}';
  let url = source.getTileURL({x: 2, y: 1, z: 1});
  if (useRestTemplate) expect(url).toContain('/2026-09-01T00%3A00%3A00Z/0/007/detail/1/2');
  else {
    const query = new URL(url).searchParams;
    expect(query.get('Time')).toBe('2026-09-01T00:00:00Z');
    expect(query.get('Elevation')).toBe('0');
    expect(query.get('Band')).toBe('007');
    expect(query.get('token')).toBe('demo');
  }
  options.parameters = {time: 'current', elevation: '500', TILECOL: '99', tilematrix: 'overview'};
  url = source.getTileURL({x: 2, y: 1, z: 1});
  if (useRestTemplate) expect(url).toContain('/current/500/007/detail/1/2');
  else {
    const query = new URL(url).searchParams;
    expect(query.get('Time')).toBe('current');
    expect([...query.keys()].filter(key => key.toUpperCase() === 'TIME')).toEqual(['Time']);
    expect(query.get('TILECOL')).toBe('2');
    expect(query.get('TILEMATRIX')).toBe('detail');
  }
  const endpoint = new WMTSImageTileSource('https://example.com/wmts?tImE=2020-01-01', {
    wmts: {capabilities: suppliedCapabilities, urlTemplate: options.urlTemplate}
  });
  url = endpoint.getTileURL({x: 2, y: 1, z: 1});
  if (useRestTemplate) expect(url).toContain('/2020-01-01/');
  else expect(new URL(url).searchParams.get('Time')).toBe('2020-01-01');
});

test("WMTS request-layer overrides select that layer's limits and dimensions", () => {
  const {source, suppliedCapabilities} = createSource();
  suppliedCapabilities.contents.layers.push({
    ...structuredClone(suppliedCapabilities.contents.layers[0]),
    identifier: 'alternate',
    dimensions: [{identifier: 'Time', default: 'alternate-date', values: []}],
    tileMatrixSetLinks: [
      {
        tileMatrixSet: 'regional',
        limits: [
          {
            tileMatrix: 'overview',
            minimumTileRow: 0,
            maximumTileRow: 0,
            minimumTileColumn: 0,
            maximumTileColumn: 0
          }
        ]
      }
    ]
  });
  source.options.wmts!.layer = 'imagery';
  expect(source.isTileAvailable({x: 0, y: 0, z: 0})).toBe(false);
  const query = new URL(source.getTileURL({x: 0, y: 0, z: 0, layers: 'alternate'})).searchParams;
  expect(query.get('Time')).toBe('alternate-date');
  expect(query.get('Elevation')).toBeNull();
  expect(source.isTileAvailable({x: 2, y: 1, z: 1, layers: 'alternate'})).toBe(false);
});

test('WMTS missing dimension defaults require explicit values and never guess a range member', () => {
  const {source, suppliedCapabilities} = createSource();
  const dimension = suppliedCapabilities.contents.layers[0].dimensions![0];
  delete dimension.default;
  expect(() => source.getTileURL({x: 2, y: 1, z: 1})).toThrow('Time');
  source.options.wmts!.parameters = {Time: '2026-01-01'};
  expect(new URL(source.getTileURL({x: 2, y: 1, z: 1})).searchParams.get('Time')).toBe(
    '2026-01-01'
  );
  source.options.wmts!.parameters.Time = '';
  expect(() => source.getTileURL({x: 2, y: 1, z: 1})).toThrow('Time');
});

test('WMTS asynchronously loaded capabilities enforce coverage before any tile request', async () => {
  const source = new WMTSImageTileSource('https://example.com/wmts', {
    wmts: {capabilitiesUrl: 'https://example.com/capabilities'}
  });
  source.fetch = vi.fn(async () => new Response(CAPABILITIES_XML));
  expect(await source.getTile({x: 0, y: 0, z: 0})).toBeNull();
  expect(await source.getTile({x: 4, y: 1, z: 1})).toBeNull();
  expect(source.fetch).toHaveBeenCalledTimes(1);
  expect(source.isTileAvailable({x: 2, y: 1, z: 1})).toBe(true);
});
