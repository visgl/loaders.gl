// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
/** Package version injected by the build. */
// @ts-ignore __VERSION__ is injected during compilation.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';
import type {NRRDData} from './nrrd/parse-nrrd';
/** Loads the attached NRRD parser on demand. */
async function preload() {
  const {NRRDLoaderWithParser} = await import('@loaders.gl/scientific/nrrd-loader');
  return NRRDLoaderWithParser;
}
/** Metadata-only attached NRRD array loader. */
export const NRRDLoader = {
  name: 'NRRD',
  id: 'nrrd',
  module: 'scientific',
  version: VERSION,
  extensions: ['nrrd'],
  mimeTypes: ['application/x-nrrd'],
  binary: true,
  dataType: null as unknown as NRRDData,
  batchType: null as never,
  options: {},
  preload
} as const;
