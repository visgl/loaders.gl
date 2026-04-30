// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// PLY Loader, adapted from THREE.js (MIT license)
//
// Attributions per original THREE.js source file:
//
// @author Wei Meng / http://about.me/menway
//
// Description: A loader for PLY ASCII files (known as the Polygon File Format
// or the Stanford Triangle Format).
//
// Limitations: ASCII decoding assumes file is UTF-8.
//
// If the PLY file uses non standard property names, they can be mapped while
// loading. For example, the following maps the properties
// “diffuse_(red|green|blue)” in the file to standard color names.
//
// parsePLY(data, {
//   propertyNameMapping: {
//     diffuse_red: 'red',
//     diffuse_green: 'green',
//     diffuse_blue: 'blue'
//   }
// });
import type {MeshAttribute, MeshAttributes, MeshArrowTable} from '@loaders.gl/schema';
import * as arrow from 'apache-arrow';
import type {
  PLYMesh,
  PLYHeader,
  PLYAttributes,
  MeshHeader,
  PLYElement,
  PLYProperty
} from './ply-types';
import normalizePLY from './normalize-ply';
import {getPLYSchema} from './get-ply-schema';

const PLY_END_HEADER = 'end_header';

type MutablePLYAttributes = {[index: string]: number[]};

export type ParsePLYOptions = {
  /** Force the legacy mesh parser; intended for parser benchmarks and regression checks. */
  _useLegacyParser?: boolean;
  /** Disable direct binary point-cloud parsing; intended for parser benchmarks and regression checks. */
  _useLegacyBinaryPointCloudParser?: boolean;
  propertyNameMapping?: Record<string, string>;
  shape?: 'mesh' | 'arrow-table';
};

/**
 * @param data
 * @param options
 * @returns
 */
export function parsePLY(data: ArrayBuffer | string, options: ParsePLYOptions = {}): PLYMesh {
  let header: PLYHeader & MeshHeader;
  let attributes: PLYAttributes;

  if (data instanceof ArrayBuffer) {
    header = parsePLYHeader(data, options);
    attributes =
      header.format === 'ascii'
        ? parseASCII(new TextDecoder().decode(data), header)
        : parseBinary(data, header, options);
  } else {
    header = parsePLYHeader(data, options);
    attributes = parseASCII(data, header);
  }

  return normalizePLY(header, attributes);
}

/**
 * Parse binary scalar point-cloud PLY directly into an Arrow table.
 * @param data PLY data.
 * @param options Parser options.
 * @returns Arrow table, or null when the file requires the general mesh parser.
 */
export function parsePLYToArrowTable(
  data: ArrayBuffer | string,
  options: ParsePLYOptions = {}
): MeshArrowTable | null {
  if (!(data instanceof ArrayBuffer)) {
    return null;
  }

  const header = parsePLYHeader(data, options);
  if (header.format === 'ascii') {
    return null;
  }

  const attributes = parseBinaryPointCloud(data, header, options);
  if (!attributes) {
    return null;
  }

  return makePLYArrowTable(header, attributes);
}

/**
 * Parse a fixed-width binary point-cloud PLY byte range into an Arrow table.
 * @param data Binary PLY bytes containing only vertex records.
 * @param header PLY header describing the vertex record layout.
 * @param options Parser options.
 * @returns Arrow table, or null when the header is not supported by the fixed-width path.
 */
export function parsePLYBinaryPointCloudToArrowTable(
  data: ArrayBuffer,
  header: PLYHeader,
  options: ParsePLYOptions = {}
): MeshArrowTable | null {
  const attributes = parseBinaryPointCloud(data, header, options);
  return attributes ? makePLYArrowTable(header, attributes) : null;
}

/**
 * Parse fixed-width binary vertex records directly from a byte view into an Arrow table.
 * @param records Binary PLY vertex records without a header.
 * @param header PLY header with the batch vertex count already applied.
 * @param options Parser options.
 * @param plan Optional reusable parse plan for the same header layout.
 * @returns Arrow table, or null when the header is not supported by the fixed-width path.
 */
export function parsePLYBinaryPointCloudRecordsToArrowTable(
  records: Uint8Array,
  header: PLYHeader,
  options: ParsePLYOptions = {},
  plan?: PLYBinaryPointCloudParsePlan
): MeshArrowTable | null {
  const attributes = parseBinaryPointCloudRecords(records, header, options, plan);
  return attributes ? makePLYArrowTable(header, attributes) : null;
}

