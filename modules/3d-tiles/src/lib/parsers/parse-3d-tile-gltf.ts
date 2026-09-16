// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {parseFromContext, LoaderContext} from '@loaders.gl/loader-utils';
import {_getMemoryUsageGLTF, GLTFLoader, postProcessGLTF} from '@loaders.gl/gltf';
import type {GLTFWithBuffers} from '@loaders.gl/gltf';
import {Tiles3DSpatialTransformer} from '@loaders.gl/tiles';
import type {TilesetSpatialOptions, TilesetSpatialReference} from '@loaders.gl/tiles';
import type {Tiles3DLoaderOptions} from '../../tiles-3d-loader';
import {Tiles3DTileContent} from '../../types';
import {parse3DTileVectorContent} from './parse-3d-tile-vector-content';

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
 * @param parsedGltf - glTF already parsed for draft 3D Tiles resource classification.
 * @returns Number of input bytes consumed.
 */
export async function parseGltf3DTile(
  tile: Tiles3DTileContent,
  arrayBuffer: ArrayBuffer,
  options?: Tiles3DLoaderOptions,
  context?: LoaderContext,
  jsonPayload?: Record<string, unknown>,
  parsedGltf?: GLTFWithBuffers
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
    const gltfWithBuffers =
      parsedGltf ||
      (jsonPayload
        ? await parseParsedJsonGltf(jsonPayload, options, context)
        : await parseFromContext(arrayBuffer, GLTFLoader, options, context));
    tile.gltf = postProcessGLTF(gltfWithBuffers);
    transformGLTFSpatialContent(
      tile.gltf,
      options?.['3d-tiles']?._tilesetOptions as
        | {spatialReference?: TilesetSpatialReference; spatialOptions?: TilesetSpatialOptions}
        | undefined
    );
    tile.gpuMemoryUsageInBytes = _getMemoryUsageGLTF(tile.gltf);
    const vectorContent = options?.['3d-tiles']?.vectorContent;
    if (vectorContent) {
      tile.vectorContent = parse3DTileVectorContent(tile.gltf, vectorContent.clip);
    }
  } else {
    tile.gltfArrayBuffer = arrayBuffer;
  }
  return arrayBuffer.byteLength;
}

/** Transform decoded glTF vertex attributes for a requested 3D Tiles target CRS. */
function transformGLTFSpatialContent(
  gltf: any,
  tilesetOptions?: {
    spatialReference?: TilesetSpatialReference;
    spatialOptions?: TilesetSpatialOptions;
  }
): void {
  const spatialReference = tilesetOptions?.spatialReference;
  if (
    !spatialReference ||
    (spatialReference.status !== 'transformable' && spatialReference.status !== 'transformed')
  ) {
    return;
  }
  const transformer = new Tiles3DSpatialTransformer(
    spatialReference,
    tilesetOptions?.spatialOptions
  );
  for (const mesh of gltf.meshes || []) {
    for (const primitive of mesh.primitives || []) {
      const positionAccessor = primitive.attributes?.POSITION;
      if (!positionAccessor?.value || positionAccessor.value.length % 3 !== 0) {
        continue;
      }
      const sourcePositions = positionAccessor.value;
      const transformedPositions = transformer.transformPositions(sourcePositions);
      positionAccessor.value = Float32Array.from(transformedPositions);
      positionAccessor.min = getAttributeBounds(positionAccessor.value, 'min');
      positionAccessor.max = getAttributeBounds(positionAccessor.value, 'max');
      const normalAccessor = primitive.attributes?.NORMAL;
      if (normalAccessor?.value?.length === sourcePositions.length) {
        normalAccessor.value = transformer.transformNormals(normalAccessor.value, sourcePositions);
      }
    }
  }
}

function getAttributeBounds(values: ArrayLike<number>, bound: 'min' | 'max'): number[] {
  const result =
    bound === 'min' ? [Infinity, Infinity, Infinity] : [-Infinity, -Infinity, -Infinity];
  for (let index = 0; index < values.length; index += 3) {
    for (let axis = 0; axis < 3; axis++) {
      result[axis] =
        bound === 'min'
          ? Math.min(result[axis], Number(values[index + axis]))
          : Math.max(result[axis], Number(values[index + axis]));
    }
  }
  return result;
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
