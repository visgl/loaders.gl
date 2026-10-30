// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader} from '@loaders.gl/core/loader-utils';
import {MarkdownFormat} from './markdown-format';
import type {MarkdownDocument, MarkdownLoaderOptions} from './markdown-types';

// @ts-ignore __VERSION__ is injected by the package build.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Preloads the parser-bearing Markdown loader. */
async function preload() {
  const {MarkdownLoaderWithParser} = await import('@loaders.gl/documents/markdown-loader');
  return MarkdownLoaderWithParser;
}

/** Lightweight Markdown metadata; implementation is loaded on demand. */
export const MarkdownLoader = {
  ...MarkdownFormat,
  version: VERSION,
  dataType: null as unknown as MarkdownDocument,
  batchType: null as never,
  options: {markdown: {maxDepth: 32}},
  preload
} as const satisfies Loader<MarkdownDocument, never, MarkdownLoaderOptions>;
