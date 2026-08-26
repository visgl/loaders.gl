// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';

import {parseWMSCapabilities} from '../../src/lib/parsers/wms/parse-wms-capabilities';

const CAPABILITIES_XML = `<?xml version="1.0"?>
<WMS_Capabilities version="1.3.0">
  <Service>
    <Name>WMS</Name><Title>Example service</Title><Abstract>Maps</Abstract>
    <KeywordList><Keyword>maps</Keyword><Keyword>demo</Keyword></KeywordList>
    <Fees>none</Fees><AccessConstraints>none</AccessConstraints>
    <LayerLimit>4</LayerLimit><maxWidth>1024</maxWidth><maxHeight>512</maxHeight>
  </Service>
  <Capability>
    <Request><GetMap><Format>image/png</Format><Format>image/jpeg</Format></GetMap></Request>
    <Layer queryable="1" opaque="0" cascaded="1">
      <Title>Root</Title><CRS>EPSG:4326</CRS><CRS>CRS:84</CRS>
      <EX_GeographicBoundingBox>
        <westBoundLongitude>-10</westBoundLongitude><southBoundLatitude>-5</southBoundLatitude>
        <eastBoundLongitude>10</eastBoundLongitude><northBoundLatitude>5</northBoundLatitude>
      </EX_GeographicBoundingBox>
      <Dimension name="time" units="ISO8601" unitSymbol="t" default="2020" multipleValues="1" nearestValue="0" current="1">2020/2021</Dimension>
      <Layer><Name>child</Name><Title>Child</Title></Layer>
    </Layer>
    <Exception><Format>XML</Format><Format>INIMAGE</Format></Exception>
  </Capability>
</WMS_Capabilities>`;

test('parseWMSCapabilities extracts service, request, layer, and dimension metadata', () => {
  const capabilities = parseWMSCapabilities(CAPABILITIES_XML, {
    includeRawJSON: true,
    includeXMLText: true
  });
  const layer = capabilities.layers[0];

  expect(capabilities.version).toBe('1.3.0');
  expect(capabilities.name).toBe('WMS');
  expect(capabilities.keywords).toEqual(['maps', 'demo']);
  expect(capabilities.layerLimit).toBe(4);
  expect(capabilities.maxWidth).toBe(1024);
  expect(capabilities.maxHeight).toBe(512);
  expect(capabilities.requests.GetMap.mimeTypes).toEqual(['image/png', 'image/jpeg']);
  expect(capabilities.exceptions?.mimeTypes).toEqual(['XML', 'INIMAGE']);
  expect(capabilities.json).toBeDefined();
  expect(capabilities.xml).toBe(CAPABILITIES_XML);
  expect(layer.crs).toEqual(['EPSG:4326', 'CRS:84']);
  expect(layer.geographicBoundingBox).toEqual([
    [-10, -5],
    [10, 5]
  ]);
  expect(layer.queryable).toBe(true);
  expect(layer.opaque).toBe(false);
  expect(layer.cascaded).toBe(true);
  expect(layer.dimensions?.[0]).toEqual({
    name: 'time',
    units: 'ISO8601',
    unitSymbol: 't',
    defaultValue: '2020',
    multipleValues: true,
    nearestValue: false,
    current: true,
    extent: '2020/2021'
  });
  expect(layer.layers?.[0].name).toBe('child');
});

test('parseWMSCapabilities inherits parent layer properties when requested', () => {
  const capabilities = parseWMSCapabilities(CAPABILITIES_XML, {inheritedLayerProps: true});
  const child = capabilities.layers[0].layers?.[0];

  expect(child?.crs).toEqual(['EPSG:4326', 'CRS:84']);
  expect(child?.geographicBoundingBox).toEqual([
    [-10, -5],
    [10, 5]
  ]);
  expect(child?.dimensions?.[0].extent).toBe('2020/2021');
});

test('parseWMSCapabilities supports WMS 1.1.1 layer bounding boxes', () => {
  const capabilities = parseWMSCapabilities(
    `<WMT_MS_Capabilities version="1.1.1"><Service><Name>x</Name></Service><Capability><Layer><Title>x</Title><LatLonBoundingBox minx="1" miny="2" maxx="3" maxy="4"/><BoundingBox SRS="EPSG:4326" minx="1" miny="2" maxx="3" maxy="4" resx="0.5" resy="0.25"/></Layer></Capability></WMT_MS_Capabilities>`
  );
  const layer = capabilities.layers[0];

  expect(layer.geographicBoundingBox).toEqual([
    ['1', '2'],
    ['3', '4']
  ]);
  expect(layer.boundingBoxes).toEqual([
    {
      crs: 'EPSG:4326',
      boundingBox: [
        [1, 2],
        [3, 4]
      ],
      xResolution: '0.5',
      yResolution: '0.25'
    }
  ]);
});