/**
 * @param data
 * @param options
 * @returns header
 */
export function parsePLYHeader(data: any, options?: ParsePLYOptions): PLYHeader {
  const PLY_HEADER_PATTERN = /ply([\s\S]*)end_header\s/;

  const {headerText, headerLength} =
    data instanceof ArrayBuffer ? getBinaryHeader(data) : getTextHeader(data);

  const result = PLY_HEADER_PATTERN.exec(headerText);

  if (result !== null) {
    const lines = result[1].split('\n');
    const header = parseHeaderLines(lines, headerLength || result[0].length, options);
    return header;
  }

  return parseHeaderLines([], headerLength, options);
}

/** Return PLY header text and its byte length from binary data without decoding the body. */
function getBinaryHeader(data: ArrayBuffer): {headerText: string; headerLength: number} {
  const bytes = new Uint8Array(data);
  const headerEnd = findHeaderEnd(bytes);
  return {
    headerText: new TextDecoder().decode(bytes.subarray(0, headerEnd)),
    headerLength: headerEnd
  };
}

/** Return PLY header text and its character length from text data. */
function getTextHeader(data: string): {headerText: string; headerLength: number} {
  const headerEnd = data.indexOf(PLY_END_HEADER);
  if (headerEnd === -1) {
    return {headerText: '', headerLength: 0};
  }

  let headerLength = headerEnd + PLY_END_HEADER.length;
  if (data[headerLength] === '\r' && data[headerLength + 1] === '\n') {
    headerLength += 2;
  } else if (headerLength < data.length && /\s/.test(data[headerLength])) {
    headerLength += 1;
  }
  return {headerText: data.slice(0, headerLength), headerLength};
}

/** Find the byte offset immediately after the `end_header` terminator. */
function findHeaderEnd(bytes: Uint8Array): number {
  const pattern = new TextEncoder().encode(PLY_END_HEADER);
  const lastPatternStart = bytes.length - pattern.length;

  for (let byteIndex = 0; byteIndex <= lastPatternStart; byteIndex++) {
    let matches = true;
    for (let patternIndex = 0; patternIndex < pattern.length; patternIndex++) {
      if (bytes[byteIndex + patternIndex] !== pattern[patternIndex]) {
        matches = false;
        break;
      }
    }

    if (matches) {
      let headerEnd = byteIndex + pattern.length;
      if (bytes[headerEnd] === 0x0d && bytes[headerEnd + 1] === 0x0a) {
        headerEnd += 2;
      } else if (headerEnd < bytes.length && isWhitespaceByte(bytes[headerEnd])) {
        headerEnd += 1;
      }
      return headerEnd;
    }
  }

  return bytes.length;
}

/** Return true for ASCII whitespace bytes that can terminate a PLY header. */
function isWhitespaceByte(byte: number): boolean {
  return byte === 0x0a || byte === 0x0d || byte === 0x09 || byte === 0x20;
}

/**
 * @param lines
 * @param headerLength
 * @param options
 * @returns header
 */
// eslint-disable-next-line complexity
function parseHeaderLines(
  lines: string[],
  headerLength: number,
  options?: ParsePLYOptions
): PLYHeader {
  const header: PLYHeader = {
    comments: [],
    elements: [],
    headerLength
  };

  let lineType: string | undefined;
  let lineValues: string[];
  let currentElement: PLYElement | null = null;

  for (let i = 0; i < lines.length; i++) {
    let line: string = lines[i];
    line = line.trim();

    if (line === '') {
      // eslint-disable-next-line
      continue;
    }

    lineValues = line.split(/\s+/);
    lineType = lineValues.shift();
    line = lineValues.join(' ');

    switch (lineType) {
      case 'format':
        header.format = lineValues[0];
        header.version = lineValues[1];
        break;

      case 'comment':
        header.comments.push(line);
        break;

      case 'element':
        // Start new element, store previous element
        if (currentElement) {
          header.elements.push(currentElement);
        }

        currentElement = {
          name: lineValues[0],
          count: parseInt(lineValues[1], 10),
          properties: []
        };
        break;

      case 'property':
        if (currentElement) {
          const property = makePLYElementProperty(lineValues);
          if (options?.propertyNameMapping && property.name in options?.propertyNameMapping) {
            property.name = options?.propertyNameMapping[property.name];
          }
          currentElement.properties.push(property);
        }
        break;

      default:
    }
  }

  // Store in-progress element
  if (currentElement) {
    header.elements.push(currentElement);
  }

  return header;
}

