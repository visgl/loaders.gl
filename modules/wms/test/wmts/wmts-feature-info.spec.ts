// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {beforeAll, expect, test, vi} from 'vitest';
import {createDataSource} from '@loaders.gl/core';
import {WMTSImageTileSource, WMTSSourceLoader, WMTSCapabilitiesLoader} from '@loaders.gl/wms';
import type {WMTSCapabilities, WMTSGetFeatureInfoParameters} from '@loaders.gl/wms';

const CAPABILITIES_XML = `<Capabilities xmlns="http://www.opengis.net/wmts/1.0" xmlns:ows="http://www.opengis.net/ows/1.1" xmlns:xlink="http://www.w3.org/1999/xlink">
<ows:OperationsMetadata><ows:Operation name="GetFeatureInfo"><ows:DCP><ows:HTTP>
<ows:Get xlink:href="https://example.com/rest"><ows:Constraint name="GetEncoding"><ows:AllowedValues><ows:Value>RESTful</ows:Value></ows:AllowedValues></ows:Constraint></ows:Get>
<ows:Get xlink:href="https://example.com/query?token=info"><ows:Constraint name="GetEncoding"><ows:AllowedValues><ows:Value>KVP</ows:Value></ows:AllowedValues></ows:Constraint></ows:Get>
</ows:HTTP></ows:DCP></ows:Operation></ows:OperationsMetadata>
<Contents><Layer><ows:Identifier>imagery</ows:Identifier><Format>image/png</Format><InfoFormat>application/geo+json</InfoFormat><InfoFormat>text/plain</InfoFormat><InfoFormat>text/xml</InfoFormat><InfoFormat>text/html</InfoFormat>
<Style isDefault="true"><ows:Identifier>natural</ows:Identifier></Style>
<Dimension><ows:Identifier>Time</ows:Identifier><Default>2026-09-01</Default></Dimension>
<TileMatrixSetLink><TileMatrixSet>regional</TileMatrixSet><TileMatrixSetLimits><TileMatrixLimits><TileMatrix>detail</TileMatrix><MinTileRow>1</MinTileRow><MaxTileRow>2</MaxTileRow><MinTileCol>2</MinTileCol><MaxTileCol>3</MaxTileCol></TileMatrixLimits></TileMatrixSetLimits></TileMatrixSetLink>
<ResourceURL resourceType="tile" format="image/png" template="https://example.com/tiles/{TileMatrix}/{TileRow}/{TileCol}.png"/>
</Layer><TileMatrixSet><ows:Identifier>regional</ows:Identifier><TileMatrix><ows:Identifier>overview</ows:Identifier><TileWidth>256</TileWidth><TileHeight>256</TileHeight><MatrixWidth>1</MatrixWidth><MatrixHeight>1</MatrixHeight></TileMatrix><TileMatrix><ows:Identifier>detail</ows:Identifier><TileWidth>32</TileWidth><TileHeight>16</TileHeight><MatrixWidth>8</MatrixWidth><MatrixHeight>4</MatrixHeight></TileMatrix></TileMatrixSet></Contents></Capabilities>`;

const PARAMETERS: WMTSGetFeatureInfoParameters = {x: 2, y: 1, z: 1, pixelColumn: 31, pixelRow: 15};
let capabilities: WMTSCapabilities;
let parseCapabilities: (text: string) => WMTSCapabilities;

beforeAll(async () => {
  const loader = await WMTSCapabilitiesLoader.preload();
  parseCapabilities = text => loader.parseTextSync(text);
  capabilities = parseCapabilities(CAPABILITIES_XML);
});

/** Creates isolated supplied capabilities for request and metadata boundary checks. */
function createSource() {
  const suppliedCapabilities = structuredClone(capabilities);
  const source = new WMTSImageTileSource('https://example.com/wmts?Time=2026-08-01', {
    wmts: {capabilities: suppliedCapabilities}
  });
  return {source, suppliedCapabilities};
}

