// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {XMLLoaderOptions} from '@loaders.gl/documents/xml';
import {parseXMLSync} from '@loaders.gl/documents/xml-parser';
import {XMLLoader} from '@loaders.gl/documents/xml';

/** Parses XML text with XMLLoader defaults without requiring a parser-bearing loader object. */
export function parseXMLTextSync(text: string, options?: XMLLoaderOptions): any {
  return parseXMLSync(text, {...XMLLoader.options.xml, ...options?.xml});
}
