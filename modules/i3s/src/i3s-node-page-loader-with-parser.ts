// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import type {LoaderOptions, LoaderWithParser} from '@loaders.gl/loader-utils';
import type {I3SLoaderOptions} from './i3s-loader';
import type {NodePage} from './types';
import {I3SNodePageLoader as I3SNodePageLoaderMetadata} from './i3s-node-page-loader';

const {preload: _I3SNodePageLoaderPreload, ...I3SNodePageLoaderMetadataWithoutPreload} =
  I3SNodePageLoaderMetadata;

/**
 * Loader for I3S node pages
 */
export const I3SNodePageLoaderWithParser = {
  ...I3SNodePageLoaderMetadataWithoutPreload,
  parse: parseNodePage,
  parseText: parseNodePage
} as const satisfies LoaderWithParser<NodePage, never, I3SLoaderOptions>;

async function parseNodePage(
  data: string | ArrayBuffer,
  options?: LoaderOptions
): Promise<NodePage> {
  const text = typeof data === 'string' ? data : new TextDecoder().decode(data);
  return JSON.parse(text) as NodePage;
}
