// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {XMLParser} from 'fast-xml-parser';

/** Numeric arrays supported by the VTK XML reader without precision loss. */
export type VTKXMLNumericArray =
  | Int8Array
  | Uint8Array
  | Int16Array
  | Uint16Array
  | Int32Array
  | Uint32Array
  | Float32Array
  | Float64Array
  | BigInt64Array
  | BigUint64Array;

/** A named VTK XML numeric array. */
export type VTKXMLArray = {
  /** DataArray name. */
  name: string;
  /** Values per tuple. */
  components: number;
  /** VTK scalar type. */
  type: string;
  /** Decoded values in the original numeric precision. */
  values: VTKXMLNumericArray;
};
/** One VTK XML piece and its geometry and attributes. */
export type VTKXMLPiece = {
  /** Declared point count. */
  numberOfPoints: number;
  /** Declared cell count. */
  numberOfCells: number;
  /** Point coordinate arrays. */
  points: VTKXMLArray[];
  /** Point attribute arrays. */
  pointData: VTKXMLArray[];
  /** Cell attribute arrays. */
  cellData: VTKXMLArray[];
  /** Cell connectivity arrays. */
  cells: VTKXMLArray[];
  /** Structured piece dimensions, when present. */
  dimensions?: [number, number, number];
};
/** Parsed VTK XML dataset. */
export type VTKXMLDataset = {
  /** VTK XML dataset kind. */
  type: 'ImageData' | 'UnstructuredGrid' | 'PolyData' | 'RectilinearGrid' | 'StructuredGrid';
  /** Byte order used by binary arrays. */
  byteOrder: 'LittleEndian' | 'BigEndian';
  /** Parsed pieces in document order. */
  pieces: VTKXMLPiece[];
};

/** Require a supported VTK XML construct. */
function check(value: unknown, message: string): asserts value {
  if (!value) throw new Error('VTK XML: ' + message);
}
/** Normalize optional singleton or repeated XML nodes. */
function asArray<T>(value: T | T[] | undefined): T[] {
  return value === undefined ? [] : Array.isArray(value) ? value : [value];
}
type Element = Record<string, any>;
const NUMERIC_TYPES: Record<
  string,
  {
    size: number;
    read: (view: DataView, offset: number, little: boolean) => number | bigint;
    create: (length: number) => VTKXMLNumericArray;
  }
> = {
  Int8: {size: 1, read: (v, o) => v.getInt8(o), create: n => new Int8Array(n)},
  UInt8: {size: 1, read: (v, o) => v.getUint8(o), create: n => new Uint8Array(n)},
  Int16: {size: 2, read: (v, o, l) => v.getInt16(o, l), create: n => new Int16Array(n)},
  UInt16: {size: 2, read: (v, o, l) => v.getUint16(o, l), create: n => new Uint16Array(n)},
  Int32: {size: 4, read: (v, o, l) => v.getInt32(o, l), create: n => new Int32Array(n)},
  UInt32: {size: 4, read: (v, o, l) => v.getUint32(o, l), create: n => new Uint32Array(n)},
  Float32: {size: 4, read: (v, o, l) => v.getFloat32(o, l), create: n => new Float32Array(n)},
  Float64: {size: 8, read: (v, o, l) => v.getFloat64(o, l), create: n => new Float64Array(n)},
  Int64: {size: 8, read: (v, o, l) => v.getBigInt64(o, l), create: n => new BigInt64Array(n)},
  UInt64: {size: 8, read: (v, o, l) => v.getBigUint64(o, l), create: n => new BigUint64Array(n)}
};
/** Decode a VTK inline binary DataArray from base64. */
function base64Bytes(encoded: string): Uint8Array {
  const clean = encoded.replace(/\s/g, '');
  check(
    /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(clean),
    'invalid base64'
  );
  // Browser and Node support atob; avoid Buffer to preserve browser compatibility.
  const decoded = atob(clean);
  return Uint8Array.from(decoded, character => character.charCodeAt(0));
}
/** Decode one VTK XML DataArray in ASCII or inline binary form. */
function decodeArray(node: Element, little: boolean, headerType: string): VTKXMLArray {
  const type = String(node.type ?? '');
  const numeric = NUMERIC_TYPES[type];
  check(numeric, 'unsupported DataArray type ' + type);
  const components = Number(node.NumberOfComponents ?? 1);
  check(
    Number.isSafeInteger(components) && components > 0 && components <= 64,
    'invalid component count'
  );
  const format = String(node.format ?? 'ascii').toLowerCase();
  const body = String(node['#text'] ?? '');
  let values: VTKXMLNumericArray;
  if (format === 'ascii') {
    const tokens = body.trim() ? body.trim().split(/\s+/) : [];
    check(
      tokens.length <= 100_000_000 && tokens.length % components === 0,
      'invalid ASCII array length'
    );
    values = numeric.create(tokens.length);
    for (let i = 0; i < tokens.length; i++) {
      const number =
        type.endsWith('64') && (type === 'Int64' || type === 'UInt64')
          ? BigInt(tokens[i])
          : Number(tokens[i]);
      check(typeof number === 'bigint' || Number.isFinite(number), 'invalid numeric token');
      (values as any)[i] = number;
    }
  } else if (format === 'binary') {
    const bytes = base64Bytes(body);
    check(headerType === 'UInt32' || headerType === 'UInt64', 'unsupported header_type');
    const headerSize = headerType === 'UInt64' ? 8 : 4;
    check(bytes.length >= headerSize, 'truncated binary header');
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const byteLength =
      headerSize === 8 ? Number(view.getBigUint64(0, little)) : view.getUint32(0, little);
    check(
      Number.isSafeInteger(byteLength) &&
        byteLength >= 0 &&
        byteLength <= 512 * 1024 * 1024 &&
        byteLength + headerSize === bytes.length &&
        byteLength % numeric.size === 0,
      'invalid binary payload length'
    );
    values = numeric.create(byteLength / numeric.size);
    for (let i = 0; i < values.length; i++) {
      (values as any)[i] = numeric.read(view, headerSize + i * numeric.size, little);
    }
    check(values.length % components === 0, 'binary component mismatch');
  } else {
    throw new Error('VTK XML: unsupported DataArray format ' + format);
  }
  return {name: String(node.Name ?? ''), components, type, values};
}
/** Decode all DataArray children of one XML section. */
function arrays(section: Element | undefined, little: boolean, header: string): VTKXMLArray[] {
  return asArray(section?.DataArray).map(node => decodeArray(node, little, header));
}
/** Convert an inclusive VTK extent to three dimension lengths. */
function extentDimensions(value: unknown): [number, number, number] | undefined {
  if (value === undefined) return undefined;
  const extent = String(value).trim().split(/\s+/).map(Number);
  check(extent.length === 6 && extent.every(Number.isSafeInteger), 'invalid extent');
  const dimensions: [number, number, number] = [
    extent[1] - extent[0] + 1,
    extent[3] - extent[2] + 1,
    extent[5] - extent[4] + 1
  ];
  check(
    dimensions.every(n => n > 0),
    'invalid extent dimensions'
  );
  return dimensions;
}
/**
 * Parse VTK XML (.vti, .vtu, .vtp, .vtr, .vts).
 * Supports ASCII and inline, uncompressed base64 binary arrays.
 * Explicitly rejects compressed and appended arrays until implemented.
 */
