// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {parse} from '@loaders.gl/core';
import {Tiles3DLoaderWithParser as Tiles3DLoader} from '../../../src/tiles-3d-loader-with-parser';

/** Encodes JSON and pads it to the alignment required by 3D Tiles tables. */
function encodePaddedJson(json: object): Uint8Array {
  const encoded = new TextEncoder().encode(JSON.stringify(json));
  const padded = new Uint8Array(Math.ceil(encoded.byteLength / 4) * 4);
  padded.fill(0x20);
  padded.set(encoded);
  return padded;
}

/** Creates a minimal PNTS tile from deterministic table payloads. */
function createPointCloudTile(
  featureTableJson: object,
  featureTableBinary: Uint8Array,
  batchTableJson: object = {},
  batchTableBinary = new Uint8Array()
): ArrayBuffer {
  const featureJson = encodePaddedJson(featureTableJson);
  const batchJson = Object.keys(batchTableJson).length
    ? encodePaddedJson(batchTableJson)
    : new Uint8Array();
  const byteLength =
    28 +
    featureJson.byteLength +
    featureTableBinary.byteLength +
    batchJson.byteLength +
    batchTableBinary.byteLength;
  const bytes = new Uint8Array(byteLength);
  const view = new DataView(bytes.buffer);
  bytes.set(new TextEncoder().encode('pnts'), 0);
  view.setUint32(4, 1, true);
  view.setUint32(8, byteLength, true);
  view.setUint32(12, featureJson.byteLength, true);
  view.setUint32(16, featureTableBinary.byteLength, true);
  view.setUint32(20, batchJson.byteLength, true);
  view.setUint32(24, batchTableBinary.byteLength, true);
  let byteOffset = 28;
  for (const section of [featureJson, featureTableBinary, batchJson, batchTableBinary]) {
    bytes.set(section, byteOffset);
    byteOffset += section.byteLength;
  }
  return bytes.buffer;
}

test('point cloud parser reads raw positions, RGBA colors, normals, and globals', async () => {
  const binary = new Uint8Array(28);
  new Float32Array(binary.buffer, 0, 3).set([1, 2, 3]);
  binary.set([10, 20, 30, 40], 12);
  new Float32Array(binary.buffer, 16, 3).set([0, 0, 1]);

  const tile = await parse(
    createPointCloudTile(
      {
        POINTS_LENGTH: 1,
        POSITION: {byteOffset: 0},
        RGBA: {byteOffset: 12},
        NORMAL: {byteOffset: 16},
        RTC_CENTER: [4, 5, 6],
        CONSTANT_RGBA: [1, 2, 3, 4]
      },
      binary
    ),
    Tiles3DLoader
  );

  expect(tile.pointCount).toBe(1);
  expect(tile.rtcCenter).toEqual([4, 5, 6]);
  expect(Array.from(tile.attributes.positions)).toEqual([1, 2, 3]);
  expect(Array.from(tile.attributes.colors.value)).toEqual([10, 20, 30, 40]);
  expect(Array.from(tile.attributes.normals.value)).toEqual([0, 0, 1]);
  expect(tile.constantRGBA).toEqual([1, 2, 3, 4]);
  expect(tile.isTranslucent).toBe(true);
});

test('point cloud parser normalizes quantized positions, RGB565, and oct normals', async () => {
  const binary = new Uint8Array(10);
  new Uint16Array(binary.buffer, 0, 3).set([0, 32768, 65535]);
  new Uint16Array(binary.buffer, 6, 1)[0] = 0xffff;
  binary.set([128, 128], 8);

  const tile = await parse(
    createPointCloudTile(
      {
        POINTS_LENGTH: 1,
        POSITION_QUANTIZED: {byteOffset: 0},
        QUANTIZED_VOLUME_SCALE: [10, 20, 30],
        QUANTIZED_VOLUME_OFFSET: [1, 2, 3],
        RGB565: {byteOffset: 6},
        NORMAL_OCT16P: {byteOffset: 8}
      },
      binary
    ),
    Tiles3DLoader,
    {'3d-tiles': {decodeQuantizedPositions: true}}
  );

  expect(tile.isQuantized).toBe(false);
  expect(Array.from(tile.attributes.positions)).toEqual([1, 12.000152587890625, 33]);
  expect(Array.from(tile.attributes.colors.value)).toEqual([255, 255, 255]);
  expect(tile.attributes.normals.value).toHaveLength(3);
  expect(tile.attributes.normals.value.every(Number.isFinite)).toBe(true);
  expect(tile.isRGB565).toBe(true);
  expect(tile.isOctEncoded16P).toBe(true);
});

test('point cloud parser retains quantized accessors when CPU decoding is disabled', async () => {
  const tile = await parse(
    createPointCloudTile(
      {
        POINTS_LENGTH: 1,
        POSITION_QUANTIZED: {byteOffset: 0},
        QUANTIZED_VOLUME_SCALE: [1, 1, 1],
        QUANTIZED_VOLUME_OFFSET: [0, 0, 0],
        RGB: {byteOffset: 6}
      },
      new Uint8Array(9)
    ),
    Tiles3DLoader
  );

  expect(tile.isQuantized).toBe(true);
  expect(tile.attributes.positions).toMatchObject({size: 3, normalized: true});
  expect(tile.attributes.colors).toMatchObject({size: 3, normalized: true});
});

test('point cloud parser validates quantization and batching metadata', async () => {
  const quantizedPosition = {POINTS_LENGTH: 1, POSITION_QUANTIZED: {byteOffset: 0}};
  await expect(
    parse(
      createPointCloudTile(
        {...quantizedPosition, QUANTIZED_VOLUME_OFFSET: [0, 0, 0]},
        new Uint8Array(6)
      ),
      Tiles3DLoader
    )
  ).rejects.toThrow('QUANTIZED_VOLUME_SCALE');
  await expect(
    parse(
      createPointCloudTile(
        {...quantizedPosition, QUANTIZED_VOLUME_SCALE: [1, 1, 1]},
        new Uint8Array(6)
      ),
      Tiles3DLoader
    )
  ).rejects.toThrow('QUANTIZED_VOLUME_OFFSET');
  await expect(
    parse(
      createPointCloudTile(
        {POINTS_LENGTH: 1, POSITION: {byteOffset: 0}, BATCH_ID: {byteOffset: 12}},
        new Uint8Array(14)
      ),
      Tiles3DLoader
    )
  ).rejects.toThrow('BATCH_LENGTH');
});

test('point cloud parser derives colors from batch table dimensions', async () => {
  const binary = new Uint8Array(14);
  new Uint16Array(binary.buffer, 12, 1)[0] = 0;
  const tile = await parse(
    createPointCloudTile(
      {
        POINTS_LENGTH: 1,
        POSITION: {byteOffset: 0},
        BATCH_ID: {byteOffset: 12},
        BATCH_LENGTH: 1
      },
      binary,
      {dimensions: [[1, 0.5, 0]]}
    ),
    Tiles3DLoader
  );

  expect(Array.from(tile.batchIds)).toEqual([0]);
  expect(Array.from(tile.attributes.colors.value)).toEqual([255, 128, 0]);
});

test('point cloud parser validates Draco extension metadata before decoding', async () => {
  await expect(
    parse(
      createPointCloudTile(
        {
          POINTS_LENGTH: 1,
          extensions: {
            '3DTILES_draco_point_compression': {properties: {POSITION: 0}, byteOffset: 0}
          }
        },
        new Uint8Array(4)
      ),
      Tiles3DLoader
    )
  ).rejects.toThrow('Draco properties, byteOffset, and byteLength must be defined');
});
