// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import type {Geometry} from '@loaders.gl/schema';
import {convertWKBToBinaryGeometry, decodeHex} from '@loaders.gl/gis';

import type {WKBLoaderOptions} from './wkb-loader';
import {WKBLoader} from './wkb-loader';
import {VERSION} from './lib/version';

export type HexWKBLoaderOptions = WKBLoaderOptions;

/**
 * Worker loader for Hex-encoded WKB (Well-Known Binary)
 */
export const HexWKBLoader = {
  dataType: null as unknown as Geometry,
  batchType: null as never,
  name: 'Hexadecimal WKB',
  id: 'wkb',
  module: 'wkt',
  version: VERSION,
  worker: true,
  category: 'geometry',
  extensions: ['wkb'],
  mimeTypes: [],
  options: WKBLoader.options,
  text: true,
  testText: isHexWKB,
  // TODO - encoding here seems wasteful - extend hex transcoder?
  parse: async (arrayBuffer: ArrayBuffer) => parseHexWKB(new TextDecoder().decode(arrayBuffer)),
  parseTextSync: parseHexWKB
} as const satisfies LoaderWithParser<Geometry, never, HexWKBLoaderOptions>;

function parseHexWKB(text: string, options?: HexWKBLoaderOptions): Geometry {
  const uint8Array = decodeHex(text);
  const binaryGeometry = convertWKBToBinaryGeometry(uint8Array.buffer); // , options?.wkb);
  return binaryGeometry;
}

/**
 * Check if string is a valid Well-known binary (WKB) in HEX format
 * https://en.wikipedia.org/wiki/Well-known_text_representation_of_geometry
 *
 * @param str input string
 * @returns true if string is a valid WKB in HEX format
 * @todo Avoid costly regex check
 */
export function isHexWKB(string: string | null): boolean {
  if (!string) {
    return false;
  }
  // check if the length of the string is even and is at least 10 characters long
  if (string.length < 10 || string.length % 2 !== 0) {
    return false;
  }
  // check if first two characters are 00 or 01
  if (!string.startsWith('00') && !string.startsWith('01')) {
    return false;
  }
  // check if the rest of the string is a valid hex
  return /^[0-9a-fA-F]+$/.test(string.slice(2));
}
