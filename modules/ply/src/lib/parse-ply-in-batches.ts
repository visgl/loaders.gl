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

import {
  makeLineIterator,
  makeTextDecoderIterator,
  forEach,
  toArrayBufferIterator
} from '@loaders.gl/loader-utils';
import type {MeshArrowTable} from '@loaders.gl/schema';
import normalizePLY from './normalize-ply';
import {PLYMesh, PLYHeader, PLYElement, PLYProperty, PLYAttributes} from './ply-types';
import {parsePLYBinaryPointCloudToArrowTable, parsePLYHeader} from './parse-ply';

let currentElement: PLYElement;
type MutablePLYAttributes = {[index: string]: number[]};
type ByteArray = Uint8Array<ArrayBufferLike>;
const DEFAULT_BINARY_BATCH_SIZE = 65536;
const PLY_END_HEADER = 'end_header';

/**
 * PARSER
 * @param iterator
 * @param options
 */
export async function* parsePLYInBatches(
  iterator:
    | AsyncIterable<ArrayBufferLike | ArrayBufferView>
    | Iterable<ArrayBufferLike | ArrayBufferView>,
  options: any
): AsyncIterable<PLYMesh | MeshArrowTable> {
  if (options?.shape === 'arrow-table') {
    yield* parseBinaryPLYToArrowInBatches(iterator, options);
    return;
  }

  const lineIterator = makeLineIterator(makeTextDecoderIterator(toArrayBufferIterator(iterator)));
  const header = await parseASCIIHeader(lineIterator, options);

  let attributes: PLYAttributes;
  switch (header.format) {
    case 'ascii':
      attributes = await parseASCII(lineIterator, header);
      break;
    default:
      throw new Error('Binary PLY can not yet be parsed in streaming mode');
    // attributes = await parseBinary(lineIterator, header);
  }

  yield normalizePLY(header, attributes, options);
}

/** Parse fixed-width binary PLY vertices into Arrow table batches. */
async function* parseBinaryPLYToArrowInBatches(
  iterator:
    | AsyncIterable<ArrayBufferLike | ArrayBufferView>
    | Iterable<ArrayBufferLike | ArrayBufferView>,
  options: any
): AsyncIterable<MeshArrowTable> {
  const byteIterator = toArrayBufferIterator(iterator)[Symbol.asyncIterator]();
  const {header, initialBodyBytes} = await readBinaryPLYHeader(byteIterator, options);
  const vertexElement = getFixedWidthVertexElement(header);
  const batchSize = getBatchSize(options);
  const vertexStride = getPLYElementSize(vertexElement);
  let remainingVertices = vertexElement.count;
  let pendingBytes = initialBodyBytes;

  while (true) {
    const {value: chunk, done} = await byteIterator.next();
    if (done) {
      break;
    }
    pendingBytes = concatenateBytes([pendingBytes, getUint8Array(chunk)]);

    while (remainingVertices > 0 && Math.floor(pendingBytes.length / vertexStride) >= batchSize) {
      const batch = makeBinaryPLYArrowBatch(header, pendingBytes, batchSize, vertexStride, options);
      pendingBytes = pendingBytes.subarray(batchSize * vertexStride);
      remainingVertices -= batchSize;
      yield batch;
    }
  }

  if (remainingVertices > 0) {
    const batchVertexCount = Math.min(
      remainingVertices,
      Math.floor(pendingBytes.length / vertexStride)
    );
    if (batchVertexCount > 0) {
      yield makeBinaryPLYArrowBatch(header, pendingBytes, batchVertexCount, vertexStride, options);
    }
  }
}

/** Read and parse the binary PLY header from the byte stream. */
async function readBinaryPLYHeader(
  iterator: AsyncIterator<ArrayBufferLike>,
  options: any
): Promise<{header: PLYHeader; initialBodyBytes: ByteArray}> {
  let headerBytes: ByteArray = new Uint8Array(0);

  while (true) {
    const {value, done} = await iterator.next();
    if (done) {
      throw new Error('Incomplete PLY header');
    }

    headerBytes = concatenateBytes([headerBytes, getUint8Array(value)]);
    const headerEnd = findHeaderEnd(headerBytes);
    if (headerEnd === -1) {
      continue;
    }

    const header = parsePLYHeader(getArrayBuffer(headerBytes.subarray(0, headerEnd)), options);
    if (header.format === 'ascii') {
      throw new Error('PLY arrow-table batch parsing currently requires binary PLY');
    }

    return {header, initialBodyBytes: headerBytes.subarray(headerEnd)};
  }
}

/** Return the single fixed-width vertex element, or throw for unsupported binary batches. */
function getFixedWidthVertexElement(header: PLYHeader): PLYElement {
  const vertexElement = header.elements[0];
  if (
    header.elements.length !== 1 ||
    vertexElement?.name !== 'vertex' ||
    vertexElement.properties.some(property => property.type === 'list')
  ) {
    throw new Error('Binary PLY arrow-table batch parsing requires one scalar vertex element');
  }
  return vertexElement;
}

/** Build one Arrow table batch from pending vertex record bytes. */
function makeBinaryPLYArrowBatch(
  header: PLYHeader,
  pendingBytes: ByteArray,
  vertexCount: number,
  vertexStride: number,
  options: any
): MeshArrowTable {
  const vertexElement = header.elements[0];
  const batchHeader = {
    ...header,
    headerLength: 0,
    elements: [{...vertexElement, count: vertexCount}]
  };
  const byteLength = vertexCount * vertexStride;
  const arrayBuffer = getArrayBuffer(pendingBytes.subarray(0, byteLength));
  const table = parsePLYBinaryPointCloudToArrowTable(arrayBuffer, batchHeader, options);
  if (!table) {
    throw new Error('Failed to parse binary PLY Arrow batch');
  }
  return table;
}

