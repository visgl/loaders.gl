import {describe, expect, it} from 'vitest';
import {expandReducedGaussianGrid, finiteRange, colorForValue} from './grid';

describe('reduced Gaussian grid', () => {
  it('expands variable row lengths in storage order', () => {
    const points = expandReducedGaussianGrid([1, 2, 3, 4, 5], {latitudes: [45, -45], pointsPerLatitude: [2, 3]});
    expect(points.map(p => p.index)).toEqual([0, 1, 2, 3, 4]);
    expect(points.map(p => p.position[1])).toEqual([45, 45, -45, -45, -45]);
    expect(points[1].position[0]).toBe(-180);
  });
  it('accepts explicit longitudes and excludes non-finite values', () => {
    const points = expandReducedGaussianGrid([1, NaN], {latitudes: [0], pointsPerLatitude: [2], longitudes: [-10, 10]});
    expect(points).toEqual([{position: [-10, 0], value: 1, index: 0}]);
  });
  it('rejects mismatched shapes', () => {
    expect(() => expandReducedGaussianGrid([1], {latitudes: [0], pointsPerLatitude: [2]})).toThrow(/expects 2/);
  });
  it('computes a finite range', () => {
    expect(finiteRange([NaN, -2, 3])).toEqual([-2, 3]);
    expect(() => finiteRange([NaN])).toThrow();
    expect(colorForValue(0, 0, 10)).toHaveLength(4);
  });
});
