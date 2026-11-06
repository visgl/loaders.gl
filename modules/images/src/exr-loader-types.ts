import {VERSION} from './lib/utils/version';
// SPDX-License-Identifier: MIT
import type {EXRImage} from './exr/parse-exr';
/** Loads the OpenEXR parser on demand. */
async function preload() {
  const {EXRLoaderWithParser} = await import('@loaders.gl/images/exr-loader');
  return EXRLoaderWithParser;
}
/** Metadata-only single-part scanline OpenEXR loader. */
export const EXRLoader = {
  name: 'OpenEXR',
  id: 'exr',
  module: 'images',
  version: VERSION,
  extensions: ['exr'],
  mimeTypes: ['image/x-exr'],
  binary: true,
  dataType: null as unknown as EXRImage,
  batchType: null as never,
  options: {},
  preload
} as const;