export function parseVTKXML(xml: string): VTKXMLDataset {
  check(xml.length <= 512 * 1024 * 1024, 'XML document too large');
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '',
    textNodeName: '#text',
    parseTagValue: false,
    parseAttributeValue: false,
    processEntities: false,
    trimValues: true
  });
  const root = parser.parse(xml)?.VTKFile as Element | undefined;
  check(root, 'missing VTKFile root');
  const type = String(root.type ?? '');
  check(
    ['ImageData', 'UnstructuredGrid', 'PolyData', 'RectilinearGrid', 'StructuredGrid'].includes(
      type
    ),
    'unsupported VTK dataset type'
  );
  check(!root.compressor, 'compressed arrays are not yet supported');
  check(!root.AppendedData, 'appended arrays are not yet supported');
  const byteOrder = root.byte_order ?? 'LittleEndian';
  check(byteOrder === 'LittleEndian' || byteOrder === 'BigEndian', 'invalid byte order');
  const little = byteOrder === 'LittleEndian';
  const header = String(root.header_type ?? 'UInt32');
  const dataset = root[type] as Element | undefined;
  check(dataset, 'missing dataset element');
  const pieces = asArray(dataset.Piece).map(
    (piece: Element): VTKXMLPiece => ({
      numberOfPoints: Number(piece.NumberOfPoints ?? 0),
      numberOfCells: Number(piece.NumberOfCells ?? 0),
      points: arrays(piece.Points, little, header),
      pointData: arrays(piece.PointData, little, header),
      cellData: arrays(piece.CellData, little, header),
      cells: [
        ...arrays(piece.Cells, little, header),
        ...arrays(piece.Verts, little, header),
        ...arrays(piece.Lines, little, header),
        ...arrays(piece.Polys, little, header),
        ...arrays(piece.Strips, little, header),
        ...arrays(piece.Coordinates, little, header)
      ],
      dimensions: extentDimensions(piece.Extent ?? dataset.WholeExtent)
    })
  );
  check(pieces.length > 0, 'no dataset pieces');
  for (const piece of pieces) {
    check(
      Number.isSafeInteger(piece.numberOfPoints) &&
        piece.numberOfPoints >= 0 &&
        Number.isSafeInteger(piece.numberOfCells) &&
        piece.numberOfCells >= 0,
      'invalid piece counts'
    );
  }
  return {type: type as VTKXMLDataset['type'], byteOrder, pieces};
}
