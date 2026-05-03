// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  Mesh,
  MeshAttribute,
  MeshAttributes,
  MeshArrowTable,
  TypedArray
} from '@loaders.gl/schema';
import {getMeshBoundingBox} from '@loaders.gl/schema-utils';
import * as arrow from 'apache-arrow';
import type {ParsePLYOptions} from './parse-ply';
import {parsePLYHeader} from './parse-ply';
import {getPLYSchema} from './get-ply-schema';
import type {PLYElement, PLYHeader, PLYMesh, PLYProperty} from './ply-types';

const PLY_END_HEADER_PATTERN = /end_header\s/;

/** Internal Arrow representation preserving one table per PLY element. */
export type PLYElementTables = {
  /** Parsed PLY header. */
  header: PLYHeader;
  /** Raw Arrow tables keyed by PLY element order. */
  elements: PLYElementTable[];
};

/** Raw Arrow table for one PLY element. */
export type PLYElementTable = {
  /** PLY element definition. */
  element: PLYElement;
  /** Raw property table for the element. */
  table: arrow.Table;
};

type PropertyCollector = {
  property: PLYProperty;
  values: number[];
  offsets?: number[];
};

type ElementCollector = {
  element: PLYElement;
  properties: PropertyCollector[];
};

/** Parse a full PLY payload into raw Arrow element tables. */
export function parsePLYToElementTables(
  data: ArrayBuffer | string,
  options: ParsePLYOptions = {}
): PLYElementTables {
  const header = parsePLYHeader(data, options);
  if (header.format === 'ascii') {
    const text = data instanceof ArrayBuffer ? new TextDecoder().decode(data) : data;
    return parseASCIIPLYToElementTables(text, header);
  }

  if (!(data instanceof ArrayBuffer)) {
    throw new Error('Binary PLY parsing requires an ArrayBuffer.');
  }
  return parseBinaryPLYToElementTables(data, header);
}

/** Convert raw PLY element tables into the public Mesh Arrow table shape. */
export function convertPLYElementTablesToMeshArrowTable(
  elementTables: PLYElementTables
): MeshArrowTable {
  const mesh = convertPLYElementTablesToMesh(elementTables);
  return convertPLYMeshToArrowTable(mesh);
}

/** Convert raw PLY element tables into the legacy Mesh shape. */
export function convertPLYElementTablesToMesh(elementTables: PLYElementTables): PLYMesh {
  const attributes = getMeshAttributesFromPLYElementTables(elementTables);
  const indices = getMeshIndicesFromPLYElementTables(elementTables);
  const boundingBox = getMeshBoundingBox(attributes);
  const vertexCount = attributes.POSITION?.value.length ? attributes.POSITION.value.length / 3 : 0;
  const isTriangles = Boolean(indices?.value.length);
  const mode = isTriangles ? 4 : 0;
  const topology = isTriangles ? 'triangle-list' : 'point-list';
  const schema = getPLYSchema(elementTables.header, attributes);

  return {
    loader: 'ply',
    loaderData: elementTables.header,
    header: {
      vertexCount,
      boundingBox
    },
    schema,
    attributes,
    indices: indices || {value: new Uint32Array(0), size: 0},
    mode,
    topology
  };
}

/** Parse an ASCII PLY payload into raw Arrow element tables. */
function parseASCIIPLYToElementTables(data: string, header: PLYHeader): PLYElementTables {
  const collector = createElementTablesCollector(header);
  const body = getPLYTextBody(data);
  const lines = body.split('\n');
  let elementIndex = 0;
  let elementRowIndex = 0;

  for (const sourceLine of lines) {
    const line = sourceLine.trim();
    if (line === '') {
      continue;
    }
    while (
      elementIndex < header.elements.length &&
      elementRowIndex >= header.elements[elementIndex].count
    ) {
      elementIndex++;
      elementRowIndex = 0;
    }
    if (elementIndex >= header.elements.length) {
      break;
    }
    appendASCIIElementRow(collector[elementIndex], line);
    elementRowIndex++;
  }

  return {header, elements: collector.map(makePLYElementTable)};
}

