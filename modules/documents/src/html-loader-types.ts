// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader} from '@loaders.gl/core/loader-utils';
import {XMLLoader, type XMLLoaderOptions} from './xml-loader-types';
import {HTMLFormat} from './xml-format';

export type HTMLLoaderOptions = XMLLoaderOptions;

/** Preloads the parser-bearing HTML loader implementation. */
async function preload() {
  const {HTMLLoaderWithParser} = await import('@loaders.gl/documents/html-loader');
  return HTMLLoaderWithParser;
}

/**
 * Metadata-only loader for HTML files.
 */
export const HTMLLoader = {
  ...XMLLoader,
  ...HTMLFormat,
  testText: testHTMLFile,
  options: {xml: {...XMLLoader.options.xml, strict: false, htmlEntities: true}},
  preload
} as const satisfies Loader<any, never, HTMLLoaderOptions>;

function testHTMLFile(text: string): boolean {
  // TODO - There could be space first.
  return text.startsWith('<html');
}
