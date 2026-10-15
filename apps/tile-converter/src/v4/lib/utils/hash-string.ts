// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {MD5Hash} from '@loaders.gl/crypto';

/** Shared synchronous calculator for converter identifiers. */
const md5Hash = new MD5Hash();
/** Encodes converter identifiers as UTF-8. */
const textEncoder = new TextEncoder();

/**
 * Computes the legacy lowercase MD5 identifier from a UTF-8 converter string.
 * @throws URIError when the input contains an unpaired surrogate, matching the legacy encoder.
 */
export function hashString(value: string): string {
  if (/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/u.test(value)) {
    throw new URIError('URI malformed');
  }
  return md5Hash.hashSync(textEncoder.encode(value).buffer, 'hex');
}
