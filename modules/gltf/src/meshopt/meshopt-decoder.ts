// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/// <reference path="./meshoptimizer-decoder.d.ts" />

import {MeshoptDecoder} from 'meshoptimizer/decoder';

/**
 * Bitstream modes defined by `EXT_meshopt_compression` and `KHR_meshopt_compression`.
 *
 * `ATTRIBUTES` represents fixed-stride data such as vertex attributes and animation values,
 * `TRIANGLES` represents triangle-list indices, and `INDICES` represents arbitrary index
 * sequences.
 */
export type MeshoptCompressionMode = 'ATTRIBUTES' | 'TRIANGLES' | 'INDICES';

/**
 * Post-decode filters defined by the meshopt glTF extensions.
 *
 * `NONE`, `OCTAHEDRAL`, `QUATERNION`, and `EXPONENTIAL` are shared by EXT and KHR. `COLOR` is a KHR
 * addition for color data encoded in the YCoCg color model.
 */
export type MeshoptCompressionFilter =
  | 'NONE'
  | 'OCTAHEDRAL'
  | 'QUATERNION'
  | 'EXPONENTIAL'
  | 'COLOR';

/**
 * Maps the legacy loaders.gl numeric filter API to glTF extension enum strings.
 *
 * Numeric values `0` through `4` map to `NONE`, `OCTAHEDRAL`, `QUATERNION`, `EXPONENTIAL`, and
 * `COLOR`, respectively. String values pass through unchanged.
 *
 * @param filter glTF filter name or legacy numeric filter identifier.
 * @returns Filter name accepted by the maintained meshoptimizer decoder.
 */
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

/**
 * Reports whether the current runtime can initialize the WebAssembly meshopt decoder.
 *
 * This check does not initialize the decoder; each asynchronous decode helper waits for
 * initialization through `MeshoptDecoder.ready`.
 *
 * @returns `true` when meshopt WebAssembly decoding is available.
 */
export function isMeshoptSupported(): boolean {
  return MeshoptDecoder.supported;
}

/**
 * Decodes a meshopt-compressed fixed-stride attribute buffer into caller-provided storage.
 *
 * @param target Destination byte array with capacity for at least `count * byteStride` bytes.
 * @param count Number of fixed-stride elements to decode.
 * @param byteStride Number of bytes in each decoded element.
 * @param source Complete compressed bitstream.
 * @param filter Post-decode filter name or legacy numeric identifier; defaults to `NONE`.
 * @returns A promise that resolves after decoded bytes have been written to `target`.
 * @throws If the compressed bitstream is malformed or incompatible with the supplied dimensions
 * or filter.
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
 * Decodes a meshopt-compressed triangle-list index buffer into caller-provided storage.
 *
 * @param target Destination byte array with capacity for at least `count * byteStride` bytes.
 * @param count Number of indices to decode.
 * @param byteStride Number of bytes per index; the glTF extensions permit `2` or `4`.
 * @param source Complete compressed triangle bitstream.
 * @returns A promise that resolves after decoded indices have been written to `target`.
 * @throws If the compressed bitstream is malformed or incompatible with the supplied dimensions.
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
 * Decodes a meshopt-compressed arbitrary index sequence into caller-provided storage.
 *
 * @param target Destination byte array with capacity for at least `count * byteStride` bytes.
 * @param count Number of indices to decode.
 * @param byteStride Number of bytes per index; the glTF extensions permit `2` or `4`.
 * @param source Complete compressed index-sequence bitstream.
 * @returns A promise that resolves after decoded indices have been written to `target`.
 * @throws If the compressed bitstream is malformed or incompatible with the supplied dimensions.
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
 *
 * The maintained meshoptimizer decoder supports EXT-compatible version 0 streams and the KHR
 * version 1 attribute stream. Dispatch is based on the declared glTF mode, and any filter is
 * applied after bitstream decompression without changing the output length.
 *
 * @param target Destination byte array with capacity for at least `count * byteStride` bytes.
 * @param count Number of elements to decode.
 * @param byteStride Number of bytes per element.
 * @param source Complete compressed bitstream selected by the extension byte range.
 * @param mode Compression mode declared by the extension.
 * @param filter Post-decode filter name or legacy numeric identifier; defaults to `NONE`.
 * @returns A promise that resolves after decoded bytes have been written to `target`.
 * @throws If the compressed bitstream is malformed or incompatible with the declared mode,
 * dimensions, or filter.
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
