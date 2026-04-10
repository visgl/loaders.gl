// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import type {Subtree, Availability} from '../../../types';
import type {LoaderContext, LoaderOptions} from '@loaders.gl/loader-utils';

const SUBTREE_FILE_MAGIC = 0x74627573;
const SUBTREE_FILE_VERSION = 1;

/**
 * Parse subtree file
 * Spec - https://github.com/CesiumGS/3d-tiles/tree/main/extensions/3DTILES_implicit_tiling#subtree-file-format
 * @param data
 * @returns
 */
// eslint-disable-next-line max-statements
export default async function parse3DTilesSubtree(
  data: ArrayBuffer,
  options: LoaderOptions | undefined,
  context: LoaderContext | undefined
): Promise<Subtree> {
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

  await loadExplicitBitstream(subtree, subtree.tileAvailability, internalBinaryBuffer, context);
  if (Array.isArray(subtree.contentAvailability)) {
    for (const contentAvailability of subtree.contentAvailability) {
      await loadExplicitBitstream(subtree, contentAvailability, internalBinaryBuffer, context);
    }
  } else {
    await loadExplicitBitstream(
      subtree,
      subtree.contentAvailability,
      internalBinaryBuffer,
      context
    );
  }
  await loadExplicitBitstream(
    subtree,
    subtree.childSubtreeAvailability,
    internalBinaryBuffer,
    context
  );

  return subtree;
}

/**
 * Load explicit bitstream for subtree availability data.
 * @param subtree - subtree data
 * @param availabilityObject - tileAvailability / contentAvailability / childSubtreeAvailability object
 * @param internalBinaryBuffer - subtree binary buffer
 * @param context - loaders.gl context
 */
export async function loadExplicitBitstream(
  subtree: Subtree,
  availabilityObject: Availability,
  internalBinaryBuffer: ArrayBuffer,
  context: LoaderContext | undefined
): Promise<void> {
  const bufferViewIndex = Number.isFinite(availabilityObject.bitstream)
    ? availabilityObject.bitstream
    : availabilityObject.bufferView;

  if (typeof bufferViewIndex !== 'number') {
    return;
  }

  const bufferView = subtree.bufferViews[bufferViewIndex];
  const buffer = subtree.buffers[bufferView.buffer];

  if (!context?.baseUrl) {
    throw new Error('Url is not provided');
  }

  if (!context.fetch) {
    throw new Error('fetch is not provided');
  }

  // External bitstream loading
  if (buffer.uri) {
    const bufferUri = `${context?.baseUrl || ''}/${buffer.uri}`;
    const response = await context.fetch(bufferUri);
    const data = await response.arrayBuffer();
    availabilityObject.explicitBitstream = new Uint8Array(
      data,
      bufferView.byteOffset,
      bufferView.byteLength
    );
    return;
  }

  const bufferStart = subtree.buffers
    .slice(0, bufferView.buffer)
    .reduce((offset, buf) => offset + buf.byteLength, 0);

  availabilityObject.explicitBitstream = new Uint8Array(
    internalBinaryBuffer.slice(bufferStart, bufferStart + buffer.byteLength),
    bufferView.byteOffset,
    bufferView.byteLength
  );
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
