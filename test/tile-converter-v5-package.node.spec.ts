import {createRequire} from 'node:module';
import {expect, test} from 'vitest';

test('tile-converter(v5)#package export resolves to its built CommonJS entrypoint', () => {
  const require = createRequire(import.meta.url);
  const packagePath = require.resolve('@loaders.gl/tile-converter/v5');
  const {
    convertTileset,
    inspectTileset,
    validateTileset
  } = require('@loaders.gl/tile-converter/v5');

  expect(packagePath).toMatch(/apps[\\/]tile-converter[\\/]dist[\\/]v5[\\/]index\.cjs$/);
  expect(convertTileset).toBeTypeOf('function');
  expect(inspectTileset).toBeTypeOf('function');
  expect(validateTileset).toBeTypeOf('function');
});