/** Return the configured binary PLY batch size. */
function getBatchSize(options: any): number {
  const batchSize = options?.batchSize;
  return typeof batchSize === 'number' ? batchSize : DEFAULT_BINARY_BATCH_SIZE;
}

/** Return the byte size of a fixed-width PLY element. */
function getPLYElementSize(element: PLYElement): number {
  return element.properties.reduce((size, property) => size + getPLYTypeSize(property.type), 0);
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

  return -1;
}

/** Return true for ASCII whitespace bytes that can terminate a PLY header. */
function isWhitespaceByte(byte: number): boolean {
  return byte === 0x0a || byte === 0x0d || byte === 0x09 || byte === 0x20;
}

/** Normalize an ArrayBuffer or view into a Uint8Array view. */
function getUint8Array(data: ArrayBufferLike | ArrayBufferView): ByteArray {
  return ArrayBuffer.isView(data)
    ? new Uint8Array(data.buffer, data.byteOffset, data.byteLength)
    : new Uint8Array(data);
}

/** Return an exact ArrayBuffer copy for a byte range. */
function getArrayBuffer(bytes: ByteArray): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

/** Concatenate byte chunks into a new Uint8Array. */
function concatenateBytes(chunks: ByteArray[]): ByteArray {
  const byteLength = chunks.reduce((length, chunk) => length + chunk.length, 0);
  const bytes = new Uint8Array(byteLength);
  let byteOffset = 0;

  for (const chunk of chunks) {
    bytes.set(chunk, byteOffset);
    byteOffset += chunk.length;
  }

  return bytes;
}

/**
 * Parses header
 * @param lineIterator
 * @param options
 * @returns
 */
async function parseASCIIHeader(
  lineIterator: AsyncIterable<string> | Iterable<string>,
  options: {[key: string]: any}
): Promise<PLYHeader> {
  const header: PLYHeader = {
    comments: [],
    elements: []
    // headerLength
  };

  // Note: forEach does not reset iterator if exiting loop prematurely
  // so that iteration can continue in a second loop
  await forEach(lineIterator, (line: string) => {
    line = line.trim();

    // End of header
    if (line === 'end_header') {
      return true; // Returning true cancels `forEach`
    }

    // Ignore empty lines
    if (line === '') {
      // eslint-disable-next-line
      return false; // Returning false does not cancel `forEach`
    }

    const lineValues = line.split(/\s+/);
    const lineType = lineValues.shift();
    line = lineValues.join(' ');

    switch (lineType) {
      case 'ply':
        // First line magic characters, ignore
        break;

      case 'format':
        header.format = lineValues[0];
        header.version = lineValues[1];
        break;

      case 'comment':
        header.comments.push(line);
        break;

      case 'element':
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
        const property = makePLYElementProperty(lineValues, options.propertyNameMapping);
        currentElement.properties.push(property);
        break;

      default:
        // eslint-disable-next-line
        console.log('unhandled', lineType, lineValues);
    }

    return false;
  });

  if (currentElement) {
    header.elements.push(currentElement);
  }

  return header;
}

function makePLYElementProperty(propertyValues: string[], propertyNameMapping: []): PLYProperty {
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

// ASCII PARSING
/**
 * @param lineIterator
 * @param header
 * @returns
 */
async function parseASCII(lineIterator: AsyncIterable<string>, header: PLYHeader) {
  // PLY ascii format specification, as per http://en.wikipedia.org/wiki/PLY_(file_format)
  const attributes: MutablePLYAttributes = {
    indices: [],
    vertices: [],
    normals: [],
    uvs: [],
    colors: []
  };

  let currentElement = 0;
  let currentElementCount = 0;

  for await (let line of lineIterator) {
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
 * Parses ASCII number
 * @param n
 * @param type
 * @returns ASCII number
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
 * Parses ASCII element
 * @param properties
 * @param line
 * @returns element
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
 * @param buffer
 * @param elementName
 * @param element
 */
// HELPER FUNCTIONS
// eslint-disable-next-line complexity
function handleElement(
  buffer: {[index: string]: number[]},
  elementName: string,
  element: any = {}
) {
  switch (elementName) {
    case 'vertex':
      buffer.vertices.push(element.x, element.y, element.z);
      if ('nx' in element && 'ny' in element && 'nz' in element) {
        buffer.normals.push(element.nx, element.ny, element.nz);
      }
      if ('s' in element && 't' in element) {
        buffer.uvs.push(element.s, element.t);
      }
      if ('red' in element && 'green' in element && 'blue' in element) {
        buffer.colors.push(element.red / 255.0, element.green / 255.0, element.blue / 255.0);
      }
      break;

    case 'face':
      const vertexIndices = element.vertex_indices || element.vertex_index; // issue #9338
      if (vertexIndices.length === 3) {
        buffer.indices.push(vertexIndices[0], vertexIndices[1], vertexIndices[2]);
      } else if (vertexIndices.length === 4) {
        buffer.indices.push(vertexIndices[0], vertexIndices[1], vertexIndices[3]);
        buffer.indices.push(vertexIndices[1], vertexIndices[2], vertexIndices[3]);
      }
      break;

    default:
      break;
  }
}
