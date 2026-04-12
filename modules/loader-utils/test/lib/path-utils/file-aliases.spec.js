import {expect, test} from 'vitest';
import {setPathPrefix, getPathPrefix, resolvePath} from '@loaders.gl/loader-utils';
// NOTE: addAliases is not a public export, already used by test setup
// import {_addAliases} from '@loaders.gl/loader-utils';
test('file aliases#imports', () => {
  expect(typeof setPathPrefix === 'function', 'setPathPrefix() defined').toBeTruthy();
  expect(typeof getPathPrefix === 'function', 'getPathPrefix() defined').toBeTruthy();
  expect(typeof resolvePath === 'function', 'resolvePath() defined').toBeTruthy();
});
test('file aliases#path prefix', () => {
  expect(getPathPrefix(), 'getPathPrefix() return correct value').toBe('');
  setPathPrefix('/tmp/');
  expect(getPathPrefix(), 'getPathPrefix() return correct value').toBe('/tmp/');
  expect(resolvePath('geo.json')).toBe('/tmp/geo.json');
  // Make sure to reset so we don't break other tests!
  setPathPrefix('');
  expect(resolvePath('geo.json')).toBe('geo.json');
});
