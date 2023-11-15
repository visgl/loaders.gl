// loaders.gl, MIT license
// Copyright (c) vis.gl contributors

import type {DeserializeOptions} from 'bson';
import {deserialize} from 'bson';

export type ParseBSONOptions = DeserializeOptions;

export function parseBSONSync(
  value: ArrayBuffer,
  options?: ParseBSONOptions
): Record<string, unknown> {
  const parsedData = deserialize(new Uint8Array(value), options);
  return parsedData;
}
