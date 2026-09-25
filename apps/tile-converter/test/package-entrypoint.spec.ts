import {expect, test} from 'vitest';
import {createRequire} from 'node:module';

test('tile-converter package entrypoint exports both converters', () => {
  const require = createRequire(import.meta.url);
  const packagePath = require.resolve('@loaders.gl/tile-converter');
  const {I3SConverter, Tiles3DConverter} = require('@loaders.gl/tile-converter');

  expect(packagePath).toMatch(/apps[\\/]tile-converter[\\/]dist[\\/]index\.cjs$/);
  expect(I3SConverter).toBeTypeOf('function');
  expect(Tiles3DConverter).toBeTypeOf('function');
  expect(new I3SConverter()).toBeInstanceOf(I3SConverter);
  expect(new Tiles3DConverter()).toBeInstanceOf(Tiles3DConverter);
});
