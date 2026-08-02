/// <reference path="./meshoptimizer-decoder.d.ts" />

import {MeshoptDecoder} from 'meshoptimizer/decoder';

/** Compression modes defined by the meshopt glTF extensions. */
export type MeshoptCompressionMode = 'ATTRIBUTES' | 'TRIANGLES' | 'INDICES';

/** Post-decode filters defined by the meshopt glTF extensions. */
export type MeshoptCompressionFilter =
  | 'NONE'
  | 'OCTAHEDRAL'
  | 'QUATERNION'
  | 'EXPONENTIAL'
  | 'COLOR';

/** Maps legacy numeric filter identifiers to their glTF string equivalents. */
function getMeshoptCompressionFilter(
  filter: MeshoptCompressionFilter | number
): MeshoptCompressionFilter {
  if (typeof filter === 'string') {
    return filter;
  }
  return ['NONE', 'OCTAHEDRAL', 'QUATERNION', 'EXPONENTIAL', 'COLOR'][
    filter
  ] as MeshoptCompressionFilter;
}

/** Returns whether this runtime supports the WebAssembly meshopt decoder. */
export function isMeshoptSupported(): boolean {
  return MeshoptDecoder.supported;
}

/**
 * Decodes a meshopt-compressed vertex buffer.
 *
 * @param target Destination byte array.
 * @param count Number of vertices to decode.
 * @param byteStride Number of bytes per vertex.
 * @param source Compressed source bytes.
 * @param filter Optional post-decode filter.
 */
export async function meshoptDecodeVertexBuffer(
  target: Uint8Array,
  count: number,
  byteStride: number,
  source: Uint8Array,
  filter: MeshoptCompressionFilter | number = 'NONE'
): Promise<void> {
  await MeshoptDecoder.ready;
  MeshoptDecoder.decodeVertexBuffer(
    target,
    count,
    byteStride,
    source,
    getMeshoptCompressionFilter(filter)
  );
}

/**
 * Decodes a meshopt-compressed triangle index buffer.
 *
 * @param target Destination byte array.
 * @param count Number of indices to decode.
 * @param byteStride Number of bytes per index.
 * @param source Compressed source bytes.
 */
export async function meshoptDecodeIndexBuffer(
  target: Uint8Array,
  count: number,
  byteStride: number,
  source: Uint8Array
): Promise<void> {
  await MeshoptDecoder.ready;
  MeshoptDecoder.decodeIndexBuffer(target, count, byteStride, source);
}

/**
 * Decodes a meshopt-compressed arbitrary index sequence.
 *
 * @param target Destination byte array.
 * @param count Number of indices to decode.
 * @param byteStride Number of bytes per index.
 * @param source Compressed source bytes.
 */
export async function meshoptDecodeIndexSequence(
  target: Uint8Array,
  count: number,
  byteStride: number,
  source: Uint8Array
): Promise<void> {
  await MeshoptDecoder.ready;
  MeshoptDecoder.decodeIndexSequence(target, count, byteStride, source);
}

/**
 * Decodes a buffer described by `KHR_meshopt_compression` or `EXT_meshopt_compression`.
 * The maintained meshoptimizer decoder supports both version 0 and version 1 streams.
 *
 * @param target Destination byte array.
 * @param count Number of elements to decode.
 * @param byteStride Number of bytes per element.
 * @param source Compressed source bytes.
 * @param mode Compression mode used by the source bytes.
 * @param filter Optional post-decode filter.
 */
export async function meshoptDecodeGltfBuffer(
  target: Uint8Array,
  count: number,
  byteStride: number,
  source: Uint8Array,
  mode: MeshoptCompressionMode,
  filter: MeshoptCompressionFilter | number = 'NONE'
): Promise<void> {
  await MeshoptDecoder.ready;
  MeshoptDecoder.decodeGltfBuffer(
    target,
    count,
    byteStride,
    source,
    mode,
    getMeshoptCompressionFilter(filter)
  );
}
