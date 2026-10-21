// SPDX-License-Identifier: MIT
import {expect, test} from 'vitest';
import type {Geometry, Position} from '@loaders.gl/core/schema';
import {rewindGeometry} from '../../../src/wms/lib/parsers/gml/rewind-geometry';

/** Creates a closed clockwise triangle with retained elevation values. */
function makeClockwiseRing(): Position[] {
  return [
    [0, 0, 1],
    [0, 1, 2],
    [1, 0, 3],
    [0, 0, 1]
  ];
}

test.each(['Polygon', 'MultiPolygon'] as const)('rewinds %s exteriors and holes in place', type => {
  const outer = makeClockwiseRing();
  const hole = makeClockwiseRing().reverse();
  const coordinates = [outer, hole];
  const geometry: Geometry =
    type === 'Polygon' ? {type, coordinates} : {type, coordinates: [coordinates]};
  expect(rewindGeometry(geometry)).toBe(geometry);
  expect(outer).toEqual(makeClockwiseRing().reverse());
  expect(hole).toEqual(makeClockwiseRing());
  rewindGeometry(geometry);
  expect(outer).toEqual(makeClockwiseRing().reverse());
  expect(hole).toEqual(makeClockwiseRing());
});

test('rewinds nested collections and preserves historical clockwise line ordering', () => {
  const line = makeClockwiseRing().reverse();
  const multiLine = makeClockwiseRing().reverse();
  const point: Geometry = {type: 'Point', coordinates: [5, 6]};
  const geometry: Geometry = {
    type: 'GeometryCollection',
    geometries: [
      point,
      {
        type: 'GeometryCollection',
        geometries: [
          {type: 'LineString', coordinates: line},
          {type: 'MultiLineString', coordinates: [multiLine]}
        ]
      }
    ]
  };
  expect(rewindGeometry(geometry)).toBe(geometry);
  expect(line).toEqual(makeClockwiseRing());
  expect(multiLine).toEqual(makeClockwiseRing());
  expect(point.coordinates).toEqual([5, 6]);
});

test('handles empty and degenerate rings and leaves multipoints alone', () => {
  const degenerate = [
    [0, 0],
    [1, 0],
    [2, 0]
  ];
  const geometry: Geometry = {type: 'Polygon', coordinates: [[], degenerate]};
  rewindGeometry(geometry);
  expect(degenerate).toEqual([
    [2, 0],
    [1, 0],
    [0, 0]
  ]);
  const points: Geometry = {
    type: 'MultiPoint',
    coordinates: [
      [2, 3],
      [4, 5]
    ]
  };
  expect(rewindGeometry(points)).toBe(points);
  expect(points.coordinates).toEqual([
    [2, 3],
    [4, 5]
  ]);
});
