// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ParseXMLOptions} from '../../xml-options';
import {uncapitalizeKeys} from '../xml-utils/uncapitalize';
import {parseXMLInternal} from './parse-xml-internal';
export type {ParseXMLOptions} from '../../xml-options';

/** Parses XML into native JavaScript objects without a third-party XML dependency. */
export function parseXMLSync(text: string, options: ParseXMLOptions = {}): any {
  if (Object.hasOwn(options, '_fastXML') || Object.hasOwn(options, '_sax')) {
    throw new Error('XML: backend-specific options were removed; use native XML options');
  }
  if (options._parser && !['internal', 'sax'].includes(options._parser)) {
    throw new Error('XML: unsupported parser backend; use the native documents parser');
  }
  const parsed = parseXMLInternal(text, options);
  return options.uncapitalizeKeys ? uncapitalizeKeys(parsed) : parsed;
}

/** Validates well-formed XML using the same native parser and returns an error when invalid. */
export function validateXML(text: string): true | Error {
  try {
    parseXMLInternal(text, {});
    return true;
  } catch (error) {
    return error instanceof Error ? error : new Error(String(error));
  }
}
