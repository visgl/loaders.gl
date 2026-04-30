// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {parse, parseSync} from '@loaders.gl/core';
import {KSPLATLoader} from '@loaders.gl/splats';
import {KSPLATLoaderWithParser} from '@loaders.gl/splats/ksplat-loader';

const HEADER_BYTE_LENGTH = 4096;
const SECTION_HEADER_BYTE_LENGTH = 1024;
const BYTES_PER_SPLAT = 44;
const COMPRESSED_BYTES_PER_SPLAT = 24;

test('KSPLATLoader parses uncompressed GaussianSplats3D buffers', async t => {
  const data = makeKSPLATFixture();
  const table = await parse(data, KSPLATLoader);

  t.equal(table.shape, 'arrow-table', 'returns MeshArrowTable');
  t.equal(table.data.numRows, 2, 'parses row count');
  t.equal(
    table.data.schema.metadata.get('loaders_gl.gaussian_splats.source_format'),
    'ksplat',
    'adds source format metadata'
  );
  t.deepEqual(table.data.getChild('POSITION')?.get(1)?.toArray(), [4, 5, 6], 'parses position');
  t.equal(table.data.getChild('scale_2')?.get(0), 3, 'parses linear scale');
  t.ok(
    Math.abs(Number(table.data.getChild('opacity')?.get(1)) - 64 / 255) < 1e-6,
    'parses color alpha as opacity'
  );
  t.ok(Math.abs(Number(table.data.getChild('rot_0')?.get(0)) - 1) < 1e-6, 'parses rotation');

  const syncTable = parseSync(data, KSPLATLoaderWithParser);
  t.equal(syncTable.data.numRows, 2, 'parser subpath supports parseSync');
  t.end();
});

test('KSPLATLoader validates header and version', t => {
  t.throws(
    () => KSPLATLoaderWithParser.parseSync(new ArrayBuffer(128)),
    /4096-byte header/,
    'rejects missing header'
  );

  const data = makeKSPLATFixture();
  new DataView(data).setUint8(1, 0);
  t.throws(
    () => KSPLATLoaderWithParser.parseSync(data),
    /version 0.0 is not supported/,
    'rejects unsupported version'
  );
  t.end();
});

test('KSPLATLoader decodes compressed bucket-relative centers', t => {
  const table = KSPLATLoaderWithParser.parseSync(makeCompressedKSPLATFixture());

  t.deepEqual(
    table.data.getChild('POSITION')?.get(0)?.toArray(),
    [10, 20, 30],
    'decodes uint16 bucket-relative center'
  );
  t.equal(table.data.getChild('scale_1')?.get(0), 2, 'decodes half-float scale');
  t.ok(Math.abs(Number(table.data.getChild('rot_0')?.get(0)) - 1) < 1e-6, 'decodes rotation');
  t.end();
});

/** Builds a deterministic uncompressed two-row `.ksplat` fixture. */
function makeKSPLATFixture(): ArrayBuffer {
  const data = new ArrayBuffer(
    HEADER_BYTE_LENGTH + SECTION_HEADER_BYTE_LENGTH + BYTES_PER_SPLAT * 2
  );
  const dataView = new DataView(data);

  dataView.setUint8(0, 0);
  dataView.setUint8(1, 1);
  dataView.setUint32(4, 1, true);
  dataView.setUint32(8, 1, true);
  dataView.setUint32(12, 2, true);
  dataView.setUint32(16, 2, true);
  dataView.setUint16(20, 0, true);
  dataView.setFloat32(36, -1.5, true);
  dataView.setFloat32(40, 1.5, true);

  const sectionHeaderOffset = HEADER_BYTE_LENGTH;
  dataView.setUint32(sectionHeaderOffset + 0, 2, true);
  dataView.setUint32(sectionHeaderOffset + 4, 2, true);
  dataView.setUint16(sectionHeaderOffset + 40, 0, true);

  const splatDataOffset = HEADER_BYTE_LENGTH + SECTION_HEADER_BYTE_LENGTH;
  writeKSPLATRow(data, splatDataOffset, 0, [1, 2, 3], [1, 2, 3], [1, 0, 0, 0], [255, 128, 0, 255]);
  writeKSPLATRow(data, splatDataOffset, 1, [4, 5, 6], [4, 5, 6], [0, 1, 0, 0], [0, 64, 255, 64]);
  return data;
}

