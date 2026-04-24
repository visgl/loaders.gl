// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {DeserializeOptions} from 'bson';
import * as BSON from 'bson';

export type ParseBSONOptions = DeserializeOptions;

/**
 * Parses a BSON binary payload synchronously.
 * @param value - BSON-encoded binary data.
 * @param options - BSON deserialization options.
 * @returns Parsed BSON document.
 */
export function parseBSONSync(
  value: ArrayBuffer,
  options?: ParseBSONOptions
): Record<string, unknown> {
  const parsedData = BSON.deserialize(new Uint8Array(value), options);
  return parsedData;
}
