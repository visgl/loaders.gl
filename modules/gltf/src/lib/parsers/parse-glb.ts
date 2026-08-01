/* eslint-disable camelcase, max-statements */
// https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#glb-file-format-specification
// Draft GLB v3 layout: https://github.com/KhronosGroup/glTF/issues/2594
// https://github.com/KhronosGroup/glTF/tree/master/extensions/1.0/Khronos/KHR_binary_glTF
import type {GLB} from '../types/glb-types';
import {assert} from '@loaders.gl/loader-utils';

/** Options for parsing a GLB */
export type ParseGLBOptions = {
  /** @deprecated This option was used by XVIZ protocol to define a non-standard magic number */
  magic?: number;
  /** @deprecated This option was used by XVIZ protocol to embed non-standard chunks */
  strict?: boolean;
};

/** Binary GLTF is little endian. */
const LITTLE_ENDIAN = true;

/** 'glTF' in Big-Endian ASCII */
const MAGIC_glTF = 0x676c5446;
const GLB_V1_V2_FILE_HEADER_SIZE = 12;
const GLB_V3_FILE_HEADER_SIZE = 16;
const GLB_V1_V2_CHUNK_HEADER_SIZE = 8;
const GLB_V3_CHUNK_HEADER_SIZE = 16;
const GLB_CHUNK_TYPE_JSON = 0x4e4f534a;
const GLB_CHUNK_TYPE_BIN = 0x004e4942;
const GLB_V1_CONTENT_FORMAT_JSON = 0x0;

/** @deprecated - Backward compatibility for old xviz files */
const GLB_CHUNK_TYPE_JSON_XVIZ_DEPRECATED = 0;
/** @deprecated - Backward compatibility for old xviz files */
const GLB_CHUNK_TYPE_BIX_XVIZ_DEPRECATED = 1;

function getMagicString(dataView, byteOffset = 0) {
  return `\
${String.fromCharCode(dataView.getUint8(byteOffset + 0))}\
${String.fromCharCode(dataView.getUint8(byteOffset + 1))}\
${String.fromCharCode(dataView.getUint8(byteOffset + 2))}\
${String.fromCharCode(dataView.getUint8(byteOffset + 3))}`;
}

/** Check if the contents of an array buffer contains GLB byte markers */
export function isGLB(
  arrayBuffer: ArrayBuffer,
  byteOffset: number = 0,
  options: ParseGLBOptions = {}
): boolean {
  const dataView = new DataView(arrayBuffer);
  // Check that GLB Header starts with the magic number
  const {magic = MAGIC_glTF} = options;
  const magic1 = dataView.getUint32(byteOffset, false);
  return magic1 === magic || magic1 === MAGIC_glTF;
}

/**
 * Synchronously parse a GLB
 * @param glb - Target, Output is stored there
 * @param arrayBuffer - Input data
 * @param byteOffset - Offset into arrayBuffer to start parsing from (for "embedded" GLBs, e.g. in 3D tiles)
 * @param options
 * @returns
 */
export function parseGLBSync(
  glb: GLB,
  arrayBuffer: ArrayBuffer,
  byteOffset: number = 0,
  options: ParseGLBOptions = {}
) {
  // Check that GLB Header starts with the magic number
  const dataView = new DataView(arrayBuffer);

  // Compare format with GLBLoader documentation
  const type = getMagicString(dataView, byteOffset + 0);
  const version = dataView.getUint32(byteOffset + 4, LITTLE_ENDIAN);
  const byteLength =
    version === 3
      ? getSafeUint64(dataView, byteOffset + 8, 'GLB byte length')
      : dataView.getUint32(byteOffset + 8, LITTLE_ENDIAN);

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

  switch (glb.version) {
    case 1:
      return parseGLBV1(glb, dataView, byteOffset + GLB_V1_V2_FILE_HEADER_SIZE);
    case 2:
      return parseGLBV2(glb, dataView, byteOffset + GLB_V1_V2_FILE_HEADER_SIZE, options);
    case 3:
      return parseGLBV3(glb, dataView, byteOffset + GLB_V3_FILE_HEADER_SIZE, options);
    default:
      throw new Error(`Invalid GLB version ${glb.version}. Only supports versions 1, 2 and 3.`);
  }
}

/**
 * Parse a V1 GLB
 * @param glb - target, output is stored in this object
 * @param dataView - Input, memory to be parsed
 * @param byteOffset - Offset of first byte of GLB data in the data view
 * @returns Number of bytes parsed (there could be additional non-GLB data after the GLB)
 */
function parseGLBV1(glb: GLB, dataView: DataView, byteOffset: number): number {
  // Sanity: ensure file is big enough to hold at least the headers
  assert(glb.header.byteLength > GLB_V1_V2_FILE_HEADER_SIZE + GLB_V1_V2_CHUNK_HEADER_SIZE);

  // Explanation of GLB structure:
  // https://cloud.githubusercontent.com/assets/3479527/22600725/36b87122-ea55-11e6-9d40-6fd42819fcab.png
  const contentLength = dataView.getUint32(byteOffset + 0, LITTLE_ENDIAN); // Byte length of chunk
  const contentFormat = dataView.getUint32(byteOffset + 4, LITTLE_ENDIAN); // Chunk format as uint32
  byteOffset += GLB_V1_V2_CHUNK_HEADER_SIZE;

  // GLB v1 only supports a single chunk type
  assert(contentFormat === GLB_V1_CONTENT_FORMAT_JSON);

  parseJSONChunk(glb, dataView, byteOffset, contentLength);
  // No need to call the function padToBytes() from parseJSONChunk()
  byteOffset += contentLength;
  byteOffset += parseBINChunk(glb, dataView, byteOffset, glb.header.byteLength);

  return byteOffset;
}

