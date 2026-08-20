// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
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

test('loadExplicitBitstream extracts a single buffer to an explicit bitstream', async t => {
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

  t.deepEqual(tileAvailability.explicitBitstream, undefined);

  await loadExplicitBitstream(subtree, tileAvailability, internalBinaryBuffer, context());

  t.deepEqual(tileAvailability.explicitBitstream, new Uint8Array([255]));
});

test('loadExplicitBitstream extracts multiple buffers to explicit bitstreams', async t => {
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

  t.deepEqual(tileAvailability.explicitBitstream, undefined);
  t.deepEqual(contentAvailability.explicitBitstream, undefined);

  await loadExplicitBitstream(subtree, tileAvailability, internalBinaryBuffer, context());
  t.deepEqual(tileAvailability.explicitBitstream, new Uint8Array([255]));

  await loadExplicitBitstream(subtree, contentAvailability, internalBinaryBuffer, context());
  t.deepEqual(contentAvailability.explicitBitstream, new Uint8Array([128]));
});

test('loadExplicitBitstream ignores omitted optional availability', async t => {
  const subtree: Subtree = {
    buffers: [],
    bufferViews: [],
    tileAvailability: {constant: 1},
    childSubtreeAvailability: {constant: 0}
  };

  await loadExplicitBitstream(subtree, undefined, new ArrayBuffer(0), context());

  t.pass('does not require optional content availability');
  t.end();
});