test('WMTS capabilities expose info formats and select the advertised KVP GET binding', () => {
  expect(capabilities.contents.layers[0].infoFormats).toEqual([
    'application/geo+json',
    'text/plain',
    'text/xml',
    'text/html'
  ]);
  expect(capabilities.featureInfoUrl).toBe('https://example.com/query?token=info');
  const unconstrained = parseCapabilities(
    CAPABILITIES_XML.replace(/<ows:Constraint[\s\S]*?<\/ows:Constraint>/g, '')
  );
  expect(unconstrained.featureInfoUrl).toBe('https://example.com/rest');
  const restOnly = parseCapabilities(
    CAPABILITIES_XML.replace('<ows:Value>KVP</ows:Value>', '<ows:Value>RESTful</ows:Value>')
  );
  expect(restOnly.featureInfoUrl).toBeNull();
  const source = new WMTSImageTileSource('https://example.com/wmts', {
    wmts: {capabilities: restOnly}
  });
  expect(() => source.getFeatureInfoURL(PARAMETERS)).toThrow('no KVP');
  expect(
    parseCapabilities('<Capabilities><Contents/></Capabilities>').featureInfoUrl
  ).toBeUndefined();
});

test('WMTS KVP feature-info keeps rendered tile identity and authoritative pixel/format fields', () => {
  const {source} = createSource();
  source.options.wmts!.parameters = {
    time: 'current',
    i: '99',
    j: '99',
    infoformat: 'wrong',
    request: 'GetTile',
    format: 'wrong'
  };
  const url = new URL(source.getFeatureInfoURL(PARAMETERS));
  expect(url.pathname).toBe('/query');
  expect(Object.fromEntries(url.searchParams)).toEqual({
    token: 'info',
    Time: 'current',
    SERVICE: 'WMTS',
    REQUEST: 'GetFeatureInfo',
    VERSION: '1.0.0',
    LAYER: 'imagery',
    STYLE: 'natural',
    TILEMATRIXSET: 'regional',
    TILEMATRIX: 'detail',
    TILEROW: '1',
    TILECOL: '2',
    FORMAT: 'image/png',
    INFOFORMAT: 'application/geo+json',
    I: '31',
    J: '15'
  });
  source.options.wmts!.featureInfoUrl = '/manual?token=manual';
  expect(new URL(source.getFeatureInfoURL(PARAMETERS)).pathname).toBe('/manual');
});

test('WMTS REST feature-info selects only matching query resources and encodes generated parameters', () => {
  const {source, suppliedCapabilities} = createSource();
  const layer = suppliedCapabilities.contents.layers[0];
  layer.resourceURLs.push(
    {
      resourceType: 'FeatureInfo',
      format: 'text/plain',
      template: 'https://example.com/text/{I}/{J}'
    },
    {
      resourceType: 'FeatureInfo',
      format: 'application/geo+json',
      template:
        'https://example.com/{Layer}/{Style}/{Time}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}/{I}/{J}?format={InfoFormat}'
    }
  );
  expect(source.getFeatureInfoURL(PARAMETERS)).toBe(
    'https://example.com/imagery/natural/2026-08-01/regional/detail/1/2/31/15?format=application%2Fgeo%2Bjson'
  );
  expect(source.getTileURL(PARAMETERS)).toBe('https://example.com/tiles/detail/1/2.png');
  source.options.wmts!.featureInfoUrlTemplate = '/override/{time}/{i}/{j}';
  source.options.wmts!.parameters = {Time: 'date/value', I: '100', J: '100'};
  expect(source.getFeatureInfoURL(PARAMETERS)).toBe(
    'https://example.com/override/date%2Fvalue/31/15'
  );
  source.options.wmts!.featureInfoUrlTemplate = '/{missing}';
  expect(() => source.getFeatureInfoURL(PARAMETERS)).toThrow('Missing WMTS template parameter');
});

