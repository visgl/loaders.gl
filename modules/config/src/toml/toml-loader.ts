// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import {parseTOMLSync} from './lib/parsers/parse-toml';
import {TOMLLoader as TOMLLoaderMetadata} from './toml-loader-types';
import type {TOMLLoaderOptions} from './toml-loader-options';

const {preload: _TOMLLoaderPreload, ...TOMLLoaderMetadataWithoutPreload} = TOMLLoaderMetadata;

/** Parser-bearing loader for TOML documents. */
export const TOMLLoaderWithParser = {
  ...TOMLLoaderMetadataWithoutPreload,
  parse,
  parseTextSync
} as const satisfies LoaderWithParser<unknown, never, TOMLLoaderOptions>;

/** Parses a TOML document from an ArrayBuffer. */
async function parse(arrayBuffer: ArrayBuffer, options?: TOMLLoaderOptions): Promise<unknown> {
  return parseTextSync(new TextDecoder().decode(arrayBuffer), options);
}

/** Parses a TOML document synchronously from text. */
function parseTextSync(text: string, options?: TOMLLoaderOptions): unknown {
  return parseTOMLSync(text, options?.toml);
}

export type {TOMLLoaderOptions} from './toml-loader-options';
