import type {Subtree, ExplicitBitstream} from '../../../types';
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

  if ('bufferView' in subtree.tileAvailability) {
    subtree.tileAvailability.explicitBitstream = await getExplicitBitstream(
      subtree,
      'tileAvailability',
      internalBinaryBuffer,
      context
    );
  }

  if ('bufferView' in subtree.contentAvailability) {
    subtree.contentAvailability.explicitBitstream = await getExplicitBitstream(
      subtree,
      'contentAvailability',
      internalBinaryBuffer,
      context
    );
  }

  if ('bufferView' in subtree.childSubtreeAvailability) {
    subtree.childSubtreeAvailability.explicitBitstream = await getExplicitBitstream(
      subtree,
      'childSubtreeAvailability',
      internalBinaryBuffer,
      context
    );
  }

  return subtree;
}

/**
 * Get url for bitstream downloading
 * @param bitstreamRelativeUri
 * @param basePath
 * @returns
 */
function resolveBufferUri(bitstreamRelativeUri: string, basePath: string): string {
  const hasProtocol = basePath.startsWith('http');

  if (hasProtocol) {
    const resolvedUri = new URL(bitstreamRelativeUri, basePath);
    return decodeURI(resolvedUri.toString());
  }

  /**
   * Adding http protocol only for new URL constructor usage.
   * It allows to resolve relative paths like ../../example with basePath.
   */
  const basePathWithProtocol = `http://${basePath}`;
  const resolvedUri = new URL(bitstreamRelativeUri, basePathWithProtocol);
  /**
   * Drop protocol and use just relative path.
   */
  return `/${resolvedUri.host}${resolvedUri.pathname}`;
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
  internalBinaryBuffer: ArrayBuffer,
  context: LoaderContext | undefined
): Promise<ExplicitBitstream> {
  const bufferViewIndex = subtree[name].bufferView;
  const bufferView = subtree.bufferViews[bufferViewIndex];
  const buffer = subtree.buffers[bufferView.buffer];

  if (!context?.url || !context.fetch) {
    throw new Error('Url is not provided');
  }

  if (!context.fetch) {
    throw new Error('fetch is not provided');
  }

  // External bitstream loading
  if (buffer.uri) {
    const bufferUri = resolveBufferUri(buffer.uri, context?.url);
    const response = await context.fetch(bufferUri);
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