/** Generate attributes arrays from the header */
// eslint-disable-next-line complexity
function getPLYAttributes(header: PLYHeader): MutablePLYAttributes {
  // TODO Generate only the attribute arrays actually in the header
  const attributes = {
    indices: [],
    vertices: [],
    normals: [],
    uvs: [],
    colors: []
  };

  for (const element of header.elements) {
    if (element.name === 'vertex') {
      for (const property of element.properties) {
        switch (property.name) {
          case 'x':
          case 'y':
          case 'z':
          case 'nx':
          case 'ny':
          case 'nz':
          case 's':
          case 't':
          case 'red':
          case 'green':
          case 'blue':
            break;
          default:
            // Add any non-geometry attributes
            attributes[property.name] = [];
            break;
        }
      }
    }
  }

  return attributes;
}

/**
 * @param propertyValues
 * @returns property of ply element
 */
function makePLYElementProperty(propertyValues: string[]): PLYProperty {
  const type = propertyValues[0];
  switch (type) {
    case 'list':
      return {
        type,
        name: propertyValues[3],
        countType: propertyValues[1],
        itemType: propertyValues[2]
      };
    default:
      return {
        type,
        name: propertyValues[1]
      };
  }
}

/**
 * Parses ASCII number
 * @param n
 * @param type
 * @returns
 */
// eslint-disable-next-line complexity
function parseASCIINumber(n: string, type: string): number {
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
      return parseInt(n, 10);

    case 'float':
    case 'double':
    case 'float32':
    case 'float64':
      return parseFloat(n);

    default:
      throw new Error(type);
  }
}

/**
 * @param properties
 * @param line
 * @returns ASCII element
 */
function parsePLYElement(properties: any[], line: string) {
  const values: any = line.split(/\s+/);

  const element = {};

  for (let i = 0; i < properties.length; i++) {
    if (properties[i].type === 'list') {
      const list: any = [];
      const n = parseASCIINumber(values.shift(), properties[i].countType);

      for (let j = 0; j < n; j++) {
        list.push(parseASCIINumber(values.shift(), properties[i].itemType));
      }

      element[properties[i].name] = list;
    } else {
      element[properties[i].name] = parseASCIINumber(values.shift(), properties[i].type);
    }
  }

  return element;
}

/**
 * @param data
 * @param header
 * @returns [attributes]
 */
function parseASCII(data: any, header: PLYHeader): PLYAttributes {
  // PLY ascii format specification, as per http://en.wikipedia.org/wiki/PLY_(file_format)

  const attributes = getPLYAttributes(header);

  const patternBody = /end_header\s([\s\S]*)$/;
  let body = '';
  const result = patternBody.exec(data);
  if (result !== null) {
    body = result[1];
  }

  const lines = body.split('\n');
  let currentElement = 0;
  let currentElementCount = 0;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    line = line.trim();

    if (line !== '') {
      if (currentElementCount >= header.elements[currentElement].count) {
        currentElement++;
        currentElementCount = 0;
      }

      const element = parsePLYElement(header.elements[currentElement].properties, line);
      handleElement(attributes, header.elements[currentElement].name, element);
      currentElementCount++;
    }
  }

  return attributes;
}

/**
 * @param buffer
 * @param elementName
 * @param element
 */
