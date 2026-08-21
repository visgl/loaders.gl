// loaders.gl
// SPDX-License-Identifier: MIT license
// Copyright (c) vis.gl contributors

import {parseFromContext, LoaderContext} from '@loaders.gl/loader-utils';
import {_getMemoryUsageGLTF, GLTFLoader, postProcessGLTF} from '@loaders.gl/gltf';
import type {Tiles3DLoaderOptions} from '../../tiles-3d-loader';
import {Tiles3DTileContent} from '../../types';

/**
 * Parses glTF content embedded in a 3D Tiles resource.
 *
 * JSON glTF can provide its already parsed payload from the resource-boundary classifier. Binary
 * glTF and legacy tile containers continue to pass bytes, preserving the normal parser path.
 *
 * @param tile - Mutable tile result populated with glTF metadata and optional parsed content.
 * @param arrayBuffer - Original content bytes retained for byte accounting and deferred parsing.
 * @param options - 3D Tiles and delegated glTF loader options.
 * @param context - Loader context used to load glTF external resources.
 * @param jsonPayload - Parsed JSON glTF object from resource preprocessing, when available.
 * @returns Number of input bytes consumed.
 */
export async function parseGltf3DTile(
  tile: Tiles3DTileContent,
  arrayBuffer: ArrayBuffer,
  options?: Tiles3DLoaderOptions,
  context?: LoaderContext,
  jsonPayload?: Record<string, unknown>
): Promise<number> {
  // Set flags
  // glTF models need to be rotated from Y to Z up
  // https://github.com/AnalyticalGraphicsInc/3d-tiles/tree/master/specification#y-up-to-z-up
  tile.rotateYtoZ = true;
  // Save gltf up axis
  tile.gltfUpAxis = options?.['3d-tiles']?.assetGltfUpAxis
    ? options['3d-tiles'].assetGltfUpAxis
    : 'Y';

  if (options?.['3d-tiles']?.loadGLTF) {
    if (!context) {
      return arrayBuffer.byteLength;
    }
    const gltfWithBuffers = jsonPayload
      ? await parseParsedJsonGltf(jsonPayload, options, context)
      : await parseFromContext(arrayBuffer, GLTFLoader, options, context);
    tile.gltf = postProcessGLTF(gltfWithBuffers);
    tile.gpuMemoryUsageInBytes = _getMemoryUsageGLTF(tile.gltf);
  } else {
    tile.gltfArrayBuffer = arrayBuffer;
  }
  return arrayBuffer.byteLength;
}

/**
 * Parses a JSON glTF object already decoded at the 3D Tiles resource boundary.
 *
 * The core parsing API normalizes all nested input to bytes before dispatching it to a loader.
 * Calling the parser-bearing glTF loader directly is therefore necessary to retain this parsed
 * object and avoid repeating `TextDecoder` and `JSON.parse`. The normal context is still passed
 * through so external buffers, images, and extensions retain their standard loading behavior.
 *
 * @param jsonPayload - Parsed JSON glTF object from resource preprocessing.
 * @param options - 3D Tiles and delegated glTF loader options.
 * @param context - Loader context used to load glTF external resources.
 * @returns Parsed glTF with any requested external resources.
 */
async function parseParsedJsonGltf(
  jsonPayload: Record<string, unknown>,
  options: Tiles3DLoaderOptions | undefined,
  context: LoaderContext
) {
  const gltfLoaderWithParser = await GLTFLoader.preload();
  return await gltfLoaderWithParser.parse(jsonPayload, options, context);
}
