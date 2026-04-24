// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderOptions, LoaderWithParser} from '@loaders.gl/loader-utils';
import type {PCDMesh} from './lib/pcd-types';
import {parsePCD} from './lib/parse-pcd';
import {PCDWorkerLoader as PCDWorkerLoaderMetadata} from './pcd-loader';
import {PCDLoader as PCDLoaderMetadata} from './pcd-loader';

const {preload: _PCDWorkerLoaderPreload, ...PCDWorkerLoaderMetadataWithoutPreload} =
  PCDWorkerLoaderMetadata;
const {preload: _PCDLoaderPreload, ...PCDLoaderMetadataWithoutPreload} = PCDLoaderMetadata;

export type PCDLoaderOptions = LoaderOptions & {
  pcd?: {
    /** Override the URL to the worker bundle (by default loads from unpkg.com) */
    workerUrl?: string;
  };
};

/**
 * Worker loader for PCD - Point Cloud Data
 */
export const PCDWorkerLoaderWithParser = {
  ...PCDWorkerLoaderMetadataWithoutPreload
} as const satisfies Loader<PCDMesh, never, PCDLoaderOptions>;

/**
 * Loader for PCD - Point Cloud Data
 */
export const PCDLoaderWithParser = {
  ...PCDLoaderMetadataWithoutPreload,
  parse: async arrayBuffer => parsePCD(arrayBuffer),
  parseSync: parsePCD
} as const satisfies LoaderWithParser<PCDMesh, never, LoaderOptions>;
