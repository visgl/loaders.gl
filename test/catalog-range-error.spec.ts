import {expect, test} from 'vitest';
import {isCatalogRangeUnsupportedError} from '../website/src/components/docs/catalog-range-error';

test.each([
  ['HTTP byte-range request expected 206, received 200', true],
  ['Missing Content-Range header', true],
  ['Server does not support range requests', true],
  ['HTTP byte-range request expected 206, received 403', false],
  ['HTTP byte-range request expected 206, received 500', false],
  ['Invalid Parquet footer', false]
])('classifies range fallback eligibility: %s', (message, expected) => {
  expect(isCatalogRangeUnsupportedError(new Error(message))).toBe(expected);
});
