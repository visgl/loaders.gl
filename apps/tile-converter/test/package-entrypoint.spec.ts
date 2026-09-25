import {expect, test} from 'vitest';
import {I3SConverter, Tiles3DConverter} from '@loaders.gl/tile-converter';

test('tile-converter package entrypoint exports both converters', () => {
  expect(I3SConverter).toBeTypeOf('function');
  expect(Tiles3DConverter).toBeTypeOf('function');
  expect(new I3SConverter()).toBeInstanceOf(I3SConverter);
  expect(new Tiles3DConverter()).toBeInstanceOf(Tiles3DConverter);
});
