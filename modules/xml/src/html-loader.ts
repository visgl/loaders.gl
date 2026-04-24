// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader} from '@loaders.gl/loader-utils';
import {XMLLoader, type XMLLoaderOptions} from './xml-loader';

export type HTMLLoaderOptions = XMLLoaderOptions;

/** Preloads the parser-bearing HTML loader implementation. */
async function preload() {
  const {HTMLLoaderWithParser} = await import('./html-loader-with-parser');
  return HTMLLoaderWithParser;
}

/**
 * Metadata-only loader for HTML files.
 */
export const HTMLLoader = {
  ...XMLLoader,
  name: 'HTML',
  id: 'html',
  text: true,
  extensions: ['html', 'htm'],
  mimeTypes: ['text/html'],
  testText: testHTMLFile,
  preload
} as const satisfies Loader<any, never, HTMLLoaderOptions>;

function testHTMLFile(text: string): boolean {
  // TODO - There could be space first.
  return text.startsWith('<html');
}