/** Parse a binary PLY payload into raw Arrow element tables. */
function parseBinaryPLYToElementTables(data: ArrayBuffer, header: PLYHeader): PLYElementTables {
  const collector = createElementTablesCollector(header);
  const dataView = new DataView(data, header.headerLength || 0);
  const littleEndian = header.format !== 'binary_big_endian';
  let byteOffset = 0;

  for (let elementIndex = 0; elementIndex < header.elements.length; elementIndex++) {
    const element = header.elements[elementIndex];
    for (let rowIndex = 0; rowIndex < element.count; rowIndex++) {
      byteOffset += appendBinaryElementRow(
        collector[elementIndex],
        dataView,
        byteOffset,
        littleEndian
      );
    }
  }

  return {header, elements: collector.map(makePLYElementTable)};
}

/** Create mutable collectors for all PLY element properties. */
function createElementTablesCollector(header: PLYHeader): ElementCollector[] {
  return header.elements.map(element => ({
    element,
    properties: element.properties.map(property => ({
      property,
      values: [],
      offsets: property.type === 'list' ? [0] : undefined
    }))
  }));
}

/** Append one ASCII row to an element collector. */
function appendASCIIElementRow(collector: ElementCollector, line: string): void {
  const values = line.split(/\s+/);
  let valueIndex = 0;

  for (const propertyCollector of collector.properties) {
    const property = propertyCollector.property;
    if (property.type === 'list') {
      const count = parseASCIINumber(values[valueIndex++], property.countType!);
      for (let listIndex = 0; listIndex < count; listIndex++) {
        propertyCollector.values.push(parseASCIINumber(values[valueIndex++], property.itemType!));
      }
      propertyCollector.offsets!.push(propertyCollector.values.length);
    } else {
      propertyCollector.values.push(parseASCIINumber(values[valueIndex++], property.type));
    }
  }
}

/** Append one binary row to an element collector and return consumed bytes. */
function appendBinaryElementRow(
  collector: ElementCollector,
  dataView: DataView,
  byteOffset: number,
  littleEndian: boolean
): number {
  let localOffset = 0;

  for (const propertyCollector of collector.properties) {
    const property = propertyCollector.property;
    if (property.type === 'list') {
      const [count, countByteLength] = readBinaryNumber(
        dataView,
        byteOffset + localOffset,
        property.countType!,
        littleEndian
      );
      localOffset += countByteLength;
      for (let listIndex = 0; listIndex < count; listIndex++) {
        const [value, valueByteLength] = readBinaryNumber(
          dataView,
          byteOffset + localOffset,
          property.itemType!,
          littleEndian
        );
        propertyCollector.values.push(value);
        localOffset += valueByteLength;
      }
      propertyCollector.offsets!.push(propertyCollector.values.length);
    } else {
      const [value, valueByteLength] = readBinaryNumber(
        dataView,
        byteOffset + localOffset,
        property.type,
        littleEndian
      );
      propertyCollector.values.push(value);
      localOffset += valueByteLength;
    }
  }

  return localOffset;
}

/** Convert one element collector into an Arrow table. */
function makePLYElementTable(collector: ElementCollector): PLYElementTable {
  const fields: arrow.Field[] = [];
  const columns: Record<string, arrow.Vector> = {};

  for (const propertyCollector of collector.properties) {
    const column = makePLYPropertyVector(propertyCollector);
    columns[propertyCollector.property.name] = column;
    fields.push(new arrow.Field(propertyCollector.property.name, column.type, false));
  }

  return {
    element: collector.element,
    table: new arrow.Table(new arrow.Schema(fields), columns)
  };
}

/** Return a raw Arrow vector for one PLY property. */
function makePLYPropertyVector(collector: PropertyCollector): arrow.Vector {
  const property = collector.property;
  if (property.type === 'list') {
    return makeListVector(
      property.itemType!,
      collector.values,
      Int32Array.from(collector.offsets || [0])
    );
  }
  return arrow.makeVector(getTypedArray(collector.values, property.type));
}

