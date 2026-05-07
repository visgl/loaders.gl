// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderOptions, LoaderWithParser} from '@loaders.gl/loader-utils';
import {parseRADHeader} from './lib/parse-rad';
import type {RADMetadata} from './lib/parse-rad';
import {RADLoader as RADLoaderMetadata} from './rad-loader-types';

const {preload: _RADLoaderPreload, ...RADLoaderMetadataWithoutPreload} = RADLoaderMetadata;

/** Parser-bearing loader for Spark `.rad` paged LoD Gaussian splat container metadata. */
export const RADLoaderWithParser = {
  ...RADLoaderMetadataWithoutPreload,
  parse: async (arrayBuffer: ArrayBuffer) => parseRADHeader(arrayBuffer),
  parseSync: (arrayBuffer: ArrayBuffer) => parseRADHeader(arrayBuffer)
} as const satisfies LoaderWithParser<RADMetadata, never, LoaderOptions>;
