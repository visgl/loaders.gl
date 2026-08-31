// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {decodeDataUri} from '../../src/fetch/utils/decode-data-uri.node';

test.each([
  ['data:text/html;base64,PGh0bWw+', 'text/html', '<html>'],
  ['data:text/plain,important%20content!', 'text/plain', 'important content!'],
  ['data:,default', 'text/plain;charset=US-ASCII', 'default'],
  ['data:;charset=utf-8,unicode', 'text/plain;charset=utf-8', 'unicode']
])('decodeDataUri decodes MIME and payload variants', (uri, mimeType, text) => {
  const decoded = decodeDataUri(uri);
  expect(decoded.mimeType).toBe(mimeType);
  expect(new TextDecoder().decode(decoded.arrayBuffer)).toBe(text);
});
