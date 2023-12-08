// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {DeserializeOptions} from 'bson';
import * as BSON from 'bson';

export type ParseBSONOptions = DeserializeOptions;

export function parseBSONSync(
  value: ArrayBuffer,
  options?: ParseBSONOptions
): Record<string, unknown> {
  const parsedData = BSON.deserialize(new Uint8Array(value), options);
  return parsedData;
}
