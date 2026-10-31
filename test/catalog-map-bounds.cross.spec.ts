import {expect, test} from 'vitest';
import {getCatalogPointBounds} from '../website/src/components/docs/catalog-map-bounds';

test('fits regional coordinate samples and pads a single point', () => {
  expect(getCatalogPointBounds([])).toBeUndefined();
  expect(getCatalogPointBounds([{position: [10, 45]}, {position: [12, 47]}])).toEqual([
    10, 45, 12, 47
  ]);
  expect(getCatalogPointBounds([{position: [10, 45]}])).toEqual([9.99, 44.99, 10.01, 45.01]);
  const polarBounds = getCatalogPointBounds([{position: [0, 90]}])!;
  expect(polarBounds[1]).toBeLessThan(polarBounds[3]);
  expect(polarBounds[3]).toBeLessThanOrEqual(85.01);
});
