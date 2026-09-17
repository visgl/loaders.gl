// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {parseFromContext, LoaderContext} from '@loaders.gl/loader-utils';
import {
  _getMemoryUsageGLTF,
  GLTFLoader,
  getGaussianSplatPrimitives,
  getVoxelPrimitives,
  postProcessGLTF
} from '@loaders.gl/gltf';
import type {GLTFWithBuffers} from '@loaders.gl/gltf';
import {Tiles3DSpatialTransformer} from '@loaders.gl/tiles';
import type {TilesetSpatialOptions, TilesetSpatialReference} from '@loaders.gl/tiles';
import {Matrix4} from '@math.gl/core';
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
    tile.gaussianSplatPrimitives =
      gltfWithBuffers.gaussianSplatPrimitives || getGaussianSplatPrimitives(gltfWithBuffers);
    tile.voxelPrimitives = getVoxelPrimitives(gltfWithBuffers);
    tile.gltf = postProcessGLTF(gltfWithBuffers);
    transformGLTFSpatialContent(
      tile.gltf,
      options?.['3d-tiles']?._tilesetOptions as
        | {
            spatialReference?: TilesetSpatialReference;
            spatialOptions?: TilesetSpatialOptions;
            spatialTransform?: ArrayLike<number>;
          }
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
    spatialTransform?: ArrayLike<number>;
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
  const spatialTransform = tilesetOptions?.spatialTransform
    ? new Matrix4(Array.from(tilesetOptions.spatialTransform))
    : undefined;
  const placements = getUniqueMeshPlacements(gltf);
  for (const mesh of gltf.meshes || []) {
    const meshPlacement = placements.get(mesh);
    if (placements.size && !meshPlacement) {
      continue;
    }
    for (const primitive of mesh.primitives || []) {
      const positionAccessor = primitive.attributes?.POSITION;
      if (!positionAccessor?.value || positionAccessor.value.length % 3 !== 0) {
        continue;
      }
      const sourcePositions = positionAccessor.value;
      const meshPlacedPositions = meshPlacement
        ? transformPositionsByMatrix(sourcePositions, meshPlacement)
        : Float64Array.from(sourcePositions);
      const placedPositions = spatialTransform
        ? transformPositionsByMatrix(meshPlacedPositions, spatialTransform)
        : meshPlacedPositions;
      const transformedPositions = transformer.transformPositions(placedPositions);
      positionAccessor.value = Float32Array.from(transformedPositions);
      positionAccessor.min = getAttributeBounds(positionAccessor.value, 'min');
      positionAccessor.max = getAttributeBounds(positionAccessor.value, 'max');
      const normalAccessor = primitive.attributes?.NORMAL;
      if (normalAccessor?.value?.length === sourcePositions.length) {
        const meshPlacedNormals = meshPlacement
          ? transformDirectionsByMatrix(normalAccessor.value, meshPlacement)
          : Float32Array.from(normalAccessor.value);
        const placedNormals = spatialTransform
          ? transformDirectionsByMatrix(meshPlacedNormals, spatialTransform)
          : meshPlacedNormals;
        normalAccessor.value = transformer.transformNormals(placedNormals, placedPositions);
      }
    }
  }
}

/** Return static node placements for meshes with exactly one instance. */
function getUniqueMeshPlacements(gltf: any): Map<any, Matrix4> {
  const rawNodes = gltf.json?.nodes || [];
  const parents = new Map<number, number>();
  for (let nodeIndex = 0; nodeIndex < rawNodes.length; nodeIndex++) {
    for (const childIndex of rawNodes[nodeIndex].children || []) {
      parents.set(childIndex, nodeIndex);
    }
  }
  const meshNodes = new Map<number, number[]>();
  for (let nodeIndex = 0; nodeIndex < rawNodes.length; nodeIndex++) {
    const meshIndex = rawNodes[nodeIndex].mesh;
    if (typeof meshIndex === 'number') {
      meshNodes.set(meshIndex, [...(meshNodes.get(meshIndex) || []), nodeIndex]);
    }
  }
  const placements = new Map<any, Matrix4>();
  for (const [meshIndex, nodeIndices] of meshNodes) {
    if (nodeIndices.length !== 1 || !gltf.meshes?.[meshIndex]) {
      continue;
    }
    let nodeIndex: number | undefined = nodeIndices[0];
    const matrix = new Matrix4();
    const chain: number[] = [];
    while (nodeIndex !== undefined) {
      chain.unshift(nodeIndex);
      nodeIndex = parents.get(nodeIndex);
    }
    if (chain.length !== 1) {
      continue;
    }
    for (const chainNodeIndex of chain) {
      const node = rawNodes[chainNodeIndex];
      const nodeMatrix = node.matrix
        ? new Matrix4(node.matrix)
        : new Matrix4()
            .translate(node.translation || [0, 0, 0])
            .multiplyRight(new Matrix4().fromQuaternion(node.rotation || [0, 0, 0, 1]))
            .scale(node.scale || [1, 1, 1]);
      matrix.multiplyRight(nodeMatrix);
    }
    if (gltf.nodes?.[chain[0]]) {
      gltf.nodes[chain[0]].matrix = new Matrix4();
      delete gltf.nodes[chain[0]].translation;
      delete gltf.nodes[chain[0]].rotation;
      delete gltf.nodes[chain[0]].scale;
    }
    placements.set(gltf.meshes[meshIndex], matrix);
  }
  return placements;
}

function transformPositionsByMatrix(values: ArrayLike<number>, matrix: Matrix4): Float64Array {
  const result = new Float64Array(values.length);
  for (let index = 0; index < values.length; index += 3) {
    result.set(
      matrix.transformAsPoint([values[index], values[index + 1], values[index + 2]]),
      index
    );
  }
  return result;
}

function transformDirectionsByMatrix(values: ArrayLike<number>, matrix: Matrix4): Float32Array {
  const result = new Float32Array(values.length);
  for (let index = 0; index < values.length; index += 3) {
    result.set(
      matrix.transformAsVector([values[index], values[index + 1], values[index + 2]]),
      index
    );
  }
  return result;
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
