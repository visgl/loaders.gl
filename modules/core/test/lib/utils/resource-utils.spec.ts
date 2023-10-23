import test from 'tape-promise/tape';
import {isBrowser} from '@loaders.gl/core';
import {
  getResourceUrl,
  getResourceMIMEType,
  getResourceContentLength
} from '@loaders.gl/core/lib/utils/resource-utils';

const DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACAQMAAABIeJ9nAAAABGdBTUEAALGPC/xhBQAAAAFzUkdCAK7OHOkAAAAGUExURf///wAAAFXC034AAAAMSURBVAjXY3BgaAAAAUQAwetZAwkAAAAASUVORK5CYII=';

test('getResourceUrl', (t) => {
  const blob = new Blob(['abc'], {type: 'application/text'});
  const file = new File(['abc'], 'filename.csv', {type: 'text/csv'});
  const response = new Response(new Blob(['abc']), {
    status: 200,
    statusText: 'Success',
    headers: {
      'content-type': 'application/json'
    }
  });
  // Inject a url property for testing, since url is read only property for the Response class
  Object.defineProperty(response, 'url', {value: 'https://abc.com/file.json?variable=value'});

  t.deepEqual(getResourceUrl(DATA_URL), DATA_URL);
  t.deepEqual(getResourceUrl(blob), '');
  t.deepEqual(getResourceUrl(file), 'filename.csv');

  t.deepEqual(getResourceUrl(response), 'https://abc.com/file.json?variable=value');

  t.end();
});

test('getResourceMIMEType', (t) => {
  const blob = new Blob(['abc'], {type: 'application/text'});
  const file = new File(['abc'], 'filename.csv', {type: 'text/csv'});
  const response = new Response(new Blob(['abc']), {
    status: 200,
    statusText: 'Success',
    headers: {
      'content-type': 'application/json'
    }
  });
  // Inject a url property for testing, since url is read only property for the Response class
  Object.defineProperty(response, 'url', {value: 'https://abc.com/file.json?variable=value'});

  t.deepEqual(getResourceMIMEType(DATA_URL), 'image/png');
  t.deepEqual(getResourceMIMEType(blob), 'application/text');
  t.deepEqual(getResourceMIMEType(file), 'text/csv');

  t.deepEqual(getResourceMIMEType(response), 'application/json');

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
