// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {parse} from '@loaders.gl/core';
import {GZipCompression, ZstdCompression} from '@loaders.gl/compression';
import {SPZLoader} from '@loaders.gl/splats';
import type {GaussianSplats} from '@loaders.gl/splats';
import {SPZLoaderWithParser} from '@loaders.gl/splats/spz-loader';
import {ZstdCodec} from 'zstd-codec';

const modules = {'zstd-codec': ZstdCodec};

test('SPZLoader parses Niantic Spatial v4 Gaussian splats', async t => {
  const data = await makeSPZFixture();
  const table = await parse(data, SPZLoader, {modules});

  t.equal(table.shape, 'arrow-table', 'returns MeshArrowTable');
  t.equal(table.topology, 'point-list', 'returns point-list topology');
  t.equal(table.data.numRows, 2, 'parses row count');
  t.equal(
    table.data.schema.metadata.get('loaders_gl.gaussian_splats.source_format'),
    'spz',
    'adds source format metadata'
  );
  t.deepEqual(table.data.getChild('POSITION')?.get(0)?.toArray(), [1, 2, -3], 'parses position');
  t.ok(Math.abs(Number(table.data.getChild('scale_1')?.get(0)) - 1) < 1e-6, 'decodes scale');
  t.ok(
    Math.abs(Number(table.data.getChild('opacity')?.get(1)) - 64 / 255) < 1e-6,
    'decodes linear opacity'
  );
  t.ok(
    Math.abs(Number(table.data.getChild('f_dc_0')?.get(0)) - (140 / 255 - 0.5) / 0.15) < 1e-6,
    'decodes SPZ DC coefficient'
  );
  t.ok(Math.abs(Number(table.data.getChild('rot_0')?.get(0)) - 1) < 1e-6, 'decodes rotation');

  const directTable = await SPZLoaderWithParser.parse(data, {modules});
  t.equal(directTable.data.numRows, 2, 'parser subpath supports async parse');
  t.end();
});

test('SPZLoader parses Spark legacy LoD SPZ', async t => {
  const data = makeSparkLegacySPZFixture();
  const table = await parse(data, SPZLoader);

  t.equal(table.shape, 'arrow-table', 'returns MeshArrowTable by default');
  t.equal(table.data.numRows, 3, 'parses row count');
  t.deepEqual(table.data.getChild('POSITION')?.get(0)?.toArray(), [1, 2, -3], 'parses position');
  t.ok(
    Math.abs(Number(table.data.getChild('opacity')?.get(0)) - (128 / 255) * 2) < 1e-6,
    'decodes Spark LoD opacity domain'
  );
  t.deepEqual(Array.from((table.loaderData as any).childCounts), [2, 0, 0], 'decodes child counts');
  t.deepEqual(Array.from((table.loaderData as any).childStarts), [1, 0, 0], 'decodes child starts');

  const splats = (await SPZLoaderWithParser.parse(data, {
    splats: {shape: 'gaussian-splats'}
  })) as GaussianSplats;
  t.equal(splats.splatCount, 3, 'direct decoded shape returns splat values');
  t.deepEqual(
    Array.from(splats.loaderData?.childCounts as Uint16Array),
    [2, 0, 0],
    'direct decoded shape preserves child counts'
  );
  t.end();
});

test('SPZLoader validates header', async t => {
  await t.rejects(
    () => SPZLoaderWithParser.parse(new ArrayBuffer(8), {modules}),
    /16-byte SPZ header/,
    'rejects missing header'
  );

  const data = await makeSPZFixture();
  new DataView(data).setUint32(4, 5, true);
  await t.rejects(
    () => SPZLoaderWithParser.parse(data, {modules}),
    /version 5 is not supported/,
    'rejects unsupported version'
  );
  t.end();
});

/** Builds a deterministic two-row SPZ v4 fixture with compressed streams. */
async function makeSPZFixture(): Promise<ArrayBuffer> {
  const streams = [
    makePositionStream(),
    new Uint8Array([128, 64]),
    new Uint8Array([140, 128, 128, 128, 255, 0]),
    makeScaleStream(),
    makeRotationStream()
  ];
  const compression = new ZstdCompression({modules});
  await compression.preload(modules);
  const compressedStreams = streams.map(
    stream => new Uint8Array(compression.compressSync(stream.buffer))
  );
  const headerByteLength = 32;
  const tocByteLength = compressedStreams.length * 16;
  const byteLength =
    headerByteLength +
    tocByteLength +
    compressedStreams.reduce((length, stream) => length + stream.byteLength, 0);
  const data = new ArrayBuffer(byteLength);
  const dataView = new DataView(data);
  const bytes = new Uint8Array(data);

  dataView.setUint32(0, 0x5053474e, true);
  dataView.setUint32(4, 4, true);
  dataView.setUint32(8, 2, true);
  dataView.setUint8(12, 0);
  dataView.setUint8(13, 12);
  dataView.setUint8(14, 0);
  dataView.setUint8(15, compressedStreams.length);
  dataView.setUint32(16, headerByteLength, true);

  let compressedOffset = headerByteLength + tocByteLength;
  for (let streamIndex = 0; streamIndex < compressedStreams.length; streamIndex++) {
    const tocOffset = headerByteLength + streamIndex * 16;
    dataView.setBigUint64(tocOffset, BigInt(compressedStreams[streamIndex].byteLength), true);
    dataView.setBigUint64(tocOffset + 8, BigInt(streams[streamIndex].byteLength), true);
    bytes.set(compressedStreams[streamIndex], compressedOffset);
    compressedOffset += compressedStreams[streamIndex].byteLength;
  }

  return data;
}

