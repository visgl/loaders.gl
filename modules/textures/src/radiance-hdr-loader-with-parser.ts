// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser, StrictLoaderOptions} from '@loaders.gl/loader-utils';
import type {Texture} from '@loaders.gl/schema';
import type {RadianceHDRMetadata} from './lib/parsers/parse-hdr';
import {parseHDR} from './lib/parsers/parse-hdr';
import {RadianceHDRLoader as RadianceHDRLoaderMetadata} from './radiance-hdr-loader';

const {preload: _RadianceHDRLoaderPreload, ...RadianceHDRLoaderMetadataWithoutPreload} =
  RadianceHDRLoaderMetadata;

export type RadianceHDRLoaderOptions = StrictLoaderOptions & {
  hdr?: {};
};

export const RadianceHDRLoaderWithParser = {
  ...RadianceHDRLoaderMetadataWithoutPreload,
  parseSync: parseHDR,
  parse: async (arrayBuffer: ArrayBuffer) => parseHDR(arrayBuffer)
} as const satisfies LoaderWithParser<
  Texture<RadianceHDRMetadata>,
  never,
  RadianceHDRLoaderOptions
>;
