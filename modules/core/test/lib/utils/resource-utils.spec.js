/* global Blob */
import test from 'tape-promise/tape';
import {isBrowser} from '@loaders.gl/core';
import {
  getResourceUrlAndType,
  getResourceContentLength
} from '@loaders.gl/core/lib/utils/resource-utils';

const DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACAQMAAABIeJ9nAAAABGdBTUEAALGPC/xhBQAAAAFzUkdCAK7OHOkAAAAGUExURf///wAAAFXC034AAAAMSURBVAjXY3BgaAAAAUQAwetZAwkAAAAASUVORK5CYII=';

test('getResourceUrlAndType', t => {
  t.deepEqual(getResourceUrlAndType(DATA_URL), {type: 'image/png', url: DATA_URL});

  if (isBrowser) {
    const blob = new Blob(['abc'], {type: 'application/text'});
    t.deepEqual(getResourceUrlAndType(blob), {type: 'application/text', url: ''});
  }

  t.end();
});

test('getResourceContentLength', t => {
  t.equal(getResourceContentLength(new ArrayBuffer(3)), 3);
  t.equal(getResourceContentLength('abc'), 3);

  if (isBrowser) {
    t.equal(getResourceContentLength(new Blob(['abc'])), 3);
  }

  t.end();
});
