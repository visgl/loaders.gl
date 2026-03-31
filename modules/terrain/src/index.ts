// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderContext, LoaderWithParser} from '@loaders.gl/loader-utils';
import {parseFromContext} from '@loaders.gl/loader-utils';
import {ImageBitmapLoader, getImageData} from '@loaders.gl/images';
import {parseQuantizedMesh} from './lib/parse-quantized-mesh';
import {TerrainOptions, makeTerrainMeshFromImage} from './lib/parse-terrain';

import {TerrainLoader as TerrainWorkerLoader, TerrainLoaderOptions} from './terrain-loader';
import {
  QuantizedMeshLoader as QuantizedMeshWorkerLoader,
  QuantizedMeshLoaderOptions
} from './quantized-mesh-loader';

// TerrainLoader

export {TerrainWorkerLoader};

export const TerrainLoader = {
  ...TerrainWorkerLoader,
  parse: parseTerrain
} as const satisfies LoaderWithParser<any, never, TerrainLoaderOptions>;

export async function parseTerrain(
  arrayBuffer: ArrayBuffer,
  options?: TerrainLoaderOptions,
  context?: LoaderContext
) {
  const loadImageOptions = {
    ...options,
    core: {...options?.core, mimeType: 'application/x.image'}
  };
  const image = await parseFromContext(arrayBuffer, ImageBitmapLoader, loadImageOptions, context!);
  const imageData = getImageData(image);
  const terrainImage = {
    width: imageData.width,
    height: imageData.height,
    data:
      imageData.data instanceof Uint8ClampedArray
        ? new Uint8Array(
            imageData.data.buffer,
            imageData.data.byteOffset,
            imageData.data.byteLength
          )
        : imageData.data
  };
  // Extend function to support additional mesh generation options (square grid or delatin)
  const terrainOptions = {...TerrainLoader.options.terrain, ...options?.terrain} as TerrainOptions;
  return makeTerrainMeshFromImage(terrainImage, terrainOptions);
}

// QuantizedMeshLoader

export {QuantizedMeshWorkerLoader};

/**
 * Loader for quantized meshes
 */
export const QuantizedMeshLoader = {
  ...QuantizedMeshWorkerLoader,
  parseSync: (arrayBuffer, options) => parseQuantizedMesh(arrayBuffer, options?.['quantized-mesh']),
  parse: async (arrayBuffer, options) =>
    parseQuantizedMesh(arrayBuffer, options?.['quantized-mesh'])
} as const satisfies LoaderWithParser<any, never, QuantizedMeshLoaderOptions>;
