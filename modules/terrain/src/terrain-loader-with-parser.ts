// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderContext, LoaderWithParser} from '@loaders.gl/loader-utils';
import {parseFromContext} from '@loaders.gl/loader-utils';
import type {Mesh} from '@loaders.gl/schema';
import {ImageBitmapLoader, getImageData} from '@loaders.gl/images';
import {TerrainOptions, makeTerrainMeshFromImage} from './lib/parse-terrain';
import {TerrainLoader as TerrainLoaderMetadata, type TerrainLoaderOptions} from './terrain-loader';

const {preload: _TerrainLoaderPreload, ...TerrainLoaderMetadataWithoutPreload} =
  TerrainLoaderMetadata;

/**
 * Loader for height-map terrain meshes.
 */
export const TerrainLoaderWithParser = {
  ...TerrainLoaderMetadataWithoutPreload,
  parse: parseTerrain
} as const satisfies LoaderWithParser<Mesh, never, TerrainLoaderOptions>;

/**
 * Parse a height-map terrain image as a mesh.
 * @param arrayBuffer Encoded height-map image bytes.
 * @param options Terrain loader options.
 * @param context Loader context used to parse the image payload.
 * @returns Terrain mesh reconstructed from the image.
 */
export async function parseTerrain(
  arrayBuffer: ArrayBuffer,
  options?: TerrainLoaderOptions,
  context?: LoaderContext
): Promise<Mesh> {
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
  const terrainOptions = {
    ...TerrainLoaderWithParser.options.terrain,
    ...options?.terrain
  } as TerrainOptions;
  return makeTerrainMeshFromImage(terrainImage, terrainOptions);
}
