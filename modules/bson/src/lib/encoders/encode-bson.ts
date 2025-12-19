// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {SerializeOptions} from 'bson';
import * as BSON from 'bson';

export type EncodeBSONOptions = SerializeOptions;

export function encodeBSONSync(
  value: Record<string, unknown>,
  options?: EncodeBSONOptions
): ArrayBuffer {
  const uint8Array = BSON.serialize(value);
  // TODO - make sure the uint8array occupies the entire buffer.
  return uint8Array.buffer;
}
