import type {Subtree, ExplicitBitstream} from '../../../types';
import {fetchFile} from '@loaders.gl/core';

const SUBTREE_FILE_MAGIC = 0x74627573;
const SUBTREE_FILE_VERSION = 1;

/**
 * Parse subtree file
 * Spec - https://github.com/CesiumGS/3d-tiles/tree/main/extensions/3DTILES_implicit_tiling#subtree-file-format
 * @param data
 * @returns
 */
// eslint-disable-next-line max-statements
export default async function parse3DTilesSubtree(data: ArrayBuffer): Promise<Subtree> {
  const magic = new Uint32Array(data.slice(0, 4));

  if (magic[0] !== SUBTREE_FILE_MAGIC) {
    throw new Error('Wrong subtree file magic number');
  }

  const version = new Uint32Array(data.slice(4, 8));

  if (version[0] !== SUBTREE_FILE_VERSION) {
    throw new Error('Wrong subtree file verson, must be 1');
  }

  const jsonByteLength = parseUint64Value(data.slice(8, 16));
  const stringAttribute = new Uint8Array(data, 24, jsonByteLength);

  const textDecoder = new TextDecoder('utf8');
  const string = textDecoder.decode(stringAttribute);
  const subtree = JSON.parse(string);

  const binaryByteLength = parseUint64Value(data.slice(16, 24));
  let internalBinaryBuffer = new ArrayBuffer(0);

  if (binaryByteLength) {
    internalBinaryBuffer = data.slice(24 + jsonByteLength);
  }

  if ('bufferView' in subtree.tileAvailability) {
    subtree.tileAvailability.explicitBitstream = await getExplicitBitstream(
      subtree,
      'tileAvailability',
      internalBinaryBuffer
    );
  }

  if ('bufferView' in subtree.contentAvailability) {
    subtree.contentAvailability.explicitBitstream = await getExplicitBitstream(
      subtree,
      'contentAvailability',
      internalBinaryBuffer
    );
  }

  if ('bufferView' in subtree.childSubtreeAvailability) {
    subtree.childSubtreeAvailability.explicitBitstream = await getExplicitBitstream(
      subtree,
      'childSubtreeAvailability',
      internalBinaryBuffer
    );
  }

  return subtree;
}

/**
 * Get explicit bitstream for subtree availability data.
 * @param subtree
 * @param name
 * @param internalBinaryBuffer
 */
async function getExplicitBitstream(
  subtree: Subtree,
  name: string,
  internalBinaryBuffer: ArrayBuffer
): Promise<ExplicitBitstream> {
  const bufferViewIndex = subtree[name].bufferView;
  const bufferView = subtree.bufferViews[bufferViewIndex];
  const buffer = subtree.buffers[bufferView.buffer];

  // External bitstream loading
  if (buffer.uri) {
    const response = await fetchFile(buffer.uri);
    const data = await response.arrayBuffer();
    // Return view of bitstream.
    return new Uint8Array(data, bufferView.byteOffset, bufferView.byteLength);
  }
  // Return view of bitstream.
  return new Uint8Array(internalBinaryBuffer, bufferView.byteOffset, bufferView.byteLength);
}

/**
 * Parse buffer to return uint64 value
 * @param buffer
 * @returns 64-bit value until precision is lost after Number.MAX_SAFE_INTEGER
 */
function parseUint64Value(buffer: ArrayBuffer): number {
  const dataView = new DataView(buffer);
  const left = dataView.getUint32(0, true);
  const right = dataView.getUint32(4, true);
  // combine the two 32-bit values
  return left + 2 ** 32 * right;
}
