// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {GLTFLoaderOptions} from '../../gltf-loader';
import type {GLTFWithBuffers} from '../types/gltf-types';
import {decodeMeshoptCompression} from './meshopt-compression';

/**
 * Exact glTF identifier for the ratified vendor meshopt buffer-view compression extension.
 *
 * This identifier remains supported for existing assets alongside the newer
 * `KHR_meshopt_compression` identifier.
 */
export const name = 'EXT_meshopt_compression';

/**
 * Decodes all `EXT_meshopt_compression` buffer views in a loaded glTF document.
 *
 * Processing is a no-op unless both `options.gltf.loadBuffers` and
 * `options.gltf.decompressMeshes` are enabled. EXT streams use version 0 and the original four
 * post-decode filters; the maintained decoder is shared with KHR processing without changing the
 * EXT capability contract.
 *
 * @param gltfData Parsed glTF JSON together with its resolved source and destination buffers.
 * @param options glTF loader options controlling buffer loading and mesh decompression.
 * @returns A promise that resolves after all EXT meshopt buffer views have been decoded.
 * @throws If KHR and EXT meshopt declarations are mixed on the same buffer view or buffer, or if a
 * compressed stream is malformed.
 */
export async function decode(gltfData: GLTFWithBuffers, options: GLTFLoaderOptions): Promise<void> {
  await decodeMeshoptCompression(gltfData, options, name);
}
