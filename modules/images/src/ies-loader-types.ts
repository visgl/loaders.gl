// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import {VERSION} from './lib/utils/version';
import type {IESProfile} from './ies/parse-ies';
/** Loads the IES parser on demand. */
async function preload() {
  const {IESLoaderWithParser} = await import('@loaders.gl/images/ies-loader');
  return IESLoaderWithParser;
}
/** Metadata-only IES Type C photometric profile loader. */
export const IESLoader = {
  name: 'IES',
  id: 'ies',
  module: 'images',
  version: VERSION,
  extensions: ['ies'],
  mimeTypes: ['application/x-ies'],
  text: true,
  dataType: null as unknown as IESProfile,
  batchType: null as never,
  options: {},
  preload
} as const;
