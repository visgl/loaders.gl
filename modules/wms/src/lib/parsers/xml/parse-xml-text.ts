// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {XMLLoaderOptions} from '@loaders.gl/xml';
import {parseXMLSync, XMLLoader} from '@loaders.gl/xml';

/** Parses XML text with XMLLoader defaults without requiring a parser-bearing loader object. */
export function parseXMLTextSync(text: string, options?: XMLLoaderOptions): any {
  return parseXMLSync(text, {...XMLLoader.options.xml, ...options?.xml});
}