/** Return the Mesh attributes represented by the PLY vertex table. */
function getMeshAttributesFromPLYElementTables(elementTables: PLYElementTables): MeshAttributes {
  const vertexTable = getPLYElementTable(elementTables, 'vertex');
  const attributes: MeshAttributes = {};
  if (!vertexTable) {
    return attributes;
  }

  const position = makeFixedSizeListAttribute(vertexTable.table, ['x', 'y', 'z'], 'float');
  if (position) {
    attributes.POSITION = position;
  }
  const normal = makeFixedSizeListAttribute(vertexTable.table, ['nx', 'ny', 'nz'], 'float');
  if (normal) {
    attributes.NORMAL = normal;
  }
  const textureCoordinates = makeFixedSizeListAttribute(vertexTable.table, ['s', 't'], 'float');
  if (textureCoordinates) {
    attributes.TEXCOORD_0 = textureCoordinates;
  }
  const color = makeFixedSizeListAttribute(vertexTable.table, ['red', 'green', 'blue'], 'uchar');
  if (color) {
    attributes.COLOR_0 = {...color, normalized: true};
  }

  const packedPropertyNames = new Set([
    'x',
    'y',
    'z',
    'nx',
    'ny',
    'nz',
    's',
    't',
    'red',
    'green',
    'blue'
  ]);
  for (const property of vertexTable.element.properties) {
    if (property.type === 'list' || packedPropertyNames.has(property.name)) {
      continue;
    }
    const column = vertexTable.table.getChild(property.name);
    if (column) {
      attributes[property.name] = {
        value: getVectorValues(column) as TypedArray,
        size: 1
      };
    }
  }

  return attributes;
}

/** Return triangulated mesh indices represented by the face table. */
function getMeshIndicesFromPLYElementTables(
  elementTables: PLYElementTables
): MeshAttribute | undefined {
  const faceTable = getPLYElementTable(elementTables, 'face');
  const indicesColumn =
    faceTable?.table.getChild('vertex_indices') || faceTable?.table.getChild('vertex_index');
  if (!indicesColumn) {
    return undefined;
  }

  const indices: number[] = [];
  for (let rowIndex = 0; rowIndex < indicesColumn.length; rowIndex++) {
    const vertexIndices = indicesColumn.get(rowIndex) as ArrayLike<number> | null;
    if (!vertexIndices) {
      continue;
    }
    if (vertexIndices.length === 3) {
      indices.push(
        getArrayLikeValue(vertexIndices, 0),
        getArrayLikeValue(vertexIndices, 1),
        getArrayLikeValue(vertexIndices, 2)
      );
    } else if (vertexIndices.length === 4) {
      indices.push(
        getArrayLikeValue(vertexIndices, 0),
        getArrayLikeValue(vertexIndices, 1),
        getArrayLikeValue(vertexIndices, 3)
      );
      indices.push(
        getArrayLikeValue(vertexIndices, 1),
        getArrayLikeValue(vertexIndices, 2),
        getArrayLikeValue(vertexIndices, 3)
      );
    }
  }

  return indices.length > 0 ? {value: new Uint32Array(indices), size: 1} : undefined;
}

/** Return one value from an Array-like object or Arrow vector. */
function getArrayLikeValue(values: ArrayLike<number>, index: number): number {
  return 'get' in values && typeof values.get === 'function'
    ? Number(values.get(index))
    : Number(values[index]);
}

/** Convert a Mesh into the public Mesh Arrow table shape. */
function convertPLYMeshToArrowTable(mesh: Mesh): MeshArrowTable {
  const fields: arrow.Field[] = [];
  const columns: Record<string, arrow.Vector> = {};
  const attributeNames = getOrderedAttributeNames(mesh.attributes);

  for (const attributeName of attributeNames) {
    const attribute = mesh.attributes[attributeName];
    const column = makeMeshAttributeVector(attribute);
    columns[attributeName] = column;
    fields.push(getMeshAttributeField(mesh, attributeName, column));

    if (attributeName === 'POSITION' && mesh.indices?.value.length) {
      const indicesColumn = makeMeshIndicesVector(mesh.indices.value, column.length);
      columns.indices = indicesColumn;
      fields.push(new arrow.Field('indices', indicesColumn.type, true));
    }
  }

  const metadata = getArrowMetadata({
    ...mesh.schema.metadata,
    topology: mesh.topology,
    mode: String(mesh.mode),
    boundingBox: mesh.header?.boundingBox ? JSON.stringify(mesh.header.boundingBox) : undefined
  });
  const arrowSchema = new arrow.Schema(fields, metadata);

  return {
    shape: 'arrow-table',
    schema: mesh.schema,
    data: new arrow.Table(arrowSchema, columns),
    topology: mesh.topology,
    indices: mesh.indices?.value.length ? mesh.indices : undefined
  };
}

