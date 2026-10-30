// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser} from '@loaders.gl/core/loader-utils';
import {JSONLoader, type JSONLoaderOptions} from './json-loader-types';

const {preload: _preload, ...metadata} = JSONLoader;

/** Parses one JSON text, accepting a leading Unicode byte order mark. */
function parseTextSync(text: string): unknown {
  return JSON.parse(text.replace(/^\uFEFF/, ''));
}

/** Parses UTF-8 JSON bytes, without table materialization. */
async function parse(data: ArrayBuffer): Promise<unknown> {
  return parseTextSync(new TextDecoder().decode(data));
}

/** Native parser-bearing generic JSON loader. */
export const JSONLoaderWithParser = {
  ...metadata,
  parse,
  parseTextSync
} as const satisfies LoaderWithParser<unknown, never, JSONLoaderOptions>;
