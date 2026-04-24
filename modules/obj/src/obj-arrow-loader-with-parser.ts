// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import type {ArrowTable} from '@loaders.gl/schema';

import {OBJLoaderOptions} from './obj-loader';
import {convertMeshToTable} from '@loaders.gl/schema-utils';
import {parseOBJ} from './lib/parse-obj';
import {OBJArrowLoader as OBJArrowLoaderMetadata} from './obj-arrow-loader';

const {preload: _OBJArrowLoaderPreload, ...OBJArrowLoaderMetadataWithoutPreload} =
  OBJArrowLoaderMetadata;

/**
 * Worker loader for OBJ - Point Cloud Data
 */
export const OBJArrowLoaderWithParser = {
  ...OBJArrowLoaderMetadataWithoutPreload,
  parse: async (arrayBuffer: ArrayBuffer) => {
    const text = new TextDecoder().decode(arrayBuffer);
    const mesh = parseOBJ(text);
    const arrowTable = convertMeshToTable(mesh, 'arrow-table');
    return arrowTable;
  }
} as const satisfies LoaderWithParser<ArrowTable, never, OBJLoaderOptions>;
