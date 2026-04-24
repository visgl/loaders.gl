// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import type {ArrowTable} from '@loaders.gl/schema';
import {convertMeshToTable} from '@loaders.gl/schema-utils';

import type {LASLoaderOptions} from './las-loader';
import {LAZPerfLoaderWithParser} from './lazperf-loader-with-parser';
import {LASArrowLoader as LASArrowLoaderMetadata} from './las-arrow-loader';

const {preload: _LASArrowLoaderPreload, ...LASArrowLoaderMetadataWithoutPreload} =
  LASArrowLoaderMetadata;

/**
 * Worker loader for LAS - Point Cloud Data
 */
export const LASArrowLoaderWithParser = {
  ...LASArrowLoaderMetadataWithoutPreload,
  parse: async (arrayBuffer: ArrayBuffer) => {
    const mesh = await LAZPerfLoaderWithParser.parse(arrayBuffer);
    const arrowTable = convertMeshToTable(mesh, 'arrow-table');
    return arrowTable;
  }
} as const satisfies LoaderWithParser<ArrowTable, never, LASLoaderOptions>;