test('WMTS feature-info honors per-request layers, formats and their dimensions', () => {
  const {source, suppliedCapabilities} = createSource();
  source.options.wmts!.infoFormat = 'text/plain';
  expect(new URL(source.getFeatureInfoURL(PARAMETERS)).searchParams.get('INFOFORMAT')).toBe(
    'text/plain'
  );
  expect(
    new URL(source.getFeatureInfoURL({...PARAMETERS, infoFormat: 'text/xml'})).searchParams.get(
      'INFOFORMAT'
    )
  ).toBe('text/xml');
  expect(() =>
    source.getFeatureInfoURL({...PARAMETERS, infoFormat: 'application/unknown'})
  ).toThrow('Unsupported');
  const alternate = structuredClone(suppliedCapabilities.contents.layers[0]);
  alternate.identifier = 'alternate';
  alternate.infoFormats = ['text/plain'];
  alternate.dimensions = [{identifier: 'Band', default: '007', values: []}];
  alternate.resourceURLs = [
    {resourceType: 'FeatureInfo', format: 'text/plain', template: '/alternate/{Band}/{I}/{J}'}
  ];
  suppliedCapabilities.contents.layers.push(alternate);
  expect(source.getFeatureInfoURL({...PARAMETERS, layers: 'alternate'})).toBe(
    'https://example.com/alternate/007/31/15'
  );
  expect(() => source.getFeatureInfoURL({...PARAMETERS, layers: 'missing'})).toThrow(
    'Unknown WMTS layer'
  );
});