/**
 * Parse a V2 GLB
 * @param glb - target, output is stored in this object
 * @param dataView - Input, memory to be parsed
 * @param byteOffset - Offset of first byte of GLB data in the data view
 * @returns Number of bytes parsed (there could be additional non-GLB data after the GLB)
 */
function parseGLBV2(
  glb: GLB,
  dataView: DataView,
  byteOffset: number,
  options: ParseGLBOptions
): number {
  // Sanity: ensure file is big enough to hold at least the first chunk header
  assert(glb.header.byteLength > GLB_V1_V2_FILE_HEADER_SIZE + GLB_V1_V2_CHUNK_HEADER_SIZE);

  parseGLBChunksSync(glb, dataView, byteOffset, GLB_V1_V2_CHUNK_HEADER_SIZE, options);

  return glb.header.byteOffset + glb.header.byteLength;
}

/** Parse a draft V3 GLB with 64-bit file and chunk lengths. */
function parseGLBV3(
  glb: GLB,
  dataView: DataView,
  byteOffset: number,
  options: ParseGLBOptions
): number {
  assert(glb.header.byteLength >= GLB_V3_FILE_HEADER_SIZE + GLB_V3_CHUNK_HEADER_SIZE);

  parseGLBChunksSync(glb, dataView, byteOffset, GLB_V3_CHUNK_HEADER_SIZE, options);

  return glb.header.byteOffset + glb.header.byteLength;
}

/** Iterate over GLB chunks and parse them */
function parseGLBChunksSync(
  glb: GLB,
  dataView: DataView,
  byteOffset: number,
  chunkHeaderSize: number,
  options: ParseGLBOptions
) {
  const fileEndByteOffset = glb.header.byteOffset + glb.header.byteLength;
  assert(fileEndByteOffset <= dataView.byteLength);

  // Per spec we must iterate over chunks, ignoring all except JSON and BIN
  // Iterate as long as there is space left for another chunk header
  while (byteOffset + chunkHeaderSize <= fileEndByteOffset) {
    const isVersion3 = glb.version === 3;
    const chunkFormat = dataView.getUint32(byteOffset + (isVersion3 ? 0 : 4), LITTLE_ENDIAN);
    const chunkEncoding = isVersion3 ? dataView.getUint32(byteOffset + 4, LITTLE_ENDIAN) : 0;
    const chunkLength = isVersion3
      ? getSafeUint64(dataView, byteOffset + 8, 'GLB chunk length')
      : dataView.getUint32(byteOffset + 0, LITTLE_ENDIAN);
    byteOffset += chunkHeaderSize;

    if (chunkEncoding !== 0) {
      throw new Error(`Unsupported GLB chunk encoding ${chunkEncoding}.`);
    }
    if (byteOffset + chunkLength > fileEndByteOffset) {
      throw new Error('GLB chunk extends beyond the declared file length.');
    }

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

    byteOffset += padToFourBytes(chunkLength);
  }

  return byteOffset;
}

/* Parse a GLB JSON chunk */
function parseJSONChunk(glb: GLB, dataView: DataView, byteOffset: number, chunkLength: number) {
  // 1. Create a "view" of the binary encoded JSON data inside the GLB
  const jsonChunk = new Uint8Array(dataView.buffer, byteOffset, chunkLength);

  // 2. Decode the JSON binary array into clear text
  const textDecoder = new TextDecoder('utf8');
  const jsonText = textDecoder.decode(jsonChunk);

  // 3. Parse the JSON text into a JavaScript data structure
  glb.json = JSON.parse(jsonText);

  return padToFourBytes(chunkLength);
}

/** Parse a GLB BIN chunk */
function parseBINChunk(glb: GLB, dataView, byteOffset, chunkLength) {
  // Note: BIN chunk can be optional
  glb.header.hasBinChunk = true;
  glb.binChunks.push({
    byteOffset,
    byteLength: chunkLength,
    arrayBuffer: dataView.buffer
    // TODO - copy, or create typed array view?
  });

  return padToFourBytes(chunkLength);
}

/** Read a uint64 that can be represented exactly by JavaScript offsets and lengths. */
function getSafeUint64(dataView: DataView, byteOffset: number, label: string): number {
  const value = dataView.getBigUint64(byteOffset, LITTLE_ENDIAN);
  if (value > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error(`${label} exceeds JavaScript's safe integer range.`);
  }
  return Number(value);
}

/** Round a byte length up to the four-byte alignment required by GLB chunks. */
function padToFourBytes(byteLength: number): number {
  return Math.ceil(byteLength / 4) * 4;
}
