// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {GML_V3_TESTS} from '@loaders.gl/wms/test/data/gml/v3/tests';
// import {validateLoader} from 'test/common/conformance';
import {_GMLLoader as GMLLoader} from '@loaders.gl/wms';
import {GMLLoader as GMLParserLoader} from '@loaders.gl/wms/bundled';
import type {GeoJSON} from '@loaders.gl/schema';
import {parse} from '@loaders.gl/core';
const VALID_TEST = {
  'v3/envelope.xml': true,
  'v3/linearring.xml': true,
  'v3/linestring.xml': true,
  'v3/curve.xml': true,
  'v3/multilinestring-plural.xml': true,
  'v3/multilinestring-singular.xml': true,
  'v3/multicurve-singular.xml': true,
  'v3/multicurve-curve.xml': true,
  'v3/multipoint-plural.xml': true,
  'v3/multipoint-singular.xml': true,
  'v3/multipolygon-plural.xml': true,
  'v3/multipolygon-singular.xml': true,
  'v3/multisurface-plural.xml': true,
  'v3/multisurface-singular.xml': true,
  'v3/multisurface-surface.xml': false,
  'v3/point.xml': true,
  'v3/polygon.xml': false,
  'v3/surface.xml': false,
  'v3/topp-states-gml.xml': true,
  'v3/topp-states-wfs.xml': true,
  'v2/point-coord.xml': true,
  'v2/point-coordinates.xml': true,
  'v2/linestring-coord.xml': true,
  'v2/linestring-coordinates.xml': true,
  'v2/multipoint-coord.xml': true,
  'v2/multipoint-coordinates.xml': true,
  'v2/multilinestring-coord.xml': true,
  'v2/multilinestring-coordinates.xml': true,
  'v3/repeated-name.xml': true
};
test('GMLLoader#parse', async () => {
  for (const [fileName, xmlText] of Object.entries(GML_V3_TESTS)) {
    if (VALID_TEST[fileName]) {
      const geojson = (await parse(xmlText, GMLLoader)) as GeoJSON;
      expect(typeof geojson, `Parsed ${fileName}`).toBe('object');
    }
  }
});
test('GMLLoader parses feature collections', () => {
  const xml = `<?xml version="1.0"?><gml:FeatureCollection xmlns:gml="http://www.opengis.net/gml" xmlns:app="urn:app"><gml:featureMember><app:place gml:id="place.1"><app:name>One</app:name><app:shape><gml:Point><gml:pos>1 2</gml:pos></gml:Point></app:shape></app:place></gml:featureMember><gml:featureMember><app:place gml:id="place.2"><app:name>Two</app:name><app:shape><gml:Point><gml:pos>3 4</gml:pos></gml:Point></app:shape></app:place></gml:featureMember></gml:FeatureCollection>`;
  const collection = GMLParserLoader.parseTextSync!(xml) as any;
  expect(collection.type).toBe('FeatureCollection');
  expect(collection.features).toHaveLength(2);
  expect(collection.features[0].id).toBe('place.1');
  expect(collection.features[0].properties.name).toBe('One');
  expect(collection.features[0].properties.shape).toBeUndefined();
  expect(collection.features[1].geometry.coordinates).toEqual([3, 4]);
});
test('GMLLoader parses feature members incrementally', async () => {
  const chunks = [
    new TextEncoder().encode(
      '<gml:featureMember xmlns:gml="http://www.opengis.net/gml"><app:place xmlns:app="urn:app"><app:shape><gml:Point><gml:pos>1 2</gml:pos></gml:Point></app:shape></app:place></gml:featureMember>'
    ),
    new TextEncoder().encode(
      '<gml:featureMember xmlns:gml="http://www.opengis.net/gml"><app:place xmlns:app="urn:app"><app:shape><gml:Point><gml:pos>3 4</gml:pos></gml:Point></app:shape></app:place></gml:featureMember>'
    )
  ];
  const batches = [];
  for await (const batch of GMLParserLoader.parseInBatches!(chunks)) batches.push(batch);
  expect(batches.flatMap(batch => batch.features)).toHaveLength(2);
});
test('GMLLoader batches plural featureMembers without retaining the container', async () => {
  const chunks = [
    new TextEncoder().encode(
      '<gml:FeatureCollection><gml:featureMembers><app:place xmlns:app="urn:app"><app:name>One</app:name><app:shape><gml:Point><gml:pos>1 2</gml:pos></gml:Point></app:shape></app:place>'
    ),
    new TextEncoder().encode(
      '<app:place xmlns:app="urn:app"><app:name>Two</app:name><app:shape><gml:Point><gml:pos>3 4</gml:pos></gml:Point></app:shape></app:place></gml:featureMembers></gml:FeatureCollection>'
    )
  ];
  const batches = [];
  for await (const batch of GMLParserLoader.parseInBatches!(chunks, {gml: {batchSize: 1}})) {
    batches.push(batch);
  }
  expect(batches.flatMap(batch => batch.features)).toHaveLength(2);
  expect(batches).toHaveLength(2);
});
test('GMLLoader transforms legacy gml:coord points', () => {
  const geometry = GMLParserLoader.parseTextSync(
    '<gml:Point xmlns:gml="http://www.opengis.net/gml"><gml:coord><gml:X>1</gml:X><gml:Y>2</gml:Y></gml:coord></gml:Point>',
    {transformCoords: (x: number, y: number) => [x + 10, y + 20]}
  ) as GeoJSON.Geometry;
  expect(geometry).toEqual({type: 'Point', coordinates: [11, 22]});
});
test('GMLLoader preserves CompositeSurface members in MultiSurface', () => {
  const geometry = GMLParserLoader.parseTextSync(
    `<gml:MultiSurface xmlns:gml="http://www.opengis.net/gml">
      <gml:surfaceMember>
        <gml:CompositeSurface>
          <gml:surfaceMember>
            <gml:Polygon>
              <gml:exterior><gml:LinearRing><gml:posList>0 0 1 0 1 1 0 0</gml:posList></gml:LinearRing></gml:exterior>
            </gml:Polygon>
          </gml:surfaceMember>
        </gml:CompositeSurface>
      </gml:surfaceMember>
    </gml:MultiSurface>`,
    {}
  ) as GeoJSON.MultiPolygon;
  expect(geometry.type).toBe('MultiPolygon');
  expect(geometry.coordinates).toHaveLength(1);
});
test('GMLLoader accepts alternate GML prefixes and schema-aware properties', () => {
  const collection = GMLParserLoader.parseTextSync(
    `<wfs:FeatureCollection xmlns:wfs="http://www.opengis.net/wfs/2.0" xmlns:gml32="http://www.opengis.net/gml/3.2" xmlns:city="urn:city"><gml32:featureMember><city:building gml32:id="b.1"><city:name>Library</city:name><city:height>12</city:height><city:open>true</city:open><city:shape><gml32:Point srsDimension="3"><gml32:pos>1 2 3</gml32:pos></gml32:Point></city:shape></city:building></gml32:featureMember></wfs:FeatureCollection>`,
    {gml: {propertyTypes: {height: 'number', open: 'boolean'}}}
  ) as any;

  expect(collection.features[0]).toMatchObject({
    id: 'b.1',
    properties: {name: 'Library', height: 12, open: true},
    geometry: {type: 'Point', coordinates: [1, 2, 3]}
  });
});
test('GMLLoader preserves interior rings with alternate GML prefixes', () => {
  const geometry = GMLParserLoader.parseTextSync(
    `<gml32:Polygon xmlns:gml32="http://www.opengis.net/gml/3.2"><gml32:exterior><gml32:LinearRing><gml32:posList>0 0 10 0 10 10 0 0</gml32:posList></gml32:LinearRing></gml32:exterior><gml32:interior><gml32:LinearRing><gml32:posList>2 2 4 2 4 4 2 2</gml32:posList></gml32:LinearRing></gml32:interior></gml32:Polygon>`,
    {}
  ) as GeoJSON.Polygon;
  expect(geometry.coordinates).toHaveLength(2);
});