test.each([
  'pixelColumn',
  'pixelRow'
])('WMTS rejects invalid %s before capabilities or query fetch', async field => {
  const source = new WMTSImageTileSource('https://example.com/wmts', {
    wmts: {capabilitiesUrl: 'https://example.com/capabilities'}
  });
  source.fetch = vi.fn();
  for (const value of [-1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    const parameters = {...PARAMETERS, [field]: value};
    expect(() => source.getFeatureInfoURL(parameters)).toThrow('safe integers');
    await expect(source.getFeatureInfo(parameters)).rejects.toThrow('safe integers');
  }
  expect(source.fetch).not.toHaveBeenCalled();
});

test('WMTS pixel bounds use each selected matrix, while unavailable tiles skip feature-info fetches', async () => {
  const {source, suppliedCapabilities} = createSource();
  source.fetch = vi.fn();
  expect(source.getFeatureInfoURL({...PARAMETERS, pixelColumn: 0, pixelRow: 0})).toContain(
    'I=0&J=0'
  );
  for (const parameters of [
    {...PARAMETERS, pixelColumn: 32},
    {...PARAMETERS, pixelRow: 16}
  ])
    await expect(source.getFeatureInfo(parameters)).rejects.toThrow('outside tile dimensions');
  for (const parameters of [
    {...PARAMETERS, x: 4},
    {...PARAMETERS, z: 0}
  ]) {
    expect(() => source.getFeatureInfoURL(parameters)).toThrow('outside advertised coverage');
    expect(await source.getFeatureInfo(parameters)).toBeNull();
    expect(await source.getFeatureInfoText(parameters)).toBeNull();
  }
  suppliedCapabilities.contents.tileMatrixSets[0].matrices[1].tileWidth = 0;
  expect(() => source.getFeatureInfoURL(PARAMETERS)).toThrow('positive safe integers');
  expect(source.fetch).not.toHaveBeenCalled();
});

test('WMTS explicit configuration supports legacy metadata without guessing info format or tile dimensions', () => {
  const source = new WMTSImageTileSource('https://example.com/wmts');
  expect(() => source.getFeatureInfoURL(PARAMETERS)).toThrow('Missing WMTS feature-info format');
  source.options.wmts!.infoFormat = 'application/json';
  expect(source.getFeatureInfoURL(PARAMETERS)).toContain('INFOFORMAT=application%2Fjson');
  const {source: resourceSource, suppliedCapabilities} = createSource();
  delete suppliedCapabilities.contents.layers[0].infoFormats;
  suppliedCapabilities.contents.layers[0].resourceURLs.push({
    resourceType: 'FeatureInfo',
    format: 'text/plain',
    template: '/info/{I}/{J}'
  });
  expect(resourceSource.getFeatureInfoURL(PARAMETERS)).toBe('https://example.com/info/31/15');
});

test('WMTS public source loader discovers capabilities once and returns native JSON with cancellation', async () => {
  const source = createDataSource('https://example.com/wmts', [WMTSSourceLoader], {
    wmts: {capabilitiesUrl: 'https://example.com/capabilities'}
  });
  const controller = new AbortController();
  source.fetch = vi.fn(async (url, options) => {
    if (url.endsWith('/capabilities')) return new Response(CAPABILITIES_XML);
    expect(options?.signal).toBe(controller.signal);
    expect(new URL(url).searchParams.get('Time')).toBe('2026-09-01');
    return new Response('{"type":"FeatureCollection","features":[]}');
  });
  expect(await source.getFeatureInfo({...PARAMETERS, signal: controller.signal})).toEqual({
    type: 'FeatureCollection',
    features: []
  });
  expect(await source.getFeatureInfo(PARAMETERS, controller.signal)).toEqual({
    type: 'FeatureCollection',
    features: []
  });
  expect(source.fetch).toHaveBeenCalledTimes(3);
});

test.each([
  'text/plain',
  'text/xml',
  'text/html'
])('WMTS %s feature-info remains native text', async infoFormat => {
  const {source} = createSource();
  const content = infoFormat === 'text/plain' ? 'elevation=503' : '<result>503</result>';
  source.fetch = vi.fn(async () => new Response(content));
  expect(await source.getFeatureInfo({...PARAMETERS, infoFormat})).toBe(content);
  expect(await source.getFeatureInfoText({...PARAMETERS, infoFormat})).toBe(content);
});

test('WMTS preserves raw malformed JSON but rejects it in the parsed feature-info API', async () => {
  const {source} = createSource();
  source.fetch = vi.fn(async () => new Response('invalid json'));
  expect(await source.getFeatureInfoText(PARAMETERS)).toBe('invalid json');
  await expect(source.getFeatureInfo(PARAMETERS)).rejects.toThrow();
  source.fetch = vi.fn(
    async () => new Response('failed', {status: 503, statusText: 'Unavailable'})
  );
  await expect(source.getFeatureInfo(PARAMETERS)).rejects.toThrow('503 Unavailable');
});

test.each([200, 400])('WMTS rejects OWS exception reports at HTTP %s', async status => {
  const {source} = createSource();
  source.fetch = vi.fn(
    async () =>
      new Response(
        '<?xml version="1.0"?><ows:ExceptionReport xmlns:ows="http://www.opengis.net/ows/1.1"><ows:Exception exceptionCode="InvalidParameterValue"><ows:ExceptionText xml:lang="en">Invalid pixel</ows:ExceptionText><ows:ExceptionText>Try another tile</ows:ExceptionText></ows:Exception><ows:Exception exceptionCode="OperationNotSupported"/></ows:ExceptionReport>',
        {status}
      )
  );
  await expect(source.getFeatureInfoText(PARAMETERS)).rejects.toThrow(
    'Invalid pixel; Try another tile; OperationNotSupported'
  );
  source.fetch = vi.fn(async () => new Response('<ExceptionReport/>'));
  await expect(source.getFeatureInfoText(PARAMETERS)).rejects.toThrow('server error');
});

test('WMTS decodes the requested format even if source options change during the fetch', async () => {
  const {source} = createSource();
  source.fetch = vi.fn(async () => {
    source.options.wmts!.infoFormat = 'text/plain';
    return new Response('{"elevation":503}');
  });
  expect(await source.getFeatureInfo(PARAMETERS)).toEqual({elevation: 503});
});

test('WMTS operation-wide encoding constraints and AnyValue apply to GET endpoint discovery', () => {
  const withoutEndpointConstraints = CAPABILITIES_XML.replace(
    /<ows:Constraint[\s\S]*?<\/ows:Constraint>/g,
    ''
  );
  const constrained = withoutEndpointConstraints.replace(
    '<ows:Operation name="GetFeatureInfo">',
    '<ows:Operation name="GetFeatureInfo"><ows:Constraint name="GetEncoding"><ows:AllowedValues><ows:Value>SOAP</ows:Value></ows:AllowedValues></ows:Constraint>'
  );
  expect(parseCapabilities(constrained).featureInfoUrl).toBeNull();
  expect(
    parseCapabilities(
      constrained.replace(
        '<ows:AllowedValues><ows:Value>SOAP</ows:Value></ows:AllowedValues>',
        '<ows:AnyValue/>'
      )
    ).featureInfoUrl
  ).toBe('https://example.com/rest');
});

test('WMTS exception text preserves lexical zero and multiple reported messages', async () => {
  const {source} = createSource();
  source.fetch = vi.fn(
    async () =>
      new Response(
        '<ExceptionReport><Exception exceptionCode="ServerError"><ExceptionText>0</ExceptionText></Exception></ExceptionReport>'
      )
  );
  await expect(source.getFeatureInfo(PARAMETERS)).rejects.toThrow('WMTS feature-info: 0');
});

test('WMTS native HTML need not be well-formed XML', async () => {
  const {source} = createSource();
  const content = '<!DOCTYPE html><html><body><p>503<br><img src=marker.png></body></html>';
  source.fetch = vi.fn(async () => new Response(content));
  expect(await source.getFeatureInfo({...PARAMETERS, infoFormat: 'text/html'})).toBe(content);
});

test.each([
  'application/json',
  'Application/Vnd.example+Json; charset=UTF-8'
])('WMTS decodes a native JSON value for %s', async infoFormat => {
  const source = new WMTSImageTileSource('https://example.com/wmts', {wmts: {infoFormat}});
  source.fetch = vi.fn(async () => new Response('0'));
  expect(await source.getFeatureInfo(PARAMETERS)).toBe(0);
});

test.each([
  '<?query?>',
  '<!--comment-->'
])('WMTS scans repeated %s prolog tokens without backtracking or changing native text', async token => {
  const {source} = createSource();
  const prolog = token.repeat(2048);
  const nativeText = prolog + '<result>native text</result>';
  source.fetch = vi.fn(async () => new Response(nativeText));
  expect(await source.getFeatureInfoText(PARAMETERS)).toBe(nativeText);
  source.fetch = vi.fn(async () => new Response(prolog + '<ExceptionReport/>'));
  await expect(source.getFeatureInfoText(PARAMETERS)).rejects.toThrow('server error');
});

test('WMTS recognizes exceptions after whitespace, BOM, declarations, instructions and comments', async () => {
  const {source} = createSource();
  const prolog = '\uFEFF<?xml version="1.0"?>\n<!--before--><?query?>\t';
  source.fetch = vi.fn(
    async () =>
      new Response(prolog + '<ows:ExceptionReport xmlns:ows="http://www.opengis.net/ows/1.1"/>')
  );
  await expect(source.getFeatureInfoText(PARAMETERS)).rejects.toThrow('server error');
});

test.each([
  '<?unterminated',
  '<!--unterminated',
  '<!--<ExceptionReport/>--><result/>',
  '<ExceptionReportSuffix/>',
  '<result><ExceptionReport/></result>',
  ' \t<?query?> <!--comment--> '
])('WMTS preserves non-exception text %s', async content => {
  const {source} = createSource();
  source.fetch = vi.fn(async () => new Response(content));
  expect(await source.getFeatureInfoText(PARAMETERS)).toBe(content);
});
