// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderContext, LoaderWithParser} from '@loaders.gl/loader-utils';
import type {Mesh, MeshArrowTable} from '@loaders.gl/schema';
import {parseFromContext} from '@loaders.gl/loader-utils';
import {ImageBitmapLoader, getImageData} from '@loaders.gl/images';
import {convertMeshToTable} from '@loaders.gl/schema-utils';
import {parseQuantizedMesh} from './lib/parse-quantized-mesh';
import type {TerrainOptions} from './lib/parse-terrain';
import {makeTerrainMeshFromImage} from './lib/parse-terrain';

import {TerrainLoader as TerrainWorkerLoader, TerrainLoaderOptions} from './terrain-loader';
import {
  QuantizedMeshLoader as QuantizedMeshWorkerLoader,
  QuantizedMeshLoaderOptions
} from './quantized-mesh-loader';
export type {QuantizedMeshWriterOptions} from './quantized-mesh-writer';
export {QuantizedMeshWriter} from './quantized-mesh-writer';
export type {GridTerrainOptions, TerrainBounds, TerrainOptions} from './lib/parse-terrain';
export {
  buildGridMeshAttributes,
  makeGridTerrainMesh,
  makeTerrainMeshFromImage
} from './lib/parse-terrain';

// TerrainLoader

export {TerrainWorkerLoader};

/**
 * Loader for height-map terrain meshes.
 */
export const TerrainLoader = {
  ...TerrainWorkerLoader,
  parse: parseTerrain
} as const satisfies LoaderWithParser<Mesh, never, TerrainLoaderOptions>;

/**
 * Loader for height-map terrain meshes as Apache Arrow tables.
 */
export const TerrainArrowLoader = {
  ...TerrainWorkerLoader,
  dataType: null as unknown as MeshArrowTable,
  batchType: null as never,
  worker: false,
  parse: parseTerrainArrow
} as const satisfies LoaderWithParser<MeshArrowTable, never, TerrainLoaderOptions>;

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
  // Extend function to support additional mesh generation options (square grid or delatin)
  const terrainOptions = {...TerrainLoader.options.terrain, ...options?.terrain} as TerrainOptions;
  return makeTerrainMeshFromImage(terrainImage, terrainOptions);
}

/** Parse a height-map terrain mesh as an Apache Arrow table. */
async function parseTerrainArrow(
  arrayBuffer: ArrayBuffer,
  options?: TerrainLoaderOptions,
  context?: LoaderContext
): Promise<MeshArrowTable> {
  const mesh = await parseTerrain(arrayBuffer, options, context);
  return convertMeshToTable(mesh, 'arrow-table');
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
} as const satisfies LoaderWithParser<Mesh, never, QuantizedMeshLoaderOptions>;

/**
 * Loader for quantized meshes as Apache Arrow tables.
 */
export const QuantizedMeshArrowLoader = {
  ...QuantizedMeshWorkerLoader,
  dataType: null as unknown as MeshArrowTable,
  batchType: null as never,
  worker: false,
  parseSync: parseQuantizedMeshArrow,
  parse: async (arrayBuffer, options) => parseQuantizedMeshArrow(arrayBuffer, options)
} as const satisfies LoaderWithParser<MeshArrowTable, never, QuantizedMeshLoaderOptions>;

/** Parse a quantized mesh as an Apache Arrow table. */
function parseQuantizedMeshArrow(
  arrayBuffer: ArrayBuffer,
  options?: QuantizedMeshLoaderOptions
): MeshArrowTable {
  const mesh = parseQuantizedMesh(arrayBuffer, options?.['quantized-mesh']);
  return convertMeshToTable(mesh, 'arrow-table');
}
