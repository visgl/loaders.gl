// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';

import {
  parseCurve,
  parseCurveSegments,
  parseGMLFeature,
  parseGMLFeatureCollection,
  parseGMLToGeometry,
  parseLinearRingOrLineString,
  parseMultiLineString,
  parseMultiPoint,
  parseMultiPolygon,
  parseMultiSurface,
  parsePoint,
  parsePolygonOrRectangle,
  parsePos,
  parsePosList,
  parseRing,
  parseSurface
} from '../../src/lib/parsers/gml/parse-gml';

const OPTIONS = {stride: 2};
const CONTEXT = {};
const RING = {
  'gml:LinearRing': {
    'gml:posList': '0 0 4 0 4 4 0 0'
  }
};
const POLYGON = {
  'gml:exterior': RING,
  'gml:interior': RING
};

describe('GML geometry helpers', () => {
  test('parses point and line coordinate encodings', () => {
    expect(parsePos({value: '1 2'}, OPTIONS, CONTEXT)).toEqual([1, 2]);
    expect(parsePosList({value: '1 2 3 4'}, OPTIONS, CONTEXT)).toEqual([
      [1, 2],
      [3, 4]
    ]);
    expect(
      parsePoint({'gml:coord': {'gml:X': '1', 'gml:Y': '2', 'gml:Z': '3'}}, OPTIONS, CONTEXT)
    ).toEqual([1, 2, 3]);
    expect(parsePoint({'gml:coordinates': '1,2'}, OPTIONS, CONTEXT)).toEqual([1, 2]);
    expect(
      parseLinearRingOrLineString(
        {
          'gml:Point': {'gml:pos': '1 2'},
          'gml:coordinates': '5,6'
        },
        OPTIONS,
        CONTEXT
      )
    ).toEqual([
      [1, 2],
      [5, 6]
    ]);
    expect(
      parseLinearRingOrLineString(
        {
          'gml:coord': [
            {'gml:X': '1', 'gml:Y': '2'},
            {'gml:X': '3', 'gml:Y': '4'}
          ]
        },
        OPTIONS,
        CONTEXT
      )
    ).toEqual([
      [1, 2],
      [3, 4]
    ]);
  });

  test('parses collections, curves, polygons, surfaces, and rectangles', () => {
    const point = {'gml:Point': {'gml:pos': '1 2'}};
    expect(parseMultiPoint({'gml:pointMember': [point, point]}, OPTIONS, CONTEXT)).toHaveLength(2);
    expect(
      parseMultiPoint({'gml:pointMembers': {'gml:Point': point['gml:Point']}}, OPTIONS, CONTEXT)
    ).toHaveLength(1);

    const segment = {'gml:LineStringSegment': {'gml:posList': '0 0 1 1'}};
    const curve = {'gml:segments': segment};
    expect(parseCurve(curve, OPTIONS, CONTEXT)).toEqual([
      [0, 0],
      [1, 1]
    ]);
    expect(() => parseCurveSegments({}, OPTIONS, CONTEXT)).toThrow();

    expect(
      parseMultiLineString(
        {'gml:lineStringMembers': {'gml:LineString': {'gml:posList': '0 0 1 1'}}},
        OPTIONS,
        CONTEXT
      )
    ).toHaveLength(1);
    expect(
      parseMultiLineString({'gml:curveMember': {'gml:Curve': curve}}, OPTIONS, CONTEXT)
    ).toHaveLength(1);
    expect(
      parseMultiPolygon({'gml:polygonMember': {'gml:Polygon': POLYGON}}, OPTIONS, CONTEXT)
    ).toHaveLength(1);
    expect(parsePolygonOrRectangle(POLYGON, OPTIONS, CONTEXT)).toHaveLength(2);
    expect(
      parseSurface({'gml:patches': {'gml:PolygonPatch': POLYGON}}, OPTIONS, CONTEXT)
    ).toHaveLength(1);
    expect(
      parseMultiSurface({'gml:surfaceMembers': {'gml:Polygon': POLYGON}}, OPTIONS, CONTEXT)
    ).toHaveLength(1);
    expect(
      parseRing(
        {'gml:curveMember': {'gml:LineString': {'gml:posList': '0 0 4 0 4 4 0 0'}}},
        OPTIONS,
        CONTEXT
      )
    ).toHaveLength(4);
  });

  test('parses feature members, transformations, and geometry dispatch', () => {
    const transformOptions = {
      stride: 2 as const,
      transformCoords: (x: number, y: number) => [x + 10, y - 1]
    };
    const geometry = parseGMLToGeometry(
      {'gml:Point': {'gml:pos': '1 2'}},
      transformOptions,
      CONTEXT
    );
    expect(geometry).toMatchObject({type: 'Point', coordinates: [11, 1]});
    expect(parseGMLToGeometry({'gml:Unknown': {}}, OPTIONS, CONTEXT)).toBeNull();

    const feature = parseGMLFeature(
      {
        'app:place': {
          attributes: {'gml:id': 'place.1'},
          'app:name': {value: 'One'},
          'app:shape': {'gml:Point': {'gml:pos': '1 2'}}
        }
      },
      OPTIONS
    );
    expect(feature).toMatchObject({id: 'place.1', properties: {name: 'One'}});
    expect(feature.geometry).toMatchObject({type: 'Point'});

    const collection = parseGMLFeatureCollection(
      {
        'gml:featureMembers': {
          'app:place': [{'gml:Point': {'gml:pos': '1 2'}}, {'gml:Point': {'gml:pos': '3 4'}}]
        }
      },
      OPTIONS
    );
    expect(collection?.features).toHaveLength(2);
  });

  test('rejects malformed coordinate and collection structures', () => {
    expect(() => parsePos('', OPTIONS, CONTEXT)).toThrow('invalid gml:pos');
    expect(() => parsePosList('', OPTIONS, CONTEXT)).toThrow('invalid gml:posList');
    expect(() => parsePoint({}, OPTIONS, CONTEXT)).toThrow('invalid gml:Point');
    expect(() => parseMultiPoint({}, OPTIONS, CONTEXT)).toThrow('must have > 0 points');
    expect(() => parseMultiLineString({}, OPTIONS, CONTEXT)).toThrow('must have > 0 line strings');
    expect(() => parseMultiPolygon({}, OPTIONS, CONTEXT)).toThrow('must have > 0 polygons');
    expect(() => parseSurface({}, OPTIONS, CONTEXT)).toThrow('invalid');
    expect(() => parseMultiSurface({}, OPTIONS, CONTEXT)).toThrow('must have > 0 polygons');
    expect(() => parsePolygonOrRectangle({}, OPTIONS, CONTEXT)).toThrow('invalid');
    expect(parseGMLFeatureCollection({})).toBeNull();
  });
});
