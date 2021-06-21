/* eslint-disable camelcase, max-statements */
// https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#glb-file-format-specification
// https://github.com/KhronosGroup/glTF/tree/master/extensions/1.0/Khronos/KHR_binary_glTF
import type {GLB} from '../types/glb-types';
import {padToNBytes, assert} from '@loaders.gl/loader-utils';

export type GLBParseOptions = {
  magic?: number;
  strict?: boolean;
};

const MAGIC_glTF = 0x676c5446; // glTF in Big-Endian ASCII

const GLB_FILE_HEADER_SIZE = 12;
const GLB_CHUNK_HEADER_SIZE = 8;

const GLB_CHUNK_TYPE_JSON = 0x4e4f534a;
const GLB_CHUNK_TYPE_BIN = 0x004e4942;
const GLB_CHUNK_TYPE_JSON_XVIZ_DEPRECATED = 0; // DEPRECATED - Backward compatibility for old xviz files
const GLB_CHUNK_TYPE_BIX_XVIZ_DEPRECATED = 1; // DEPRECATED - Backward compatibility for old xviz files

const GLB_V1_CONTENT_FORMAT_JSON = 0x0;

const LE = true; // Binary GLTF is little endian.

function getMagicString(dataView, byteOffset = 0) {
  return `\
${String.fromCharCode(dataView.getUint8(byteOffset + 0))}\
${String.fromCharCode(dataView.getUint8(byteOffset + 1))}\
${String.fromCharCode(dataView.getUint8(byteOffset + 2))}\
${String.fromCharCode(dataView.getUint8(byteOffset + 3))}`;
}

// Check if a data view is a GLB
export function isGLB(
  arrayBuffer: ArrayBuffer,
  byteOffset: number = 0,
  options: GLBParseOptions = {}
): boolean {
  const dataView = new DataView(arrayBuffer);
  // Check that GLB Header starts with the magic number
  const {magic = MAGIC_glTF} = options;
  const magic1 = dataView.getUint32(byteOffset, false);
  return magic1 === magic || magic1 === MAGIC_glTF;
}

export default function parseGLBSync(
  glb: GLB,
  arrayBuffer: ArrayBuffer,
  byteOffset: number = 0,
  options: GLBParseOptions = {}
) {
  // Check that GLB Header starts with the magic number
  const dataView = new DataView(arrayBuffer);

  // Compare format with GLBLoader documentation
  const type = getMagicString(dataView, byteOffset + 0);
  const version = dataView.getUint32(byteOffset + 4, LE); // Version 2 of binary glTF container format
  const byteLength = dataView.getUint32(byteOffset + 8, LE); // Total byte length of binary file

  Object.assign(glb, {
    // Put less important stuff in a header, to avoid clutter
    header: {
      byteOffset, // Byte offset into the initial arrayBuffer
      byteLength,
      hasBinChunk: false
    },

    type,
    version,

    json: {},
    binChunks: []
  } as GLB);

  byteOffset += GLB_FILE_HEADER_SIZE;

  switch (glb.version) {
    case 1:
      // eslint-disable-next-line
      return parseGLBV1(glb, dataView, byteOffset);
    case 2:
      // eslint-disable-next-line
      return parseGLBV2(glb, dataView, byteOffset, (options = {}));
    default:
      throw new Error(`Invalid GLB version ${glb.version}. Only supports v1 and v2.`);
  }
}

function parseGLBV1(glb: GLB, dataView: DataView, byteOffset: number): number {
  // Sanity: ensure file is big enough to hold at least the headers
  assert(glb.header.byteLength > GLB_FILE_HEADER_SIZE + GLB_CHUNK_HEADER_SIZE);

  // Explanation of GLB structure:
  // https://cloud.githubusercontent.com/assets/3479527/22600725/36b87122-ea55-11e6-9d40-6fd42819fcab.png
  const contentLength = dataView.getUint32(byteOffset + 0, LE); // Byte length of chunk
  const contentFormat = dataView.getUint32(byteOffset + 4, LE); // Chunk format as uint32
  byteOffset += GLB_CHUNK_HEADER_SIZE;

  // GLB v1 only supports a single chunk type
  assert(contentFormat === GLB_V1_CONTENT_FORMAT_JSON);

  parseJSONChunk(glb, dataView, byteOffset, contentLength);
  // No need to call the function padTo4Bytes() from parseJSONChunk()
  byteOffset += contentLength;
  byteOffset += parseBINChunk(glb, dataView, byteOffset, glb.header.byteLength);

  return byteOffset;
}

function parseGLBV2(glb: GLB, dataView, byteOffset, options: GLBParseOptions): number {
  // Sanity: ensure file is big enough to hold at least the first chunk header
  assert(glb.header.byteLength > GLB_FILE_HEADER_SIZE + GLB_CHUNK_HEADER_SIZE);

  parseGLBChunksSync(glb, dataView, byteOffset, options);

  return byteOffset + glb.header.byteLength;
}

function parseGLBChunksSync(glb: GLB, dataView, byteOffset, options: GLBParseOptions) {
  // Per spec we must iterate over chunks, ignoring all except JSON and BIN
  // Iterate as long as there is space left for another chunk header
  while (byteOffset + 8 <= glb.header.byteLength) {
    const chunkLength = dataView.getUint32(byteOffset + 0, LE); // Byte length of chunk
    const chunkFormat = dataView.getUint32(byteOffset + 4, LE); // Chunk format as uint32
    byteOffset += GLB_CHUNK_HEADER_SIZE;

    // Per spec we must iterate over chunks, ignoring all except JSON and BIN
    switch (chunkFormat) {
      case GLB_CHUNK_TYPE_JSON:
        parseJSONChunk(glb, dataView, byteOffset, chunkLength);
        break;
      case GLB_CHUNK_TYPE_BIN:
        parseBINChunk(glb, dataView, byteOffset, chunkLength);
        break;

      // Backward compatibility for very old xviz files
      case GLB_CHUNK_TYPE_JSON_XVIZ_DEPRECATED:
        if (!options.strict) {
          parseJSONChunk(glb, dataView, byteOffset, chunkLength);
        }
        break;
      case GLB_CHUNK_TYPE_BIX_XVIZ_DEPRECATED:
        if (!options.strict) {
          parseBINChunk(glb, dataView, byteOffset, chunkLength);
        }
        break;

      default:
        // Ignore, per spec
        // console.warn(`Unknown GLB chunk type`); // eslint-disable-line
        break;
    }

    byteOffset += padToNBytes(chunkLength, 4);
  }

  return byteOffset;
}

// Parse a GLB JSON chunk
function parseJSONChunk(glb: GLB, dataView: DataView, byteOffset: number, chunkLength: number) {
  // 1. Create a "view" of the binary encoded JSON data inside the GLB
  const jsonChunk = new Uint8Array(dataView.buffer, byteOffset, chunkLength);

  // 2. Decode the JSON binary array into clear text
  const textDecoder = new TextDecoder('utf8');
  const jsonText = textDecoder.decode(jsonChunk);

  // 3. Parse the JSON text into a JavaScript data structure
  glb.json = JSON.parse(jsonText);

  return padToNBytes(chunkLength, 4);
}

// Parse a GLB BIN chunk
function parseBINChunk(glb: GLB, dataView, byteOffset, chunkLength) {
  // Note: BIN chunk can be optional
  glb.header.hasBinChunk = true;
  glb.binChunks.push({
    byteOffset,
    byteLength: chunkLength,
    arrayBuffer: dataView.buffer
    // TODO - copy, or create typed array view?
  });

  return padToNBytes(chunkLength, 4);
}
