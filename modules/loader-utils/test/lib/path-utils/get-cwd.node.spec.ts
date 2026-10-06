import {afterEach, expect, test, vi} from 'vitest';
import {getCWD} from '../../../src/lib/path-utils/get-cwd';

afterEach(() => vi.unstubAllGlobals());

test('working directory retains Node behavior', () => {
  expect(getCWD()).toBe(process.cwd());
});

test.each([
  {location: {pathname: '/assets/conversion-worker.js'}, expected: '/assets/'},
  {location: {pathname: '/worker.js'}, expected: '/'},
  {location: undefined, expected: ''}
])('working directory uses the script location without a window: $expected', ({
  location,
  expected
}) => {
  vi.stubGlobal('process', undefined);
  vi.stubGlobal('location', location);
  expect(getCWD()).toBe(expected);
});
