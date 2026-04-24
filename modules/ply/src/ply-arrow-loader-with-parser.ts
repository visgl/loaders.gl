// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import type {ArrowTable} from '@loaders.gl/schema';

import {PLYLoaderOptions} from './ply-loader';
import {convertMeshToTable} from '@loaders.gl/schema-utils';
import {parsePLY} from './lib/parse-ply';
import {PLYArrowLoader as PLYArrowLoaderMetadata} from './ply-arrow-loader';

const {preload: _PLYArrowLoaderPreload, ...PLYArrowLoaderMetadataWithoutPreload} =
  PLYArrowLoaderMetadata;

/**
 * Worker loader for PLY -
 */
export const PLYArrowLoaderWithParser = {
  ...PLYArrowLoaderMetadataWithoutPreload,
  parse: async (arrayBuffer: ArrayBuffer) => {
    const mesh = parsePLY(arrayBuffer);
    const arrowTable = convertMeshToTable(mesh, 'arrow-table');
    return arrowTable;
  }
} as const satisfies LoaderWithParser<ArrowTable, never, PLYLoaderOptions>;
