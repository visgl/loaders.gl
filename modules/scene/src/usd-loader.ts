// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import {parseUSD} from './lib/parse-usd';
import type {USDLoaderOptions, USDStage} from './lib/usd-types';
import {USDLoader as USDLoaderMetadata} from './usd-loader-types';

const {preload: _USDLoaderPreload, ...USDLoaderMetadataWithoutPreload} = USDLoaderMetadata;

/** Parser-bearing loader for OpenUSD ASCII and uncompressed USDZ scenes. */
export const USDLoaderWithParser = {
  ...USDLoaderMetadataWithoutPreload,
  parse: parseUSD,
  parseText
} as const satisfies LoaderWithParser<USDStage, never, USDLoaderOptions>;

/** Encodes USDA source text before using the shared binary parser. */
async function parseText(
  text: string,
  options?: USDLoaderOptions,
  context?: Parameters<typeof parseUSD>[2]
): Promise<USDStage> {
  return parseUSD(new TextEncoder().encode(text).buffer, options, context);
}
