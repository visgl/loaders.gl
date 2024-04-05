// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {parseMIMEType, parseMIMETypeFromURL} from '@loaders.gl/core/lib/utils/mime-type-utils';
import {compareMIMETypes} from '@loaders.gl/core/lib/utils/mime-type-utils';

const DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACAQMAAABIeJ9nAAAABGdBTUEAALGPC/xhBQAAAAFzUkdCAK7OHOkAAAAGUExURf///wAAAFXC034AAAAMSURBVAjXY3BgaAAAAUQAwetZAwkAAAAASUVORK5CYII=';

test('compareMIMETypes', (t) => {
  t.equal(compareMIMETypes('image/png', 'image/jpeg'), false);
  t.equal(compareMIMETypes('image/png', 'image/png'), true);
  t.equal(compareMIMETypes('image/png', 'image/PNG'), true);
  t.end();
});

test('parseMIMEType', (t) => {
  t.equal(parseMIMEType('image/png;'), 'image/png');
  t.equal(parseMIMEType('image/png'), 'image/png');
  t.equal(parseMIMEType('application/octet-stream;'), 'application/octet-stream');
  t.equal(parseMIMEType('text/csv;'), 'text/csv');
  t.equal(parseMIMEType('application/zip;'), 'application/zip');

  t.end();
});

test('parseMIMETypeFromURL', (t) => {
  t.equal(parseMIMETypeFromURL(DATA_URL), 'image/png');
  t.end();
});
