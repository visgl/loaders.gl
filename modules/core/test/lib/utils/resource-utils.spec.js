import test from 'tape-promise/tape';
import {isBrowser} from '@loaders.gl/core';
import {
  getResourceUrlAndType,
  getResourceContentLength
} from '@loaders.gl/core/lib/utils/resource-utils';

const DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACAQMAAABIeJ9nAAAABGdBTUEAALGPC/xhBQAAAAFzUkdCAK7OHOkAAAAGUExURf///wAAAFXC034AAAAMSURBVAjXY3BgaAAAAUQAwetZAwkAAAAASUVORK5CYII=';

test('getResourceUrlAndType', (t) => {
  t.deepEqual(getResourceUrlAndType(DATA_URL), {type: 'image/png', url: DATA_URL});

  const blob = new Blob(['abc'], {type: 'application/text'});
  t.deepEqual(getResourceUrlAndType(blob), {type: 'application/text', url: ''});

  const file = new File(['abc'], 'filename.csv', {type: 'text/csv'});
  t.deepEqual(getResourceUrlAndType(file), {type: 'text/csv', url: 'filename.csv'});

  const response = new Response(new Blob(['abc']), {
    status: 200,
    statusText: 'Success',
    headers: {
      'content-type': 'application/json'
    }
  });
  // Inject a url property for testing, since url is read only property for the Response class
  Object.defineProperty(response, 'url', {value: 'https://abc.com/file.json?variable=value'});

  t.deepEqual(getResourceUrlAndType(response), {
    type: 'application/json',
    url: 'https://abc.com/file.json'
  });

  t.end();
});

test('getResourceContentLength', (t) => {
  t.equal(getResourceContentLength(new ArrayBuffer(3)), 3);
  t.equal(getResourceContentLength('abc'), 3);

  if (isBrowser) {
    t.equal(getResourceContentLength(new Blob(['abc'])), 3);
  }

  t.end();
});