/** Return a mesh attribute vector. */
function makeMeshAttributeVector(attribute: MeshAttribute): arrow.Vector {
  const {value, size} = attribute;
  if (size === 1) {
    return arrow.makeVector(value);
  }

  const values = arrow.makeVector(value);
  const child = values.data[0];
  const type = new arrow.FixedSizeList(size, new arrow.Field('value', child.type, false));
  const data = new arrow.Data(type, 0, value.length / size, 0, {}, [child]);
  return new arrow.Vector([data]);
}

/** Return a Mesh Arrow field, preserving PLY schema field metadata where available. */
function getMeshAttributeField(
  mesh: Mesh,
  attributeName: string,
  column: arrow.Vector
): arrow.Field {
  const field = mesh.schema.fields.find(schemaField => schemaField.name === attributeName);
  return new arrow.Field(attributeName, column.type, false, getArrowMetadata(field?.metadata));
}

/** Return an IndexedMesh indices column with the full index list stored in row 0. */
function makeMeshIndicesVector(indices: MeshAttribute['value'], vertexCount: number): arrow.Vector {
  const values = indices instanceof Int32Array ? indices : Int32Array.from(indices);
  const valueOffsets = new Int32Array(vertexCount + 1);
  if (vertexCount > 0) {
    valueOffsets.fill(values.length, 1);
  }

  const nullBitmap = new Uint8Array(Math.ceil(vertexCount / 8));
  if (vertexCount > 0) {
    nullBitmap[0] = 1;
  }

  const type = new arrow.List(new arrow.Field('item', new arrow.Int32(), false));
  const valuesData = new arrow.Data<arrow.Int32>(type.children[0].type, 0, values.length, 0, {
    [arrow.BufferType.DATA]: values
  });
  const indicesData = new arrow.Data<arrow.List<arrow.Int32>>(
    type,
    0,
    vertexCount,
    Math.max(0, vertexCount - 1),
    {
      [arrow.BufferType.OFFSET]: valueOffsets,
      [arrow.BufferType.VALIDITY]: nullBitmap
    },
    [valuesData]
  );
  return new arrow.Vector([indicesData]);
}

/** Return a fixed-size list mesh attribute from separate scalar PLY columns. */
function makeFixedSizeListAttribute(
  table: arrow.Table,
  columnNames: string[],
  preferredType: string
): MeshAttribute | null {
  const columns = columnNames.map(columnName => table.getChild(columnName));
  if (columns.some(column => !column)) {
    return null;
  }

  const rowCount = table.numRows;
  const values =
    preferredType === 'uchar'
      ? new Uint8Array(rowCount * columnNames.length)
      : new Float32Array(rowCount * columnNames.length);
  for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
    for (let componentIndex = 0; componentIndex < columns.length; componentIndex++) {
      values[rowIndex * columns.length + componentIndex] = Number(
        columns[componentIndex]!.get(rowIndex) ?? 0
      );
    }
  }

  return {value: values, size: columnNames.length};
}

/** Return a PLY element table by name. */
function getPLYElementTable(
  elementTables: PLYElementTables,
  elementName: string
): PLYElementTable | undefined {
  return elementTables.elements.find(elementTable => elementTable.element.name === elementName);
}

/** Return mesh attributes in stable public order. */
function getOrderedAttributeNames(attributes: MeshAttributes): string[] {
  const firstNames = ['POSITION', 'indices'];
  return [
    ...firstNames.filter(attributeName => attributeName in attributes),
    ...Object.keys(attributes).filter(attributeName => !firstNames.includes(attributeName))
  ];
}

/** Return a vector's backing values. */
function getVectorValues(vector: arrow.Vector): TypedArray {
  const data = vector.data[0];
  return data.values as TypedArray;
}

/** Return a PLY text body after the header terminator. */
function getPLYTextBody(data: string): string {
  const match = PLY_END_HEADER_PATTERN.exec(data);
  return match ? data.slice(match.index + match[0].length) : '';
}

