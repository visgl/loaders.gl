// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import type {ArrowTable} from '@loaders.gl/schema';

import {PCDLoaderOptions} from './pcd-loader';
import {convertMeshToTable} from '@loaders.gl/schema-utils';
import {parsePCD} from './lib/parse-pcd';
import {PCDArrowLoader as PCDArrowLoaderMetadata} from './pcd-arrow-loader';

const {preload: _PCDArrowLoaderPreload, ...PCDArrowLoaderMetadataWithoutPreload} =
  PCDArrowLoaderMetadata;

/**
 * Worker loader for PCD - Point Cloud Data
 */
export const PCDArrowLoaderWithParser = {
  ...PCDArrowLoaderMetadataWithoutPreload,
  parse: async (arrayBuffer: ArrayBuffer) => {
    const mesh = parsePCD(arrayBuffer);
    const arrowTable = convertMeshToTable(mesh, 'arrow-table');
    return arrowTable;
  }
} as const satisfies LoaderWithParser<ArrowTable, never, PCDLoaderOptions>;