// eslint-disable-next-line complexity
function handleElement(buffer: MutablePLYAttributes, elementName: string, element: any = {}) {
  if (elementName === 'vertex') {
    for (const propertyName of Object.keys(element)) {
      switch (propertyName) {
        case 'x':
          buffer.vertices.push(element.x, element.y, element.z);
          break;
        case 'y':
        case 'z':
          break;

        case 'nx':
          if ('nx' in element && 'ny' in element && 'nz' in element) {
            buffer.normals.push(element.nx, element.ny, element.nz);
          }
          break;
        case 'ny':
        case 'nz':
          break;

        case 's':
          if ('s' in element && 't' in element) {
            buffer.uvs.push(element.s, element.t);
          }
          break;
        case 't':
          break;

        case 'red':
          if ('red' in element && 'green' in element && 'blue' in element) {
            buffer.colors.push(element.red, element.green, element.blue);
          }
          break;
        case 'green':
        case 'blue':
          break;

        default:
          buffer[propertyName].push(element[propertyName]);
      }
    }
  } else if (elementName === 'face') {
    const vertexIndices = element.vertex_indices || element.vertex_index; // issue #9338

    if (vertexIndices.length === 3) {
      buffer.indices.push(vertexIndices[0], vertexIndices[1], vertexIndices[2]);
    } else if (vertexIndices.length === 4) {
      buffer.indices.push(vertexIndices[0], vertexIndices[1], vertexIndices[3]);
      buffer.indices.push(vertexIndices[1], vertexIndices[2], vertexIndices[3]);
    }
  }
}

/**
 * Reads binary data
 * @param dataview
 * @param at
 * @param type
 * @param littleEndian
 * @returns [number, number]
 */
// eslint-disable-next-line complexity
function binaryRead(dataview: DataView, at: number, type: any, littleEndian: boolean): number[] {
  switch (type) {
    // corespondences for non-specific length types here match rply:
    case 'int8':
    case 'char':
      return [dataview.getInt8(at), 1];
    case 'uint8':
    case 'uchar':
      return [dataview.getUint8(at), 1];
    case 'int16':
    case 'short':
      return [dataview.getInt16(at, littleEndian), 2];
    case 'uint16':
    case 'ushort':
      return [dataview.getUint16(at, littleEndian), 2];
    case 'int32':
    case 'int':
      return [dataview.getInt32(at, littleEndian), 4];
    case 'uint32':
    case 'uint':
      return [dataview.getUint32(at, littleEndian), 4];
    case 'float32':
    case 'float':
      return [dataview.getFloat32(at, littleEndian), 4];
    case 'float64':
    case 'double':
      return [dataview.getFloat64(at, littleEndian), 8];

    default:
      throw new Error(type);
  }
}

/**
 * Reads binary data
 * @param dataview
 * @param at
 * @param properties
 * @param littleEndian
 * @returns [object, number]
 */
function binaryReadElement(
  dataview: DataView,
  at: number,
  properties: {[index: string]: any},
  littleEndian: boolean
): {}[] {
  const element = {};
  let result: number[];
  let read = 0;

  for (let i = 0; i < properties.length; i++) {
    if (properties[i].type === 'list') {
      const list = [];

      result = binaryRead(dataview, at + read, properties[i].countType, littleEndian);
      const n = result[0];
      read += result[1];

      for (let j = 0; j < n; j++) {
        result = binaryRead(dataview, at + read, properties[i].itemType, littleEndian);
        // @ts-ignore
        list.push(result[0]);
        read += result[1];
      }

      element[properties[i].name] = list;
    } else {
      result = binaryRead(dataview, at + read, properties[i].type, littleEndian);
      element[properties[i].name] = result[0];
      read += result[1];
    }
  }

  return [element, read];
}

type BinaryAttributes = PLYAttributes;

type BinaryPointCloudProperty = {
  name: string;
  offset: number;
  read: (dataView: DataView, at: number, littleEndian: boolean) => number;
  size: number;
};

/** Reusable binary point-cloud parse plan. */
export type PLYBinaryPointCloudParsePlan = {
  /** Precomputed scalar property readers and record offsets. */
  properties: BinaryPointCloudProperty[];
  /** Fixed byte stride for one vertex record. */
  vertexStride: number;
  /** Whether scalar values are little-endian encoded. */
  littleEndian: boolean;
};

