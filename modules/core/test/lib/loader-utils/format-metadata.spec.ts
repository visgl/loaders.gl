import {expect, test} from 'vitest';

import {ArrowLoader} from '@loaders.gl/arrow';
import {FlatGeobufLoader} from '@loaders.gl/flatgeobuf';
import {MVTLoader, TileJSONLoader} from '@loaders.gl/mvt';
import {PLYLoader} from '@loaders.gl/ply';

test('loader format metadata includes physical encoding and logical format', () => {
  expect(TileJSONLoader.encoding).toBe('json');
  expect(TileJSONLoader.format).toBe('tilejson');

  expect(MVTLoader.encoding).toBe('protobuf');
  expect(MVTLoader.format).toBe('mvt');

  expect(FlatGeobufLoader.encoding).toBe('flatbuffers');
  expect(FlatGeobufLoader.format).toBe('flatgeobuf');

  expect(ArrowLoader.encoding).toBe('arrow');
  expect(ArrowLoader.format).toBe('arrow');
});

test('hybrid format metadata preserves compatibility flags', () => {
  expect(PLYLoader.encoding).toBe('text');
  expect(PLYLoader.format).toBe('ply');
  expect(PLYLoader.text).toBe(true);
  expect(PLYLoader.binary).toBe(true);
});
