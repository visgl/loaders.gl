// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, StrictLoaderOptions} from '@loaders.gl/loader-utils';
import type {Texture} from '@loaders.gl/schema';
import {VERSION} from './lib/utils/version';
import type {RadianceHDRMetadata} from './lib/parsers/parse-hdr';

export type RadianceHDRLoaderOptions = StrictLoaderOptions & {
  hdr?: {};
};

/** Preloads the parser-bearing Radiance HDR loader implementation. */
async function preload() {
  const {RadianceHDRLoaderWithParser} = await import('./radiance-hdr-loader-with-parser');
  return RadianceHDRLoaderWithParser;
}

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
  preload
} as const satisfies Loader<Texture<RadianceHDRMetadata>, never, RadianceHDRLoaderOptions>;

function isHDR(arrayBuffer: ArrayBuffer): boolean {
  const firstLine = new TextDecoder().decode(arrayBuffer.slice(0, 16)).split('\n')[0];
  return firstLine === '#?RADIANCE' || firstLine === '#?RGBE';
}
