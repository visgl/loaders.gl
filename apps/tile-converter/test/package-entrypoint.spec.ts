import {expect, test} from 'vitest';
import {convertTileset} from '@loaders.gl/tile-converter';
import {I3SConverter, Tiles3DConverter} from '@loaders.gl/tile-converter/v4';
import {convertTileset as v5ConvertTileset} from '@loaders.gl/tile-converter/v5';

test('tile-converter package root defaults to v5', () => {
  expect(convertTileset).toBeTypeOf('function');
  expect(convertTileset).toBe(v5ConvertTileset);
});

test('tile-converter v4 entry point exports both legacy converters', () => {
  expect(I3SConverter).toBeTypeOf('function');
  expect(Tiles3DConverter).toBeTypeOf('function');
  expect(new I3SConverter()).toBeInstanceOf(I3SConverter);
  expect(new Tiles3DConverter()).toBeInstanceOf(Tiles3DConverter);
});
