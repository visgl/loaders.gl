/* eslint-disable camelcase, max-statements */
/* global TextDecoder */
// https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#glb-file-format-specification

import {padTo4Bytes, assert} from '@loaders.gl/loader-utils';

const MAGIC_glTF = 0x676c5446; // glTF in Big-Endian ASCII

const GLB_FILE_HEADER_SIZE = 12;
const GLB_CHUNK_HEADER_SIZE = 8;

const GLB_CHUNK_TYPE_JSON = 0x4e4f534a;
const GLB_CHUNK_TYPE_BIN = 0x004e4942;
const GLB_CHUNK_TYPE_JSON_XVIZ_DEPRECATED = 0; // DEPRECATED - Backward compatibility for old xviz files
const GLB_CHUNK_TYPE_BIX_XVIZ_DEPRECATED = 1; // DEPRECATED - Backward compatibility for old xviz files

const LE = true; // Binary GLTF is little endian.

function getMagicString(dataView, byteOffset = 0) {
  return `\
${String.fromCharCode(dataView.getUint8(byteOffset + 0))}\
${String.fromCharCode(dataView.getUint8(byteOffset + 1))}\
${String.fromCharCode(dataView.getUint8(byteOffset + 2))}\
${String.fromCharCode(dataView.getUint8(byteOffset + 3))}`;
}

// Check if a data view is a GLB
export function isGLB(arrayBuffer, byteOffset = 0, options = {}) {
  const dataView = new DataView(arrayBuffer);
  // Check that GLB Header starts with the magic number
  const {magic = MAGIC_glTF} = options;
  const magic1 = dataView.getUint32(byteOffset, false);
  return magic1 === magic || magic1 === MAGIC_glTF;
}

export default function parseGLBSync(glb, arrayBuffer, byteOffset = 0, options = {}) {
  // Check that GLB Header starts with the magic number
  const dataView = new DataView(arrayBuffer);

  // Compare format with GLBLoader documentation
  glb.type = getMagicString(dataView, byteOffset + 0);
  glb.version = dataView.getUint32(byteOffset + 4, LE); // Version 2 of binary glTF container format
  const byteLength = dataView.getUint32(byteOffset + 8, LE); // Total byte length of generated file

  // Put less important stuff in a header, to avoid clutter
  glb.header = {
    byteOffset, // Byte offset into the initial arrayBuffer
    byteLength
  };

  assert(glb.version === 2, `Invalid GLB version ${glb.version}. Only supports v2.`);
  assert(glb.header.byteLength > GLB_FILE_HEADER_SIZE + GLB_CHUNK_HEADER_SIZE);

  // Per spec we must iterate over chunks, ignoring all except JSON and BIN
  glb.json = {};
  glb.binChunks = [];

  parseGLBChunksSync(glb, dataView, byteOffset + GLB_FILE_HEADER_SIZE, options);

  return byteOffset + glb.header.byteLength;
}

function parseGLBChunksSync(glb, dataView, byteOffset, options) {
  // Iterate as long as there is space left for another chunk header
  while (byteOffset + 8 <= glb.header.byteLength) {
    const chunkLength = dataView.getUint32(byteOffset + 0, LE); // Byte length of chunk
    const chunkFormat = dataView.getUint32(byteOffset + 4, LE); // Chunk format as uint32
    byteOffset += GLB_CHUNK_HEADER_SIZE;

    // Per spec we must iterate over chunks, ignoring all except JSON and BIN
    switch (chunkFormat) {
      case GLB_CHUNK_TYPE_JSON:
        parseJSONChunk(glb, dataView, byteOffset, chunkLength, options);
        break;
      case GLB_CHUNK_TYPE_BIN:
        parseBINChunk(glb, dataView, byteOffset, chunkLength, options);
        break;

      // Backward compatibility for very old xviz files
      case GLB_CHUNK_TYPE_JSON_XVIZ_DEPRECATED:
        if (!options.glb.strict) {
          parseJSONChunk(glb, dataView, byteOffset, chunkLength, options);
        }
        break;
      case GLB_CHUNK_TYPE_BIX_XVIZ_DEPRECATED:
        if (!options.glb.strict) {
          parseBINChunk(glb, dataView, byteOffset, chunkLength, options);
        }
        break;

      default:
        // Ignore, per spec
        // console.warn(`Unknown GLB chunk type`); // eslint-disable-line
        break;
    }

    byteOffset += padTo4Bytes(chunkLength);
  }

  return byteOffset;
}

// Parse a GLB JSON chunk
function parseJSONChunk(glb, dataView, byteOffset, chunkLength, options) {
  // 1. Create a "view" of the binary encoded JSON data inside the GLB
  const jsonChunk = new Uint8Array(dataView.buffer, byteOffset, chunkLength);

  // 2. Decode the JSON binary array into clear text
  const textDecoder = new TextDecoder('utf8');
  const jsonText = textDecoder.decode(jsonChunk);

  // 3. Parse the JSON text into a JavaScript data structure
  glb.json = JSON.parse(jsonText);
}

// Parse a GLB BIN chunk
function parseBINChunk(glb, dataView, byteOffset, chunkLength, options) {
  // Note: BIN chunk can be optional
  glb.header.hasBinChunk = true;
  glb.binChunks.push({
    byteOffset,
    byteLength: chunkLength,
    arrayBuffer: dataView.buffer
    // TODO - copy, or create typed array view?
  });
}
