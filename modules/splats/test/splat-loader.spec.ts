// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {parse, parseSync} from '@loaders.gl/core';
import {SPLATLoader} from '@loaders.gl/splats';
import {SPLATLoaderWithParser} from '@loaders.gl/splats/splat-loader';

test('SPLATLoader parses raw Gaussian splats', async t => {
  const data = makeSPLATFixture();
  const table = await parse(data, SPLATLoader);

  t.equal(table.shape, 'arrow-table', 'returns MeshArrowTable');
  t.equal(table.topology, 'point-list', 'returns point-list topology');
  t.equal(table.data.numRows, 2, 'parses row count');
  t.equal(
    table.data.schema.metadata.get('loaders_gl.semantic_type'),
    'gaussian-splats',
    'adds Gaussian splat semantic metadata'
  );
  t.deepEqual(table.data.getChild('POSITION')?.get(0)?.toArray(), [1, 2, 3], 'parses position');
  t.equal(table.data.getChild('scale_0')?.get(1), 4, 'parses linear scale');
  t.ok(
    Math.abs(Number(table.data.getChild('opacity')?.get(0)) - 128 / 255) < 1e-6,
    'parses linear opacity'
  );
  t.equal(
    table.data.schema.fields
      .find(field => field.name === 'opacity')
      ?.metadata.get('loaders_gl.gaussian_splats.encoding'),
    'linear',
    'marks opacity as linear'
  );
  t.ok(Math.abs(Number(table.data.getChild('rot_0')?.get(0)) - 1) < 1e-6, 'normalizes rotation');

  const syncTable = parseSync(data, SPLATLoaderWithParser);
  t.equal(syncTable.data.numRows, 2, 'parser subpath supports parseSync');
  t.end();
});

test('SPLATLoader rejects invalid byte length', t => {
  t.throws(
    () => SPLATLoaderWithParser.parseSync(new ArrayBuffer(31)),
    /multiple of 32/,
    'rejects partial rows'
  );
  t.end();
});

/** Builds a deterministic two-row `.splat` fixture. */
function makeSPLATFixture(): ArrayBuffer {
  const data = new ArrayBuffer(64);
  writeSPLATRow(data, 0, [1, 2, 3], [0.5, 1, 2], [255, 0, 128, 128], [255, 128, 128, 128]);
  writeSPLATRow(data, 1, [-1, -2, -3], [4, 5, 6], [0, 255, 64, 255], [128, 255, 128, 128]);
  return data;
}

/** Writes one `.splat` fixture row. */
function writeSPLATRow(
  data: ArrayBuffer,
  rowIndex: number,
  position: [number, number, number],
  scale: [number, number, number],
  color: [number, number, number, number],
  rotation: [number, number, number, number]
): void {
  const dataView = new DataView(data);
  const byteOffset = rowIndex * 32;
  for (let component = 0; component < 3; component++) {
    dataView.setFloat32(byteOffset + component * 4, position[component], true);
    dataView.setFloat32(byteOffset + 12 + component * 4, scale[component], true);
    dataView.setUint8(byteOffset + 24 + component, color[component]);
  }
  dataView.setUint8(byteOffset + 27, color[3]);
  for (let component = 0; component < 4; component++) {
    dataView.setUint8(byteOffset + 28 + component, rotation[component]);
  }
}
