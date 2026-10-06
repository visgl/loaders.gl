// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {parse} from '@loaders.gl/core';
import {Tiles3DLoader} from '@loaders.gl/3d-tiles/bundled';
import {convertTableToMesh, makeMeshArrowTable} from '@loaders.gl/schema-utils';
import {encodePointCloudTile} from '../apps/tile-converter/src/v5/point-cloud';

test.each(['mesh', 'arrow'] as const)('PNTS rejects unsupported %s point attributes', shape => {
  const table = makeMeshArrowTable({
    POSITION: {value: new Float32Array([1, 2, 3]), size: 3},
    classification: {value: new Uint8Array([2]), size: 1},
    intensity: {value: new Uint16Array([42]), size: 1}
  });
  const pointBatch = shape === 'mesh' ? convertTableToMesh(table) : table;

  expect(() => encodePointCloudTile(pointBatch)).toThrowError(
    expect.objectContaining({
      code: 'POINT_CLOUD_ATTRIBUTE_UNSUPPORTED',
      message: 'PNTS encoding does not support these point attributes: classification, intensity'
    })
  );
  expect(Object.keys(convertTableToMesh(table).attributes)).toEqual([
    'POSITION',
    'classification',
    'intensity'
  ]);
});

test('PNTS rejects a second color attribute instead of silently choosing one', () => {
  const table = makeMeshArrowTable({
    POSITION: {value: new Float32Array([1, 2, 3]), size: 3},
    COLOR_0: {value: new Uint8Array([255, 0, 0]), size: 3},
    COLOR: {value: new Uint8Array([0, 255, 0]), size: 3}
  });

  expect(() => encodePointCloudTile(table)).toThrowError(
    expect.objectContaining({
      code: 'POINT_CLOUD_ATTRIBUTE_UNSUPPORTED',
      message: 'PNTS encoding does not support these point attributes: COLOR'
    })
  );
});

test.each(['COLOR', 'COLOR_0'])('PNTS retains supported attributes with %s', async colorName => {
  const table = makeMeshArrowTable({
    POSITION: {value: new Float32Array([1, 2, 3]), size: 3},
    [colorName]: {value: new Uint8Array([255, 0, 0]), size: 3},
    NORMAL: {value: new Float32Array([0, 0, 1]), size: 3},
    BATCH_ID: {value: new Uint16Array([0]), size: 1}
  });

  const pnts = encodePointCloudTile(table, {batchTableJson: {name: ['point']}});
  const parsed = await parse(pnts, Tiles3DLoader, {worker: false});
  expect(Array.from(parsed.attributes.positions!)).toEqual([1, 2, 3]);
  expect(Array.from(parsed.attributes.colors!.value)).toEqual([255, 0, 0]);
  expect(Array.from(parsed.attributes.normals!.value)).toEqual([0, 0, 1]);
  expect(Array.from(parsed.batchIds!)).toEqual([0]);
  expect(parsed.batchTableJson).toEqual({name: ['point']});
});
