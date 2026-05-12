// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import type {Mesh, MeshArrowTable} from '@loaders.gl/schema';
import {parsePotreeBin, type PotreeBinLoaderOptions} from './parsers/parse-potree-bin';
import {PotreeBinLoader as PotreeBinLoaderMetadata} from './potree-bin-loader';

const {preload: _PotreeBinLoaderPreload, ...PotreeBinLoaderMetadataWithoutPreload} =
  PotreeBinLoaderMetadata;

/**
 * Loader for potree Binary Point Attributes
 * */
export const PotreeBinLoaderWithParser = {
  ...PotreeBinLoaderMetadataWithoutPreload,
  parse: async (arrayBuffer: ArrayBuffer, options?: PotreeBinLoaderOptions) =>
    parsePotreeBin(arrayBuffer, 0, options),
  parseSync
} as const satisfies LoaderWithParser<Mesh | MeshArrowTable, never, PotreeBinLoaderOptions>;

function parseSync(
  arrayBuffer: ArrayBuffer,
  options?: PotreeBinLoaderOptions
): Mesh | MeshArrowTable {
  return parsePotreeBin(arrayBuffer, 0, options);
}
