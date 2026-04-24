// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import type {LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import {parsePotreeBin} from './parsers/parse-potree-bin';
import {PotreeBinLoader as PotreeBinLoaderMetadata} from './potree-bin-loader';

const {preload: _PotreeBinLoaderPreload, ...PotreeBinLoaderMetadataWithoutPreload} =
  PotreeBinLoaderMetadata;

/**
 * Loader for potree Binary Point Attributes
 * */
export const PotreeBinLoaderWithParser = {
  ...PotreeBinLoaderMetadataWithoutPreload,
  parseSync
} as const satisfies LoaderWithParser<{}, never, LoaderOptions>;

function parseSync(arrayBuffer: ArrayBuffer, options?: LoaderOptions): {} {
  const index = {};
  const byteOffset = 0;
  parsePotreeBin(arrayBuffer, byteOffset, options, index);
  return index;
}
