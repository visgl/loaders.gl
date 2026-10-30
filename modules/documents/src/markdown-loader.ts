// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser} from '@loaders.gl/core/loader-utils';
import {MarkdownLoader} from './markdown-loader-types';
import type {MarkdownDocument, MarkdownLoaderOptions} from './markdown-types';
import {parseMarkdownSync} from './lib/parsers/parse-markdown';

const {preload: _preload, ...metadata} = MarkdownLoader;

/** Parses UTF-8 Markdown bytes asynchronously. */
async function parse(
  data: ArrayBuffer,
  options?: MarkdownLoaderOptions
): Promise<MarkdownDocument> {
  return parseMarkdownSync(new TextDecoder().decode(data), options?.markdown);
}

/** Parses Markdown text into a rendering-independent syntax tree. */
function parseTextSync(text: string, options?: MarkdownLoaderOptions): MarkdownDocument {
  return parseMarkdownSync(text, options?.markdown);
}

/** Parser-bearing loader for the documented Markdown subset. */
export const MarkdownLoaderWithParser = {
  ...metadata,
  parse,
  parseTextSync
} as const satisfies LoaderWithParser<MarkdownDocument, never, MarkdownLoaderOptions>;
