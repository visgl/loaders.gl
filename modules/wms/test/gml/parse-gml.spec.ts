// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';

import {
  parseCurve,
  parseCurveSegments,
  parseCompositeSurface,
  parseExteriorOrInterior,
  parseGMLFeature,
  parseGMLFeatureCollection,
  parseGML,
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
  test('parses XML feature collections and typed properties', () => {
    const result = parseGML(
      `<gml:FeatureCollection xmlns:gml="http://www.opengis.net/gml" xmlns:app="urn:app">
        <gml:featureMembers>
          <app:place gml:id="place.2">
            <app:name>Harbor</app:name>
            <app:active>true</app:active>
            <app:count>7</app:count>
            <app:score>2.5</app:score>
            <app:when>2026-08-28</app:when>
            <app:shape><gml:Point srsDimension="3"><gml:pos>1 2 3</gml:pos></gml:Point></app:shape>
          </app:place>
        </gml:featureMembers>
      </gml:FeatureCollection>`,
      {
        propertyTypes: {
          active: 'boolean',
          count: 'integer',
          score: 'number',
          when: 'date'
        }
      }
    ) as any;

    expect(result.type).toBe('FeatureCollection');
    expect(result.features[0]).toMatchObject({
      id: 'place.2',
      properties: {
        name: 'Harbor',
        active: true,
        count: 7,
        score: 2.5
      },
      geometry: {type: 'Point', coordinates: [1, 2, 3]}
    });
    expect(result.features[0].properties.when).toBe('2026-08-28');
  });

  test('parses bare XML geometries and four-dimensional coordinates', () => {
    expect(
      parseGML(
        '<gml:Point xmlns:gml="http://www.opengis.net/gml"><gml:pos>1 2</gml:pos></gml:Point>',
        {}
      )
    ).toEqual({
      type: 'Point',
      coordinates: [1, 2]
    });
    expect(
      parseGMLToGeometry(
        {'gml:LineString': {'gml:posList': '1 2 3 4 5 6 7 8'}},
        {stride: 4},
        CONTEXT
      )
    ).toMatchObject({
      type: 'LineString',
      coordinates: [
        [1, 2, 3, 4],
        [5, 6, 7, 8]
      ]
    });
  });

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

  test('dispatches every polygon and surface geometry family', () => {
    const surface = {'gml:patches': {'gml:Rectangle': POLYGON}};
    const composite = {'gml:surfaceMember': {'gml:Surface': surface}};
    expect(parseGMLToGeometry({'gml:Polygon': POLYGON}, OPTIONS, CONTEXT)?.type).toBe('Polygon');
    expect(parseGMLToGeometry({'gml:Rectangle': POLYGON}, OPTIONS, CONTEXT)?.type).toBe('Polygon');
    expect(parseGMLToGeometry({'gml:Surface': surface}, OPTIONS, CONTEXT)?.type).toBe(
      'MultiPolygon'
    );
    expect(
      parseGMLToGeometry(
        {'gml:MultiSurface': {'gml:surfaceMember': {'gml:Surface': surface}}},
        OPTIONS,
        CONTEXT
      )?.type
    ).toBe('MultiPolygon');
    expect(parseCompositeSurface(composite, OPTIONS, CONTEXT)).toHaveLength(1);
    expect(
      parseCompositeSurface({'gml:surfaceMembers': {'gml:Polygon': POLYGON}}, OPTIONS, CONTEXT)
    ).toHaveLength(1);
  });

  test('joins overlapping curve and ring segments', () => {
    const segments = {
      ignored: {},
      'gml:LineStringSegment': {'gml:posList': '0 0 1 1'},
      'alternate:LineStringSegment': {'gml:posList': '1 1 2 2'}
    };
    expect(parseCurveSegments(segments, OPTIONS, CONTEXT)).toEqual([
      [0, 0],
      [1, 1],
      [2, 2]
    ]);
    const ring = {
      'gml:curveMember': {
        'gml:Curve': {'gml:segments': {'gml:LineStringSegment': {'gml:posList': '0 0 2 0'}}}
      },
      'alternate:curveMember': {
        'gml:Curve': {
          'gml:segments': {'gml:LineStringSegment': {'gml:posList': '2 0 2 2 0 0'}}
        }
      }
    };
    expect(parseRing(ring, OPTIONS, CONTEXT)).toEqual([
      [0, 0],
      [2, 0],
      [2, 2],
      [0, 0]
    ]);
  });

  test('normalizes plural members, nested features, ids, and typed values', () => {
    const collection = parseGMLFeatureCollection(
      {
        wrapper: {
          'gml:featureMembers': [
            {
              attributes: {},
              'app:item': {
                fid: 'direct.1',
                'app:flags': [{value: '1'}, {'#text': 'false'}],
                'app:when': {'#text': 20260830}
              }
            },
            {'app:item': {attributes: {'app:id': 'attribute.2'}, 'app:value': 3}}
          ]
        }
      },
      {propertyTypes: {flags: 'boolean', when: 'date-time'}}
    );
    expect(collection?.features).toMatchObject([
      {id: 'direct.1', geometry: null, properties: {flags: [true, false], when: '20260830'}},
      {id: 'attribute.2', geometry: null, properties: {value: 3}}
    ]);
  });

  test('covers alternate coordinate forms and their validation', () => {
    expect(parsePoint({'gml:coord': {'gml:X': 7, 'gml:Y': 8}}, OPTIONS, CONTEXT)).toEqual([7, 8]);
    expect(
      parseLinearRingOrLineString(
        {'gml:pos': {value: '1 2'}, 'alternate:pos': {value: '3 4'}},
        OPTIONS,
        CONTEXT
      )
    ).toEqual([
      [1, 2],
      [3, 4]
    ]);
    expect(
      parseExteriorOrInterior(
        {
          'gml:Ring': {
            'gml:curveMember': {
              'gml:LineString': {'gml:coordinates': '0,0 2,0 2,2 0,0'}
            }
          }
        },
        OPTIONS,
        CONTEXT
      )
    ).toHaveLength(4);
    expect(() => parsePos('1 2 3 4', OPTIONS, CONTEXT)).toThrow('must have 1 point');
    expect(() =>
      parsePosList({attributes: {srsDimension: '0'}, value: '1 2'}, OPTIONS, CONTEXT)
    ).toThrow('positive integer');
    expect(() => parsePoint({'gml:coordinates': '1,not-a-number'}, OPTIONS, CONTEXT)).toThrow(
      'invalid GML 2 coordinates'
    );
    expect(() => parseExteriorOrInterior({}, OPTIONS, CONTEXT)).toThrow('invalid');
    expect(() => parseRing({'gml:curveMember': {}}, OPTIONS, CONTEXT)).toThrow('invalid');
    expect(() => parseCompositeSurface({}, OPTIONS, CONTEXT)).toThrow('must have > 0 polygons');
  });
});
