import {expect, test} from 'vitest';
import {isBrowser} from '@loaders.gl/core';
import {
  getResourceUrl,
  getResourceMIMEType,
  getResourceContentLength
} from '@loaders.gl/core/lib/utils/resource-utils';

const DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACAQMAAABIeJ9nAAAABGdBTUEAALGPC/xhBQAAAAFzUkdCAK7OHOkAAAAGUExURf///wAAAFXC034AAAAMSURBVAjXY3BgaAAAAUQAwetZAwkAAAAASUVORK5CYII=';

test('getResourceUrl', () => {
  const blob = new Blob(['abc'], {type: 'application/text'});
  const file = new File(['abc'], 'filename.csv', {type: 'text/csv'});
  const response = new Response(new Blob(['abc']), {
    status: 200,
    statusText: 'Success',
    headers: {
      'content-type': 'application/json'
    }
  });

  Object.defineProperty(response, 'url', {value: 'https://abc.com/file.json?variable=value'});

  expect(getResourceUrl(DATA_URL)).toEqual(DATA_URL);
  expect(getResourceUrl(blob)).toEqual('');
  expect(getResourceUrl(file)).toEqual('filename.csv');
  expect(getResourceUrl(response)).toEqual('https://abc.com/file.json?variable=value');
});

test('getResourceMIMEType', () => {
  const blob = new Blob(['abc'], {type: 'application/text'});
  const file = new File(['abc'], 'filename.csv', {type: 'text/csv'});
  const response = new Response(new Blob(['abc']), {
    status: 200,
    statusText: 'Success',
    headers: {
      'content-type': 'application/json'
    }
  });

  Object.defineProperty(response, 'url', {value: 'https://abc.com/file.json?variable=value'});

  expect(getResourceMIMEType(DATA_URL)).toEqual('image/png');
  expect(getResourceMIMEType(blob)).toEqual('application/text');
  expect(getResourceMIMEType(file)).toEqual('text/csv');
  expect(getResourceMIMEType(response)).toEqual('application/json');
});

test('getResourceContentLength', () => {
  expect(getResourceContentLength(new ArrayBuffer(3))).toBe(3);
  expect(getResourceContentLength('abc')).toBe(3);
});

test.runIf(isBrowser)('getResourceContentLength(Blob)', () => {
  expect(getResourceContentLength(new Blob(['abc']))).toBe(3);
});