/** Return an Arrow list vector from value offsets and child values. */
function makeListVector(
  typeName: string,
  values: number[],
  valueOffsets: Int32Array
): arrow.Vector {
  const childType = getArrowType(typeName);
  const type = new arrow.List(new arrow.Field('item', childType, false));
  const typedValues = getTypedArray(values, typeName);
  const valuesData = new arrow.Data(childType, 0, typedValues.length, 0, {
    [arrow.BufferType.DATA]: typedValues
  });
  const listData = new arrow.Data(
    type,
    0,
    valueOffsets.length - 1,
    0,
    {[arrow.BufferType.OFFSET]: valueOffsets},
    [valuesData]
  );
  return new arrow.Vector([listData]);
}

/** Return a typed array for one PLY scalar type. */
function getTypedArray(values: number[], type: string): TypedArray {
  switch (type) {
    case 'int8':
    case 'char':
      return Int8Array.from(values);
    case 'uint8':
    case 'uchar':
      return Uint8Array.from(values);
    case 'int16':
    case 'short':
      return Int16Array.from(values);
    case 'uint16':
    case 'ushort':
      return Uint16Array.from(values);
    case 'int32':
    case 'int':
      return Int32Array.from(values);
    case 'uint32':
    case 'uint':
      return Uint32Array.from(values);
    case 'float64':
    case 'double':
      return Float64Array.from(values);
    case 'float32':
    case 'float':
    default:
      return Float32Array.from(values);
  }
}

/** Return an Arrow scalar type for one PLY scalar type. */
function getArrowType(type: string): arrow.DataType {
  switch (type) {
    case 'int8':
    case 'char':
      return new arrow.Int8();
    case 'uint8':
    case 'uchar':
      return new arrow.Uint8();
    case 'int16':
    case 'short':
      return new arrow.Int16();
    case 'uint16':
    case 'ushort':
      return new arrow.Uint16();
    case 'int32':
    case 'int':
      return new arrow.Int32();
    case 'uint32':
    case 'uint':
      return new arrow.Uint32();
    case 'float64':
    case 'double':
      return new arrow.Float64();
    case 'float32':
    case 'float':
    default:
      return new arrow.Float32();
  }
}

/** Parse one ASCII scalar value. */
function parseASCIINumber(value: string, type: string): number {
  switch (type) {
    case 'char':
    case 'uchar':
    case 'short':
    case 'ushort':
    case 'int':
    case 'uint':
    case 'int8':
    case 'uint8':
    case 'int16':
    case 'uint16':
    case 'int32':
    case 'uint32':
      return parseInt(value, 10);
    case 'float':
    case 'double':
    case 'float32':
    case 'float64':
      return parseFloat(value);
    default:
      throw new Error(type);
  }
}

/** Read one binary scalar value and its byte length. */
function readBinaryNumber(
  dataView: DataView,
  byteOffset: number,
  type: string,
  littleEndian: boolean
): [number, number] {
  switch (type) {
    case 'int8':
    case 'char':
      return [dataView.getInt8(byteOffset), 1];
    case 'uint8':
    case 'uchar':
      return [dataView.getUint8(byteOffset), 1];
    case 'int16':
    case 'short':
      return [dataView.getInt16(byteOffset, littleEndian), 2];
    case 'uint16':
    case 'ushort':
      return [dataView.getUint16(byteOffset, littleEndian), 2];
    case 'int32':
    case 'int':
      return [dataView.getInt32(byteOffset, littleEndian), 4];
    case 'uint32':
    case 'uint':
      return [dataView.getUint32(byteOffset, littleEndian), 4];
    case 'float32':
    case 'float':
      return [dataView.getFloat32(byteOffset, littleEndian), 4];
    case 'float64':
    case 'double':
      return [dataView.getFloat64(byteOffset, littleEndian), 8];
    default:
      throw new Error(type);
  }
}

/** Convert optional metadata to Arrow metadata. */
function getArrowMetadata(
  metadata: Record<string, string | undefined> | undefined
): Map<string, string> {
  return new Map(
    Object.entries(metadata || {}).filter(
      (entry): entry is [string, string] => entry[1] !== undefined
    )
  );
}
