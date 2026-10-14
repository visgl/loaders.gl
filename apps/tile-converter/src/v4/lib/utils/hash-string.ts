// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {createHash} from 'node:crypto';

/**
 * Computes the legacy lowercase MD5 identifier from a UTF-8 converter string.
 * @throws URIError when the input contains an unpaired surrogate, matching the legacy encoder.
 */
export function hashString(value: string): string {
  if (/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/u.test(value)) {
    throw new URIError('URI malformed');
  }
  return createHash('md5').update(value).digest('hex');
}
