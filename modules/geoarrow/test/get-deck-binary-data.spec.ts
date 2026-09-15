// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {createFloat16Array, setFloat16Value} from '@loaders.gl/schema';
import {makeMeshArrowTable} from '@loaders.gl/schema-utils';
import {expect, test} from 'vitest';
import {getDeckBinaryDataFromArrowMesh} from '../src/mesharrow/get-deck-binary-data';

test('getDeckBinaryDataFromArrowMesh#converts Float16 colors to byte colors', () => {
  const colors = createFloat16Array(6);
  setFloat16Value(colors, 0, 0);
  setFloat16Value(colors, 1, 0.5);
  setFloat16Value(colors, 2, 1);
  setFloat16Value(colors, 3, 1);
  setFloat16Value(colors, 4, 0.25);
  setFloat16Value(colors, 5, 0.75);
  const table = makeMeshArrowTable({
    POSITION: {value: new Float32Array([0, 0, 0, 1, 1, 1]), size: 3},
    COLOR_0: {value: colors, size: 3, componentType: 'float16'}
  });

  const binaryData = getDeckBinaryDataFromArrowMesh(table.data);
  expect(binaryData.attributes.getColor).toEqual({
    size: 3,
    value: new Uint8Array([0, 128, 255, 255, 64, 191])
  });
});

test('getDeckBinaryDataFromArrowMesh#converts Float32 colors to byte colors', () => {
  const table = makeMeshArrowTable({
    POSITION: {value: new Float32Array([0, 0, 0]), size: 3},
    COLOR_0: {value: new Float32Array([0, 0.5, 1]), size: 3}
  });

  const binaryData = getDeckBinaryDataFromArrowMesh(table.data);
  expect(binaryData.attributes.getColor).toEqual({
    size: 3,
    value: new Uint8Array([0, 128, 255])
  });
});

test('getDeckBinaryDataFromArrowMesh#preserves byte colors', () => {
  const table = makeMeshArrowTable({
    POSITION: {value: new Float32Array([0, 0, 0]), size: 3},
    COLOR_0: {value: new Uint8Array([10, 20, 30]), size: 3}
  });

  const binaryData = getDeckBinaryDataFromArrowMesh(table.data);
  expect(binaryData.attributes.getColor).toEqual({
    size: 3,
    value: new Uint8Array([10, 20, 30])
  });
});
