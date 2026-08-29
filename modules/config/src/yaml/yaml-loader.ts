// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import {parseYAMLSync} from './lib/parsers/parse-yaml';
import {YAMLLoader as YAMLLoaderMetadata} from './yaml-loader-types';
import type {YAMLLoaderOptions} from './yaml-loader-options';

const {preload: _YAMLLoaderPreload, ...YAMLLoaderMetadataWithoutPreload} = YAMLLoaderMetadata;

/** Parser-bearing loader for YAML documents. */
export const YAMLLoaderWithParser = {
  ...YAMLLoaderMetadataWithoutPreload,
  parse,
  parseTextSync
} as const satisfies LoaderWithParser<unknown, never, YAMLLoaderOptions>;

/** Parses a YAML document from an ArrayBuffer. */
async function parse(arrayBuffer: ArrayBuffer, options?: YAMLLoaderOptions): Promise<unknown> {
  return parseTextSync(new TextDecoder().decode(arrayBuffer), options);
}

/** Parses a YAML document synchronously from text. */
function parseTextSync(text: string, options?: YAMLLoaderOptions): unknown {
  return parseYAMLSync(text, options?.yaml);
}

export type {YAMLLoaderOptions} from './yaml-loader-options';