/** Builds a deterministic compressed one-row `.ksplat` fixture. */
function makeCompressedKSPLATFixture(): ArrayBuffer {
  const data = new ArrayBuffer(
    HEADER_BYTE_LENGTH + SECTION_HEADER_BYTE_LENGTH + 12 + COMPRESSED_BYTES_PER_SPLAT
  );
  const dataView = new DataView(data);

  dataView.setUint8(0, 0);
  dataView.setUint8(1, 1);
  dataView.setUint32(4, 1, true);
  dataView.setUint32(8, 1, true);
  dataView.setUint32(12, 1, true);
  dataView.setUint32(16, 1, true);
  dataView.setUint16(20, 1, true);
  dataView.setFloat32(36, -1.5, true);
  dataView.setFloat32(40, 1.5, true);

  const sectionHeaderOffset = HEADER_BYTE_LENGTH;
  dataView.setUint32(sectionHeaderOffset + 0, 1, true);
  dataView.setUint32(sectionHeaderOffset + 4, 1, true);
  dataView.setUint32(sectionHeaderOffset + 8, 1, true);
  dataView.setUint32(sectionHeaderOffset + 12, 1, true);
  dataView.setFloat32(sectionHeaderOffset + 16, 2, true);
  dataView.setUint16(sectionHeaderOffset + 20, 12, true);
  dataView.setUint32(sectionHeaderOffset + 24, 32767, true);
  dataView.setUint32(sectionHeaderOffset + 32, 1, true);
  dataView.setUint16(sectionHeaderOffset + 40, 0, true);

  const bucketOffset = HEADER_BYTE_LENGTH + SECTION_HEADER_BYTE_LENGTH;
  dataView.setFloat32(bucketOffset + 0, 10, true);
  dataView.setFloat32(bucketOffset + 4, 20, true);
  dataView.setFloat32(bucketOffset + 8, 30, true);

  const splatOffset = bucketOffset + 12;
  dataView.setUint16(splatOffset + 0, 32767, true);
  dataView.setUint16(splatOffset + 2, 32767, true);
  dataView.setUint16(splatOffset + 4, 32767, true);
  dataView.setUint16(splatOffset + 6, encodeFloat16(1), true);
  dataView.setUint16(splatOffset + 8, encodeFloat16(2), true);
  dataView.setUint16(splatOffset + 10, encodeFloat16(3), true);
  dataView.setUint16(splatOffset + 12, encodeFloat16(1), true);
  dataView.setUint16(splatOffset + 14, encodeFloat16(0), true);
  dataView.setUint16(splatOffset + 16, encodeFloat16(0), true);
  dataView.setUint16(splatOffset + 18, encodeFloat16(0), true);
  dataView.setUint8(splatOffset + 20, 255);
  dataView.setUint8(splatOffset + 21, 255);
  dataView.setUint8(splatOffset + 22, 255);
  dataView.setUint8(splatOffset + 23, 255);
  return data;
}

/** Writes one uncompressed `.ksplat` fixture row. */
function writeKSPLATRow(
  data: ArrayBuffer,
  splatDataOffset: number,
  rowIndex: number,
  position: [number, number, number],
  scale: [number, number, number],
  rotation: [number, number, number, number],
  color: [number, number, number, number]
): void {
  const dataView = new DataView(data);
  const byteOffset = splatDataOffset + rowIndex * BYTES_PER_SPLAT;
  for (let component = 0; component < 3; component++) {
    dataView.setFloat32(byteOffset + component * 4, position[component], true);
    dataView.setFloat32(byteOffset + 12 + component * 4, scale[component], true);
  }
  for (let component = 0; component < 4; component++) {
    dataView.setFloat32(byteOffset + 24 + component * 4, rotation[component], true);
    dataView.setUint8(byteOffset + 40 + component, color[component]);
  }
}

/** Encodes the finite fixture values needed by the compressed KSPLAT test as float16. */
function encodeFloat16(value: number): number {
  if (value === 0) {
    return 0;
  }
  const exponent = Math.floor(Math.log2(Math.abs(value)));
  const fraction = Math.round((Math.abs(value) / 2 ** exponent - 1) * 1024);
  return ((exponent + 15) << 10) | fraction;
}
