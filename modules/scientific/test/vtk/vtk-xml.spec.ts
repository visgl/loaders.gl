// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {parseVTKXML} from '../../src/vtk';

test('VTK XML unstructured grid ASCII connectivity and float64 precision', () => {
  const xml = `<?xml version="1.0"?>
<VTKFile type="UnstructuredGrid" version="1.0" byte_order="LittleEndian">
 <UnstructuredGrid><Piece NumberOfPoints="3" NumberOfCells="1">
 <Points><DataArray type="Float64" NumberOfComponents="3" format="ascii">0 0 0 1.25 0 0 0 1 0</DataArray></Points>
 <Cells>
 <DataArray type="Int32" Name="connectivity" format="ascii">0 1 2</DataArray>
 <DataArray type="Int32" Name="offsets" format="ascii">3</DataArray>
 <DataArray type="UInt8" Name="types" format="ascii">5</DataArray>
 </Cells>
 <PointData><DataArray type="Float32" Name="velocity" NumberOfComponents="3" format="ascii">1 0 0 0 1 0 0 0 1</DataArray></PointData>
 </Piece></UnstructuredGrid></VTKFile>`;
  const parsed = parseVTKXML(xml);
  expect(parsed.type).toBe('UnstructuredGrid');
  expect(parsed.pieces[0].points[0].values).toBeInstanceOf(Float64Array);
  expect(Array.from(parsed.pieces[0].cells[0].values)).toEqual([0, 1, 2]);
  expect(parsed.pieces[0].pointData[0].components).toBe(3);
});

test('VTK XML inline base64 binary with UInt32 byte header', () => {
  const bytes = new Uint8Array(12);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, 8, true);
  view.setFloat32(4, 2.5, true);
  view.setFloat32(8, 3.5, true);
  const base64 = btoa(String.fromCharCode(...bytes));
  const xml = `<VTKFile type="ImageData" byte_order="LittleEndian">
<ImageData WholeExtent="0 1 0 0 0 0"><Piece Extent="0 1 0 0 0 0">
<PointData><DataArray type="Float32" Name="temperature" format="binary">${base64}</DataArray></PointData>
</Piece></ImageData></VTKFile>`;
  const parsed = parseVTKXML(xml);
  expect(Array.from(parsed.pieces[0].pointData[0].values)).toEqual([2.5, 3.5]);
  expect(parsed.pieces[0].dimensions).toEqual([2, 1, 1]);
  expect(() => parseVTKXML(xml.replace('format="binary"', 'format="appended"'))).toThrow(
    /unsupported DataArray format/
  );
});

test('VTK XML preserves big-endian UInt64 values with a UInt64 byte header', () => {
  const bytes = new Uint8Array(16);
  const view = new DataView(bytes.buffer);
  view.setBigUint64(0, 8n, false);
  view.setBigUint64(8, 9007199254740993n, false);
  const encoded = btoa(String.fromCharCode(...bytes));
  const xml = `<VTKFile type="ImageData" byte_order="BigEndian" header_type="UInt64">
<ImageData WholeExtent="0 0 0 0 0 0"><Piece>
<PointData><DataArray type="UInt64" Name="ids" format="binary">${encoded}</DataArray></PointData>
</Piece></ImageData></VTKFile>`;
  const parsed = parseVTKXML(xml);
  expect(parsed.byteOrder).toBe('BigEndian');
  expect(parsed.pieces[0].pointData[0].values).toBeInstanceOf(BigUint64Array);
  expect(Array.from(parsed.pieces[0].pointData[0].values)).toEqual([9007199254740993n]);
  expect(parsed.pieces[0].dimensions).toEqual([1, 1, 1]);
});

test.each([
  ['missing root', '<Other/>', /missing VTKFile root/],
  ['unsupported dataset', '<VTKFile type="Other"/>', /unsupported VTK dataset type/],
  [
    'compression',
    '<VTKFile type="ImageData" compressor="zlib"><ImageData><Piece/></ImageData></VTKFile>',
    /compressed arrays/
  ],
  [
    'appended data',
    '<VTKFile type="ImageData"><AppendedData>data</AppendedData><ImageData><Piece/></ImageData></VTKFile>',
    /appended arrays/
  ],
  [
    'invalid byte order',
    '<VTKFile type="ImageData" byte_order="MiddleEndian"><ImageData><Piece/></ImageData></VTKFile>',
    /invalid byte order/
  ],
  ['missing dataset', '<VTKFile type="ImageData"/>', /missing dataset element/],
  [
    'missing pieces',
    '<VTKFile type="ImageData"><ImageData WholeExtent="0 0 0 0 0 0"/></VTKFile>',
    /no dataset pieces/
  ],
  [
    'negative count',
    '<VTKFile type="ImageData"><ImageData><Piece NumberOfPoints="-1"/></ImageData></VTKFile>',
    /invalid piece counts/
  ],
  [
    'invalid extent',
    '<VTKFile type="ImageData"><ImageData><Piece Extent="0 1 0"/></ImageData></VTKFile>',
    /invalid extent/
  ],
  [
    'unsupported array type',
    '<VTKFile type="ImageData"><ImageData><Piece><PointData><DataArray type="String">a</DataArray></PointData></Piece></ImageData></VTKFile>',
    /unsupported DataArray type/
  ],
  [
    'invalid ASCII token',
    '<VTKFile type="ImageData"><ImageData><Piece><PointData><DataArray type="Float32">bad</DataArray></PointData></Piece></ImageData></VTKFile>',
    /invalid numeric token/
  ],
  [
    'invalid base64',
    '<VTKFile type="ImageData"><ImageData><Piece><PointData><DataArray type="Float32" format="binary">!</DataArray></PointData></Piece></ImageData></VTKFile>',
    /invalid base64/
  ]
])('VTK XML rejects %s', (_name, xml, error) => {
  expect(() => parseVTKXML(xml)).toThrow(error);
});
