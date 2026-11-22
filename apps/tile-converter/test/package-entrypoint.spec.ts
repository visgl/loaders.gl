import {expect, test} from 'vitest';
import {convertTileset} from '@loaders.gl/tile-converter';
import {convertTileset as v5ConvertTileset} from '@loaders.gl/tile-converter/v5';

test('tile-converter package root defaults to v5', () => {
  expect(convertTileset).toBeTypeOf('function');
  expect(convertTileset).toBe(v5ConvertTileset);
});
