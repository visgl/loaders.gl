// SPDX-License-Identifier: MIT
import {expect, test} from 'vitest';
import {STLLoaderWithParser} from '../../src/stl-loader';

const ascii =
  'solid sample\nfacet normal 0 0 1\nouter loop\nvertex 0 0 0\nvertex 1 0 0\nvertex 0 1 0\nendloop\nendfacet\nendsolid sample';
const encode = (text: string) => new TextEncoder().encode(text).buffer;

test('STL ASCII preserves triangles and normals', () => {
  const mesh = STLLoaderWithParser.parseSync(encode(ascii));
  expect(mesh.header?.vertexCount).toBe(3);
  expect(mesh.topology).toBe('triangle-list');
  expect(Array.from(mesh.attributes.POSITION.value)).toEqual([0, 0, 0, 1, 0, 0, 0, 1, 0]);
  expect(Array.from(mesh.attributes.NORMAL.value)).toEqual([0, 0, 1, 0, 0, 1, 0, 0, 1]);
});

test('STL binary header beginning solid is not mistaken for ASCII', () => {
  const data = new ArrayBuffer(134);
  new Uint8Array(data).set(new TextEncoder().encode('solid binary'));
  const view = new DataView(data);
  view.setUint32(80, 1, true);
  view.setFloat32(92, 1, true);
  view.setFloat32(108, 1, true);
  view.setFloat32(124, 1, true);
  const mesh = STLLoaderWithParser.parseSync(data);
  expect(mesh.loaderData?.format).toBe('binary');
  expect(mesh.header?.vertexCount).toBe(3);
  expect(Array.from(mesh.attributes.POSITION.value)).toEqual([0, 0, 0, 1, 0, 0, 0, 1, 0]);
  expect(() => STLLoaderWithParser.parseSync(data.slice(0, 133))).toThrow(/STL/);
  view.setFloat32(96, Infinity, true);
  expect(() => STLLoaderWithParser.parseSync(data)).toThrow(/non-finite/);
});

test.each([
  '',
  ascii.replace('endfacet', ''),
  ascii.replace('vertex 0 1 0', 'vertex NaN 1 0'),
  ascii.replace('endsolid sample', ''),
  ascii + '\ngarbage'
])('STL rejects malformed data %#', input => {
  expect(() => STLLoaderWithParser.parseSync(encode(input))).toThrow(/STL/);
});
