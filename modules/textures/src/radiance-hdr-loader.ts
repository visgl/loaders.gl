// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser, StrictLoaderOptions} from '@loaders.gl/loader-utils';
import type {Texture} from '@loaders.gl/schema';
import {VERSION} from './lib/utils/version';
import type {RadianceHDRMetadata} from './lib/parsers/parse-hdr';
import {isHDR, parseHDR} from './lib/parsers/parse-hdr';

export type RadianceHDRLoaderOptions = StrictLoaderOptions & {
  hdr?: {};
};

export const RadianceHDRLoader = {
  dataType: null as unknown as Texture<RadianceHDRMetadata>,
  batchType: null as never,

  name: 'Radiance HDR',
  id: 'hdr',
  module: 'textures',
  version: VERSION,
  extensions: ['hdr'],
  mimeTypes: ['image/vnd.radiance', 'image/x-hdr', 'application/octet-stream'],
  binary: true,
  tests: [isHDR],
  options: {
    hdr: {}
  },
  parseSync: parseHDR,
  parse: async (arrayBuffer: ArrayBuffer) => parseHDR(arrayBuffer)
} as const satisfies LoaderWithParser<
  Texture<RadianceHDRMetadata>,
  never,
  RadianceHDRLoaderOptions
>;
