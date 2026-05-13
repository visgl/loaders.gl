import {expect, test} from 'vitest';
import {setLoaderOptions, getLoaderOptions} from '@loaders.gl/core';
test('setLoaderOptions', () => {
  setLoaderOptions({});
});
test('getLoaderOptions', () => {
  const options1 = getLoaderOptions();
  expect(options1.customOption).toBeFalsy();
  setLoaderOptions({
    customOption: 'customValue'
  });
  const options2 = getLoaderOptions();
  expect(options2.customOption).toBe('customValue');
});
