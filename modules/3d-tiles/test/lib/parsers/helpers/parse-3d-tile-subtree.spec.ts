// loaders.gl
// SPDX-License-Identifier: MIT AND Apache-2.0
// Copyright vis.gl contributors

import {expect, test} from 'vitest';
import {coreApi} from '@loaders.gl/core';
import {loadExplicitBitstream} from '../../../../src/lib/parsers/helpers/parse-3d-tile-subtree';
import {Subtree, Availability} from '../../../../src/types';
import {LoaderContext} from '@loaders.gl/loader-utils';
const context = (): LoaderContext => ({
  fetch,
  coreApi,
  _parse: async arrayBuffer => arrayBuffer,
  baseUrl: 'fake/url'
});
test('loadExplicitBitstream extracts a single buffer to an explicit bitstream', async () => {
  const tileAvailability: Availability = {bitstream: 0};
  const subtree: Subtree = {
    buffers: [
      {
        name: 'Tile availability',
        byteLength: 1
      }
    ],
    bufferViews: [
      {
        buffer: 0,
        byteOffset: 0,
        byteLength: 1
      }
    ],
    tileAvailability,
    contentAvailability: {constant: 1},
    childSubtreeAvailability: {constant: 0}
  };
  const internalBinaryBuffer = new Uint8Array([255]);
  expect(tileAvailability.explicitBitstream).toEqual(undefined);
  await loadExplicitBitstream(subtree, tileAvailability, internalBinaryBuffer, context());
  expect(tileAvailability.explicitBitstream).toEqual(new Uint8Array([255]));
});
test('loadExplicitBitstream extracts multiple buffers to explicit bitstreams', async () => {
  const tileAvailability: Availability = {bitstream: 0};
  const contentAvailability: Availability = {bitstream: 1};
  const subtree: Subtree = {
    buffers: [
      {
        name: 'Tile availability',
        byteLength: 1
      },
      {
        name: 'Content availability',
        byteLength: 1
      }
    ],
    bufferViews: [
      {
        buffer: 0,
        byteOffset: 0,
        byteLength: 1
      },
      {
        buffer: 1,
        byteOffset: 0,
        byteLength: 1
      }
    ],
    tileAvailability,
    contentAvailability: [contentAvailability],
    childSubtreeAvailability: {constant: 0}
  };
  const internalBinaryBuffer = new Uint8Array([255, 128]);
  expect(tileAvailability.explicitBitstream).toEqual(undefined);
  expect(contentAvailability.explicitBitstream).toEqual(undefined);
  await loadExplicitBitstream(subtree, tileAvailability, internalBinaryBuffer, context());
  expect(tileAvailability.explicitBitstream).toEqual(new Uint8Array([255]));
  await loadExplicitBitstream(subtree, contentAvailability, internalBinaryBuffer, context());
  expect(contentAvailability.explicitBitstream).toEqual(new Uint8Array([128]));
});
test('loadExplicitBitstream ignores omitted optional availability', async () => {
  const subtree: Subtree = {
    buffers: [],
    bufferViews: [],
    tileAvailability: {constant: 1},
    childSubtreeAvailability: {constant: 0}
  };
  await loadExplicitBitstream(subtree, undefined, new ArrayBuffer(0), context());
  expect(true, 'does not require optional content availability').toBe(true);
});
