import {expect, test} from 'vitest';
import {getRasterViewportBoundingBox} from '../../../src';

test('getRasterViewportBoundingBox resolves explicit bounds', () => {
  const boundingBox = getRasterViewportBoundingBox({
    id: 'viewport-0',
    width: 256,
    height: 256,
    zoom: 2,
    center: [0, 0],
    bounds: [
      [-20, 10],
      [20, 30]
    ],
    project: coordinates => coordinates,
    unprojectPosition: position => position as [number, number, number]
  });

  expect(boundingBox).toEqual([
    [-20, 10],
    [20, 30]
  ]);
});

test('getRasterViewportBoundingBox falls back to getBounds()', () => {
  const boundingBox = getRasterViewportBoundingBox({
    id: 'viewport-1',
    width: 256,
    height: 256,
    zoom: 2,
    center: [0, 0],
    getBounds: () => [-20, 10, 20, 30],
    project: coordinates => coordinates,
    unprojectPosition: position => position as [number, number, number]
  });

  expect(boundingBox).toEqual([
    [-20, 10],
    [20, 30]
  ]);
});
