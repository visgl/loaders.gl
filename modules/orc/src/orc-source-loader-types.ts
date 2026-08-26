// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {ORCFormat} from './orc-format';
import type {ORCSourceOptions} from './orc-source-loader';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Metadata-only ORC source loader options. */
export type ORCSourceLoaderOptions = ORCSourceOptions;

/** Loads the parser-bearing ORC source implementation on demand. */
async function preloadORCSourceLoader() {
  const {ORCSourceLoaderWithParser} = await import('@loaders.gl/orc/orc-source-loader');
  return ORCSourceLoaderWithParser;
}

/** Metadata-only ORC source loader; parser code is loaded through `preload()`. */
export const ORCSourceLoader = {
  ...ORCFormat,
  name: 'ORCSourceLoader',
  version: VERSION,
  type: 'orc-source',
  fromUrl: true,
  fromBlob: true,
  options: {},
  defaultOptions: {},
  testURL: (url: string): boolean => /\.orc(?:$|[?#])/i.test(url),
  preload: preloadORCSourceLoader
} as const;