/** Builds packed 24-bit fixed-point position fixture bytes. */
function makePositionStream(): Uint8Array {
  const positions = new Uint8Array(18);
  writeFixed24(positions, 0, 1 * 4096);
  writeFixed24(positions, 3, 2 * 4096);
  writeFixed24(positions, 6, -3 * 4096);
  writeFixed24(positions, 9, 4 * 4096);
  writeFixed24(positions, 12, 5 * 4096);
  writeFixed24(positions, 15, 6 * 4096);
  return positions;
}

/** Writes one signed little-endian 24-bit fixture value. */
function writeFixed24(bytes: Uint8Array, byteOffset: number, value: number): void {
  bytes[byteOffset + 0] = value & 0xff;
  bytes[byteOffset + 1] = (value >> 8) & 0xff;
  bytes[byteOffset + 2] = (value >> 16) & 0xff;
}

/** Builds packed log-scale fixture bytes. */
function makeScaleStream(): Uint8Array {
  return new Uint8Array([
    encodeScale(2),
    encodeScale(1),
    encodeScale(0.5),
    encodeScale(3),
    encodeScale(4),
    encodeScale(5)
  ]);
}

/** Encodes a linear scale fixture value as an SPZ log-scale byte. */
function encodeScale(value: number): number {
  return Math.round((Math.log(value) + 10) * 16);
}

/** Builds packed smallest-three quaternion fixture bytes. */
function makeRotationStream(): Uint8Array {
  const rotations = new Uint8Array(8);
  rotations.set(encodeQuaternionSmallestThree([0, 0, 0, 1]), 0);
  rotations.set(encodeQuaternionSmallestThree([1, 0, 0, 0]), 4);
  return rotations;
}

/** Builds a deterministic Spark legacy gzip SPZ fixture with LoD child metadata. */
function makeSparkLegacySPZFixture(): ArrayBuffer {
  const splatCount = 3;
  const headerByteLength = 16;
  const byteLength =
    headerByteLength +
    splatCount * 9 +
    splatCount +
    splatCount * 3 +
    splatCount * 3 +
    splatCount * 4 +
    splatCount * 2 +
    splatCount * 4;
  const data = new ArrayBuffer(byteLength);
  const dataView = new DataView(data);
  const bytes = new Uint8Array(data);

  dataView.setUint32(0, 0x5053474e, true);
  dataView.setUint32(4, 3, true);
  dataView.setUint32(8, splatCount, true);
  dataView.setUint8(12, 0);
  dataView.setUint8(13, 12);
  dataView.setUint8(14, 0x80);
  dataView.setUint8(15, 0);

  let byteOffset = headerByteLength;
  const positions = new Uint8Array(splatCount * 9);
  writeFixed24(positions, 0, 1 * 4096);
  writeFixed24(positions, 3, 2 * 4096);
  writeFixed24(positions, 6, -3 * 4096);
  writeFixed24(positions, 9, 4 * 4096);
  writeFixed24(positions, 12, 5 * 4096);
  writeFixed24(positions, 15, 6 * 4096);
  writeFixed24(positions, 18, 7 * 4096);
  writeFixed24(positions, 21, 8 * 4096);
  writeFixed24(positions, 24, 9 * 4096);
  bytes.set(positions, byteOffset);
  byteOffset += positions.byteLength;

  bytes.set(new Uint8Array([128, 64, 32]), byteOffset);
  byteOffset += splatCount;

  bytes.set(new Uint8Array([140, 128, 128, 128, 255, 0, 0, 128, 255]), byteOffset);
  byteOffset += splatCount * 3;

  bytes.set(
    new Uint8Array([
      encodeScale(2),
      encodeScale(1),
      encodeScale(0.5),
      encodeScale(3),
      encodeScale(4),
      encodeScale(5),
      encodeScale(0.25),
      encodeScale(0.75),
      encodeScale(1.25)
    ]),
    byteOffset
  );
  byteOffset += splatCount * 3;

  bytes.set(encodeQuaternionSmallestThree([0, 0, 0, 1]), byteOffset);
  bytes.set(encodeQuaternionSmallestThree([1, 0, 0, 0]), byteOffset + 4);
  bytes.set(encodeQuaternionSmallestThree([0, 1, 0, 0]), byteOffset + 8);
  byteOffset += splatCount * 4;

  dataView.setUint16(byteOffset + 0, 2, true);
  dataView.setUint16(byteOffset + 2, 0, true);
  dataView.setUint16(byteOffset + 4, 0, true);
  byteOffset += splatCount * 2;

  dataView.setUint32(byteOffset + 0, 1, true);
  dataView.setUint32(byteOffset + 4, 0, true);
  dataView.setUint32(byteOffset + 8, 0, true);

  const compression = new GZipCompression();
  return compression.compressSync(data);
}

/** Encodes one `[x, y, z, w]` quaternion as SPZ smallest-three bytes. */
function encodeQuaternionSmallestThree(quaternion: [number, number, number, number]): Uint8Array {
  let largestComponent = 0;
  for (let component = 1; component < 4; component++) {
    if (Math.abs(quaternion[component]) > Math.abs(quaternion[largestComponent])) {
      largestComponent = component;
    }
  }

  const negate = quaternion[largestComponent] < 0;
  let packed = largestComponent;
  for (let component = 0; component < 4; component++) {
    if (component !== largestComponent) {
      const isNegative = quaternion[component] < 0 !== negate;
      const magnitude = Math.round(
        (((1 << 9) - 1) * Math.abs(quaternion[component])) / Math.SQRT1_2
      );
      packed = (packed << 10) | (Number(isNegative) << 9) | magnitude;
    }
  }

  return new Uint8Array([
    packed & 0xff,
    (packed >>> 8) & 0xff,
    (packed >>> 16) & 0xff,
    (packed >>> 24) & 0xff
  ]);
}
