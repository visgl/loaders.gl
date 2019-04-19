/* eslint-disable camelcase, max-statements */
import {TextDecoder, padTo4Bytes, assert} from '@loaders.gl/core';

const MAGIC_glTF = 0x676c5446; // glTF in Big-Endian ASCII

const GLB_FILE_HEADER_SIZE = 12;
const GLB_CHUNK_HEADER_SIZE = 8;

const GLB_CHUNK_TYPE_JSON = 0x4e4f534a;
const GLB_CHUNK_TYPE_BIN = 0x004e4942;

const LE = true; // Binary GLTF is little endian.
const BE = false; // Magic needs to be written as BE

function getMagicString(dataView) {
  return `\
${String.fromCharCode(dataView.getUint8(0))}\
${String.fromCharCode(dataView.getUint8(1))}\
${String.fromCharCode(dataView.getUint8(2))}\
${String.fromCharCode(dataView.getUint8(3))}`;
}

// Check if a data view is a GLB
export function isGLB(dataView, byteOffset = 0, options = {}) {
  // Check that GLB Header starts with the magic number
  const {magic = MAGIC_glTF} = options;
  const magic1 = dataView.getUint32(byteOffset, false);
  return magic1 === magic || magic1 === MAGIC_glTF;
}

// https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#glb-file-format-specification
/*
Returns {
  // Header
  type: String,
  magic: number,
  version: number,
  byteLength: number,
  byteOffset: number,
  // JSON Chunk
  json: any,
  jsonChunkFormat: number,
  jsonChunkByteOffset: number,
  jsonChunkLength: number,
  // BIN Chunk
  hasBinChunk: boolean,
  binChunkFormat: number,
  binChunkByteOffset: number,
  binChunkLength: number
}
*/
export default function parseGLBSync(glb, arrayBuffer, byteOffset = 0, options = {}) {
  // Check that GLB Header starts with the magic number
  const dataView = new DataView(arrayBuffer);

  glb.byteOffset = byteOffset; // Byte offset into the initial arrayBuffer

  // GLB Header
  glb.magic = dataView.getUint32(byteOffset + 0, BE); // Magic number (the ASCII string 'glTF').
  glb.version = dataView.getUint32(byteOffset + 4, LE); // Version 2 of binary glTF container format
  glb.byteLength = dataView.getUint32(byteOffset + 8, LE); // Total byte length of generated file

  glb.type = getMagicString(dataView);

  // TODO - switch type checks to use strings
  const {magic = MAGIC_glTF} = options;
  const isMagicValid = glb.magic === MAGIC_glTF || glb.magic === magic;
  if (!isMagicValid) {
    console.warn(`Invalid GLB magic string ${glb.type}`); // eslint-disable-line
  }

  assert(glb.version === 2, `Invalid GLB version ${glb.version}. Only .glb v2 supported`);
  assert(glb.byteLength > 20);

  // Parse the JSON chunk

  glb.jsonChunkLength = dataView.getUint32(byteOffset + 12, LE); // Byte length of json chunk
  glb.jsonChunkFormat = dataView.getUint32(byteOffset + 16, LE); // Chunk format as uint32

  // Check JSON Chunk format (0 = Back compat)
  const isJSONChunk = glb.jsonChunkFormat === GLB_CHUNK_TYPE_JSON || glb.jsonChunkFormat === 0;
  assert(isJSONChunk, `JSON chunk format ${glb.jsonChunkFormat}`);

  // Create a "view" of the binary encoded JSON data
  glb.jsonChunkByteOffset = GLB_FILE_HEADER_SIZE + GLB_CHUNK_HEADER_SIZE; // First headers: 20 bytes
  const jsonChunk = new Uint8Array(
    arrayBuffer,
    byteOffset + glb.jsonChunkByteOffset,
    glb.jsonChunkLength
  );

  // Decode the JSON binary array into clear text
  const textDecoder = new TextDecoder('utf8');
  const jsonText = textDecoder.decode(jsonChunk);

  // Parse the JSON text into a JavaScript data structure
  glb.json = JSON.parse(jsonText);

  const binChunkStart = glb.jsonChunkByteOffset + padTo4Bytes(glb.jsonChunkLength);

  // Parse and check BIN chunk header
  // Note: BIN chunk can be optional
  glb.hasBinChunk = binChunkStart + 8 <= glb.byteLength;
  glb.binChunkByteOffset = 0;
  glb.binChunkLength = 0;

  if (glb.hasBinChunk) {
    glb.binChunkLength = dataView.getUint32(byteOffset + binChunkStart + 0, LE);
    glb.binChunkFormat = dataView.getUint32(byteOffset + binChunkStart + 4, LE);
    const isBinChunk = glb.binChunkFormat === GLB_CHUNK_TYPE_BIN || glb.binChunkFormat === 1; // Back compat
    assert(isBinChunk, `BIN chunk format ${glb.binChunkFormat}`);

    glb.binChunkByteOffset = binChunkStart + GLB_CHUNK_HEADER_SIZE;
  }

  return byteOffset + glb.byteLength;
}
