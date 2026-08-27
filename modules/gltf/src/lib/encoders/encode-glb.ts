// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/* eslint-disable camelcase, max-statements */
import {
  copyPaddedStringToDataView,
  copyPaddedArrayBufferToDataView
} from '@loaders.gl/loader-utils';
import type {GLB, GLBChunk} from '../types/glb-types';
import type {GLTFWithBuffers} from '../types/gltf-types';

const MAGIC_glTF = 0x46546c67; // glTF in ASCII
const MAGIC_JSON = 0x4e4f534a; // JSON in ASCII
const MAGIC_BIN = 0x004e4942; // BIN\0 in ASCII

const LE = true; // Binary GLTF is little endian.

export type GLBEncodeOptions = {
  /** GLB version to encode. Defaults to the input version or v2. */
  version?: number;
  [key: string]: unknown;
};

/**
 * Encode the full GLB buffer with header etc
 *
 * @param glb
 * @param dataView - if `null`, does not encode but just calculates length
 * @param byteOffset
 * @param options
 * @returns
 *
 * @see https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#glb-file-format-specification
 * @todo type GLB argument
 */
export function encodeGLBSync(
  glb: GLB | GLTFWithBuffers,
  dataView: DataView | null,
  byteOffset = 0,
  options: GLBEncodeOptions = {}
) {
  const magic = MAGIC_glTF;
  const version = options.version ?? ('version' in glb ? glb.version : 2);
  const json = glb.json ?? {};

  if (version === 3) return encodeGLBV3(glb, dataView, byteOffset, magic, json);
  if (version !== 2) throw new Error(`Unsupported GLB writer version ${version}.`);
  const binary =
    'binChunks' in glb
      ? (glb.binary ?? glb.binChunks?.[0]?.arrayBuffer)
      : glb.buffers?.[0]?.arrayBuffer;

  const byteOffsetStart = byteOffset;

  // Write GLB Header
  if (dataView) {
    dataView.setUint32(byteOffset + 0, magic, LE); // Magic number (the ASCII string 'glTF').
    dataView.setUint32(byteOffset + 4, version, LE); // Version 2 of binary glTF container format uint32
    dataView.setUint32(byteOffset + 8, 0, LE); // Total byte length of generated file (uint32), will be set last
  }
  const byteOffsetFileLength = byteOffset + 8;
  byteOffset += 12; // GLB_FILE_HEADER_SIZE

  // Write the JSON chunk header
  const byteOffsetJsonHeader = byteOffset;
  if (dataView) {
    dataView.setUint32(byteOffset + 0, 0, LE); // Byte length of json chunk (will be written later)
    dataView.setUint32(byteOffset + 4, MAGIC_JSON, LE); // Chunk type
  }
  byteOffset += 8; // GLB_CHUNK_HEADER_SIZE

  // Write the JSON chunk
  const jsonString = JSON.stringify(json);
  byteOffset = copyPaddedStringToDataView(dataView, byteOffset, jsonString, 4);

  // Now we know the JSON chunk length so we can write it.
  if (dataView) {
    const jsonByteLength = byteOffset - byteOffsetJsonHeader - 8; // GLB_CHUNK_HEADER_SIZE
    dataView.setUint32(byteOffsetJsonHeader + 0, jsonByteLength, LE); // Byte length of json chunk (uint32)
  }

  // Write the BIN chunk if present. The BIN chunk is optional.
  if (binary) {
    const byteOffsetBinHeader = byteOffset;

    // Write the BIN chunk header
    if (dataView) {
      dataView.setUint32(byteOffset + 0, 0, LE); // Byte length BIN (uint32)
      dataView.setUint32(byteOffset + 4, MAGIC_BIN, LE); // Chunk type
    }
    byteOffset += 8; // GLB_CHUNK_HEADER_SIZE

    byteOffset = copyPaddedArrayBufferToDataView(dataView, byteOffset, new Uint8Array(binary), 4);

    // Now we know the BIN chunk length so we can write it.
    if (dataView) {
      const binByteLength = byteOffset - byteOffsetBinHeader - 8; // GLB_CHUNK_HEADER_SIZE
      dataView.setUint32(byteOffsetBinHeader + 0, binByteLength, LE); // Byte length BIN (uint32)
    }
  }

  // Now we know the glb file length so we can write it.
  if (dataView) {
    const fileByteLength = byteOffset - byteOffsetStart;
    dataView.setUint32(byteOffsetFileLength, fileByteLength, LE); // Total byte length of generated file (uint32)
  }

  return byteOffset;
}

/** Encode a draft GLB v3 container with 64-bit file and chunk lengths. */
function encodeGLBV3(
  glb: GLB | GLTFWithBuffers,
  dataView: DataView | null,
  byteOffset: number,
  magic: number,
  json: Record<string, unknown>
): number {
  const byteOffsetStart = byteOffset;
  const chunks: GLBChunk[] = [
    {type: MAGIC_JSON, arrayBuffer: encodeJSON(json)},
    ...(('chunks' in glb ? glb.chunks : []) ?? []),
    ...('binChunks' in glb
      ? (glb.binChunks ?? []).map(chunk => ({type: MAGIC_BIN, arrayBuffer: chunk.arrayBuffer}))
      : (glb.buffers ?? []).map(buffer => ({type: MAGIC_BIN, arrayBuffer: buffer.arrayBuffer})))
  ];

  if (dataView) {
    dataView.setUint32(byteOffset, magic, LE);
    dataView.setUint32(byteOffset + 4, 3, LE);
    setUint64(dataView, byteOffset + 8, 0, 'GLB file length');
  }
  byteOffset += 16;

  for (const chunk of chunks) {
    const encoding = chunk.encoding ?? 0;
    if (encoding !== 0) throw new Error(`Unsupported GLB chunk encoding ${encoding}.`);
    const byteOffsetChunkHeader = byteOffset;
    if (dataView) {
      dataView.setUint32(byteOffset, chunk.type, LE);
      dataView.setUint32(byteOffset + 4, encoding, LE);
      setUint64(dataView, byteOffset + 8, 0, 'GLB chunk length');
    }
    byteOffset += 16;
    byteOffset = copyPaddedArrayBufferToDataView(
      dataView,
      byteOffset,
      new Uint8Array(chunk.arrayBuffer),
      4
    );
    if (dataView) {
      setUint64(
        dataView,
        byteOffsetChunkHeader + 8,
        byteOffset - byteOffsetChunkHeader - 16,
        'GLB chunk length'
      );
    }
  }

  if (dataView) {
    setUint64(dataView, byteOffsetStart + 8, byteOffset - byteOffsetStart, 'GLB file length');
  }
  return byteOffset;
}

function encodeJSON(json: Record<string, unknown>): ArrayBuffer {
  const jsonString = JSON.stringify(json);
  const byteLength = new TextEncoder().encode(jsonString).byteLength;
  const paddedByteLength = Math.ceil(byteLength / 4) * 4;
  const arrayBuffer = new ArrayBuffer(paddedByteLength);
  const dataView = new DataView(arrayBuffer);
  copyPaddedStringToDataView(dataView, 0, jsonString, 4);
  return arrayBuffer;
}

function setUint64(dataView: DataView, byteOffset: number, value: number, label: string): void {
  if (!Number.isSafeInteger(value) || value < 0)
    throw new Error(`${label} is outside the safe integer range.`);
  dataView.setBigUint64(byteOffset, BigInt(value), LE);
}