/** Build an Arrow table from normalized PLY attribute arrays. */
function makePLYArrowTable(header: PLYHeader, attributes: PLYAttributes): MeshArrowTable {
  const meshAttributes = getPLYMeshAttributes(attributes);
  const schema = getPLYSchema(header, meshAttributes);
  schema.metadata.topology = 'point-list';
  schema.metadata.mode = '0';

  const columns: Record<string, arrow.Vector> = {};
  const fields: arrow.Field[] = [];

  for (const field of schema.fields) {
    const attribute = meshAttributes[field.name];
    if (!attribute) {
      continue;
    }
    const column = getPLYArrowVector(attribute);
    columns[field.name] = column;
    fields.push(new arrow.Field(field.name, column.type, false, getArrowMetadata(field.metadata)));
  }

  const arrowSchema = new arrow.Schema(fields, getArrowMetadata(schema.metadata));
  return {
    shape: 'arrow-table',
    schema,
    data: new arrow.Table(arrowSchema, columns),
    topology: 'point-list'
  };
}

/** Convert normalized PLY attributes into mesh-style attribute descriptors. */
function getPLYMeshAttributes(attributes: PLYAttributes): MeshAttributes {
  const meshAttributes: MeshAttributes = {};

  for (const attributeName of Object.keys(attributes)) {
    switch (attributeName) {
      case 'vertices':
        if (attributes.vertices.length > 0) {
          meshAttributes.POSITION = {value: getFloat32Array(attributes.vertices), size: 3};
        }
        break;
      case 'normals':
        if (attributes.normals.length > 0) {
          meshAttributes.NORMAL = {value: getFloat32Array(attributes.normals), size: 3};
        }
        break;
      case 'uvs':
        if (attributes.uvs.length > 0) {
          meshAttributes.TEXCOORD_0 = {value: getFloat32Array(attributes.uvs), size: 2};
        }
        break;
      case 'colors':
        if (attributes.colors.length > 0) {
          meshAttributes.COLOR_0 = {
            value: getUint8Array(attributes.colors),
            size: 3,
            normalized: true
          };
        }
        break;
      case 'indices':
        break;
      default:
        if (attributes[attributeName].length > 0) {
          meshAttributes[attributeName] = {
            value: getFloat32Array(attributes[attributeName]),
            size: 1
          };
        }
        break;
    }
  }

  return meshAttributes;
}

