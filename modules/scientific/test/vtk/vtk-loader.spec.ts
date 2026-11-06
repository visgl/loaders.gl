// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import {test, expect} from 'vitest';
import {VTKLoaderWithParser} from '../../src/vtk-loader';

const legacy =
  '# vtk DataFile Version 3.0\nexample\nASCII\nDATASET POLYDATA\nPOINTS 3 float\n0 0 0 1 0 0 0 1 0\nPOLYGONS 1 4\n3 0 1 2';

test('VTK loader exposes existing legacy reader and validates connectivity', () => {
  const result = VTKLoaderWithParser.parseTextSync(legacy);
  expect('format' in result && result.format).toBe('legacy-ascii');
  expect(() => VTKLoaderWithParser.parseTextSync(legacy.replace('3 0 1 2', '3 0 1 3'))).toThrow(
    /vertex index/
  );
  expect(() =>
    VTKLoaderWithParser.parseTextSync(
      legacy + '\nPOINT_DATA 1\nSCALARS x float\nLOOKUP_TABLE default\n1'
    )
  ).toThrow(/attribute count/);
});

test('VTK loader exposes existing XML precision and attribute associations', () => {
  const result = VTKLoaderWithParser.parseTextSync(
    '<VTKFile type="UnstructuredGrid" byte_order="LittleEndian"><UnstructuredGrid><Piece NumberOfPoints="1" NumberOfCells="0"><Points><DataArray type="Float64" NumberOfComponents="3" format="ascii">1.123456789 2 3</DataArray></Points></Piece></UnstructuredGrid></VTKFile>'
  );
  expect('pieces' in result && result.pieces[0].points[0].values).toBeInstanceOf(Float64Array);
});

test('VTK metadata and parser subpath retain public input contracts', async () => {
  const {parse} = await import('@loaders.gl/core');
  const {VTKLoader} = await import('../../src/vtk-loader-types');
  const bytes = new TextEncoder().encode(legacy).buffer;
  expect('format' in (await parse(bytes, VTKLoader))).toBe(true);
  expect('format' in (await VTKLoaderWithParser.parse(bytes))).toBe(true);
  expect('format' in VTKLoaderWithParser.parseSync(bytes)).toBe(true);
  expect('format' in (await VTKLoaderWithParser.parseText(legacy))).toBe(true);
});
