import {expect, test} from 'vitest';
import {parse, parseSync} from '@loaders.gl/core';
import {SPLATLoader} from '@loaders.gl/splats';
import {SPLATLoaderWithParser} from '@loaders.gl/splats/splat-loader';
test('SPLATLoader parses raw Gaussian splats', async () => {
  const data = makeSPLATFixture();
  const table = await parse(data, SPLATLoader);
  expect(table.shape, 'returns MeshArrowTable').toBe('arrow-table');
  expect(table.topology, 'returns point-list topology').toBe('point-list');
  expect(table.data.numRows, 'parses row count').toBe(2);
  expect(
    table.data.schema.metadata.get('loaders_gl.semantic_type'),
    'adds Gaussian splat semantic metadata'
  ).toBe('gaussian-splats');
  expect(
    Array.from(table.data.getChild('POSITION')?.get(0)?.toArray() || []),
    'parses position'
  ).toEqual([1, 2, 3]);
  expect(table.data.getChild('scale_0')?.get(1), 'parses linear scale').toBe(4);
  expect(
    Math.abs(Number(table.data.getChild('opacity')?.get(0)) - 128 / 255) < 1e-6,
    'parses linear opacity'
  ).toBeTruthy();
  expect(
    table.data.schema.fields
      .find(field => field.name === 'opacity')
      ?.metadata.get('loaders_gl.gaussian_splats.encoding'),
    'marks opacity as linear'
  ).toBe('linear');
  expect(
    Math.abs(Number(table.data.getChild('rot_0')?.get(0)) - 1) < 1e-6,
    'normalizes rotation'
  ).toBeTruthy();
  const syncTable = parseSync(data, SPLATLoaderWithParser);
  expect(syncTable.data.numRows, 'parser subpath supports parseSync').toBe(2);
});
test('SPLATLoader rejects invalid byte length', () => {
  expect(
    () => SPLATLoaderWithParser.parseSync(new ArrayBuffer(31)),
    'rejects partial rows'
  ).toThrow(/multiple of 32/);
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