/** Return an Arrow vector for one PLY mesh attribute. */
function getPLYArrowVector(attribute: MeshAttribute): arrow.Vector {
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

/** Convert loaders.gl metadata objects to Arrow metadata maps. */
function getArrowMetadata(metadata: Record<string, string> | undefined): Map<string, string> {
  return new Map(Object.entries(metadata || {}));
}

/** Return a Float32Array without copying when possible. */
function getFloat32Array(attribute: PLYAttributes[string]): Float32Array {
  return attribute instanceof Float32Array ? attribute : new Float32Array(attribute);
}

/** Return a Uint8Array without copying when possible. */
function getUint8Array(attribute: PLYAttributes[string]): Uint8Array {
  return attribute instanceof Uint8Array ? attribute : new Uint8Array(attribute);
}

/**
 * Parses binary data
 * @param data
 * @param header
 * @returns [attributes] of data
 */
function parseBinary(
  data: ArrayBuffer,
  header: PLYHeader,
  options?: ParsePLYOptions
): BinaryAttributes {
  const directAttributes = parseBinaryPointCloud(data, header, options);
  if (directAttributes) {
    return directAttributes;
  }

  const attributes = getPLYAttributes(header);

  const littleEndian = header.format === 'binary_little_endian';
  const body = new DataView(data, header.headerLength);
  let result: any[];
  let loc = 0;

  for (let currentElement = 0; currentElement < header.elements.length; currentElement++) {
    const count = header.elements[currentElement].count;
    for (let currentElementCount = 0; currentElementCount < count; currentElementCount++) {
      result = binaryReadElement(
        body,
        loc,
        header.elements[currentElement].properties,
        littleEndian
      );
      loc += result[1];
      const element = result[0];

      handleElement(attributes, header.elements[currentElement].name, element);
    }
  }

  return attributes;
}

/** Parse binary PLY point clouds directly into typed arrays. */
function parseBinaryPointCloud(
  data: ArrayBuffer,
  header: PLYHeader,
  options?: ParsePLYOptions
): BinaryAttributes | null {
  const records = new Uint8Array(data, header.headerLength || 0);
  return parseBinaryPointCloudRecords(records, header, options);
}

/** Parse binary PLY point-cloud records directly from a byte view into typed arrays. */
function parseBinaryPointCloudRecords(
  records: Uint8Array,
  header: PLYHeader,
  options?: ParsePLYOptions,
  parsePlan?: PLYBinaryPointCloudParsePlan
): BinaryAttributes | null {
  const vertexElement = header.elements[0];
  if (
    !parsePlan &&
    (options?._useLegacyBinaryPointCloudParser ||
      header.elements.length !== 1 ||
      vertexElement?.name !== 'vertex' ||
      vertexElement.properties.some(property => property.type === 'list'))
  ) {
    return null;
  }

  const plan = parsePlan || getPLYBinaryPointCloudParsePlan(header, options);
  if (!plan || !vertexElement) {
    return null;
  }

  const attributes = getBinaryPointCloudAttributes(vertexElement);
  const dataView = new DataView(records.buffer, records.byteOffset, records.byteLength);
  let vertexOffset = 0;

  for (let vertexIndex = 0; vertexIndex < vertexElement.count; vertexIndex++) {
    for (const property of plan.properties) {
      const value = property.read(dataView, vertexOffset + property.offset, plan.littleEndian);
      writeBinaryPointCloudProperty(attributes, property.name, value, vertexIndex);
    }

    vertexOffset += plan.vertexStride;
  }

  return attributes;
}

/** Return a reusable binary point-cloud parse plan, or null when unsupported. */
export function getPLYBinaryPointCloudParsePlan(
  header: PLYHeader,
  options?: ParsePLYOptions
): PLYBinaryPointCloudParsePlan | null {
  const vertexElement = header.elements[0];
  if (
    options?._useLegacyBinaryPointCloudParser ||
    header.elements.length !== 1 ||
    vertexElement?.name !== 'vertex' ||
    vertexElement.properties.some(property => property.type === 'list')
  ) {
    return null;
  }

  const properties = getBinaryPointCloudProperties(vertexElement);
  return {
    properties,
    vertexStride: getPLYElementSize(properties),
    littleEndian: header.format === 'binary_little_endian'
  };
}

/** Allocate direct typed arrays for the normalized PLY attributes. */
function getBinaryPointCloudAttributes(vertexElement: PLYElement): BinaryAttributes {
  const attributes: BinaryAttributes = {
    indices: [],
    vertices: [],
    normals: [],
    uvs: [],
    colors: []
  };
  const propertyNames = new Set(vertexElement.properties.map(property => property.name));
  const vertexCount = vertexElement.count;

  if (propertyNames.has('x') && propertyNames.has('y') && propertyNames.has('z')) {
    attributes.vertices = new Float32Array(vertexCount * 3) as unknown as number[];
  }
  if (propertyNames.has('nx') && propertyNames.has('ny') && propertyNames.has('nz')) {
    attributes.normals = new Float32Array(vertexCount * 3) as unknown as number[];
  }
  if (propertyNames.has('s') && propertyNames.has('t')) {
    attributes.uvs = new Float32Array(vertexCount * 2) as unknown as number[];
  }
  if (propertyNames.has('red') && propertyNames.has('green') && propertyNames.has('blue')) {
    attributes.colors = new Uint8Array(vertexCount * 3) as unknown as number[];
  }

  for (const property of vertexElement.properties) {
    if (!isNormalizedPLYAttributeProperty(property.name)) {
      attributes[property.name] = new Float32Array(vertexCount) as unknown as number[];
    }
  }

  return attributes;
}

/** Return true if a PLY property is packed into a normalized mesh attribute. */
function isNormalizedPLYAttributeProperty(propertyName: string): boolean {
  switch (propertyName) {
    case 'x':
    case 'y':
    case 'z':
    case 'nx':
    case 'ny':
    case 'nz':
    case 's':
    case 't':
    case 'red':
    case 'green':
    case 'blue':
      return true;
    default:
      return false;
  }
}

/** Write a scalar PLY property into its normalized typed array. */
function writeBinaryPointCloudProperty(
  attributes: BinaryAttributes,
  propertyName: string,
  value: number,
  vertexIndex: number
): void {
  switch (propertyName) {
    case 'x':
      attributes.vertices[vertexIndex * 3] = value;
      break;
    case 'y':
      attributes.vertices[vertexIndex * 3 + 1] = value;
      break;
    case 'z':
      attributes.vertices[vertexIndex * 3 + 2] = value;
      break;
    case 'nx':
      attributes.normals[vertexIndex * 3] = value;
      break;
    case 'ny':
      attributes.normals[vertexIndex * 3 + 1] = value;
      break;
    case 'nz':
      attributes.normals[vertexIndex * 3 + 2] = value;
      break;
    case 's':
      attributes.uvs[vertexIndex * 2] = value;
      break;
    case 't':
      attributes.uvs[vertexIndex * 2 + 1] = value;
      break;
    case 'red':
      attributes.colors[vertexIndex * 3] = value;
      break;
    case 'green':
      attributes.colors[vertexIndex * 3 + 1] = value;
      break;
    case 'blue':
      attributes.colors[vertexIndex * 3 + 2] = value;
      break;
    default:
      attributes[propertyName][vertexIndex] = value;
  }
}

/** Return binary property descriptors with precomputed offsets and readers. */
function getBinaryPointCloudProperties(element: PLYElement): BinaryPointCloudProperty[] {
  const properties: BinaryPointCloudProperty[] = [];
  let offset = 0;

  for (const property of element.properties) {
    properties.push({
      name: property.name,
      offset,
      read: getBinaryScalarReader(property.type),
      size: getPLYTypeSize(property.type)
    });
    offset += properties[properties.length - 1].size;
  }

  return properties;
}

/** Return the byte size of a scalar PLY element. */
function getPLYElementSize(properties: BinaryPointCloudProperty[]): number {
  if (properties.length === 0) {
    return 0;
  }
  const lastProperty = properties[properties.length - 1];
  return lastProperty.offset + lastProperty.size;
}

/** Return the byte size of a scalar PLY type. */
// eslint-disable-next-line complexity
function getPLYTypeSize(type: string): number {
  switch (type) {
    case 'int8':
    case 'uint8':
    case 'char':
    case 'uchar':
      return 1;
    case 'int16':
    case 'uint16':
    case 'short':
    case 'ushort':
      return 2;
    case 'int32':
    case 'uint32':
    case 'int':
    case 'uint':
    case 'float32':
    case 'float':
      return 4;
    case 'float64':
    case 'double':
      return 8;
    default:
      throw new Error(type);
  }
}

/** Return one scalar PLY value reader. */
// eslint-disable-next-line complexity
function getBinaryScalarReader(
  type: string
): (dataView: DataView, at: number, littleEndian: boolean) => number {
  switch (type) {
    case 'int8':
    case 'char':
      return readInt8;
    case 'uint8':
    case 'uchar':
      return readUint8;
    case 'int16':
    case 'short':
      return readInt16;
    case 'uint16':
    case 'ushort':
      return readUint16;
    case 'int32':
    case 'int':
      return readInt32;
    case 'uint32':
    case 'uint':
      return readUint32;
    case 'float32':
    case 'float':
      return readFloat32;
    case 'float64':
    case 'double':
      return readFloat64;
    default:
      throw new Error(type);
  }
}

/** Read one signed 8-bit integer. */
function readInt8(dataView: DataView, at: number): number {
  return dataView.getInt8(at);
}

/** Read one unsigned 8-bit integer. */
function readUint8(dataView: DataView, at: number): number {
  return dataView.getUint8(at);
}

/** Read one signed 16-bit integer. */
function readInt16(dataView: DataView, at: number, littleEndian: boolean): number {
  return dataView.getInt16(at, littleEndian);
}

/** Read one unsigned 16-bit integer. */
function readUint16(dataView: DataView, at: number, littleEndian: boolean): number {
  return dataView.getUint16(at, littleEndian);
}

/** Read one signed 32-bit integer. */
function readInt32(dataView: DataView, at: number, littleEndian: boolean): number {
  return dataView.getInt32(at, littleEndian);
}

/** Read one unsigned 32-bit integer. */
function readUint32(dataView: DataView, at: number, littleEndian: boolean): number {
  return dataView.getUint32(at, littleEndian);
}

/** Read one 32-bit float. */
function readFloat32(dataView: DataView, at: number, littleEndian: boolean): number {
  return dataView.getFloat32(at, littleEndian);
}

/** Read one 64-bit float. */
function readFloat64(dataView: DataView, at: number, littleEndian: boolean): number {
  return dataView.getFloat64(at, littleEndian);
}
