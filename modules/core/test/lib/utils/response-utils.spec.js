import test from 'tape-promise/tape';
import {isBrowser} from '@loaders.gl/core';
import {
  makeResponse,
  checkResponse,
  checkResponseSync
} from '@loaders.gl/core/lib/utils/response-utils';

test('Response', async (t) => {
  const response = new Response('abc');
  const text = await response.text();
  t.equal(text, 'abc');
  t.end();
});

test('makeResponse', async (t) => {
  const response = await makeResponse('abc');
  t.equal(response.headers.get('content-length'), '3', 'content-length was set by makeResponse');
  const text = await response.text();
  t.equal(text, 'abc', 'could be read as text');
  t.rejects(() => response.text(), 'refuses to read as text a second time');
  t.end();
});

test('makeResponse(File)', async (t) => {
  const file = new File(['abc'], 'foo.txt', {
    type: 'text/plain'
  });
  const response = await makeResponse(file);
  t.equal(
    response.headers.get('content-length'),
    '3',
    '"content-length" header was set by makeResponse'
  );
  t.equal(
    response.headers.get('content-type'),
    'text/plain',
    '"content-type" header was set by makeResponse'
  );
  t.equal(response.url, 'foo.txt', 'response.url was set by Response constructor');

  // TODO - File polyfills do not yet work for these
  if (isBrowser) {
    t.equal(
      response.headers.get('x-first-bytes'),
      'data:application/octet-stream;base64,YWJj',
      '"x-first-bytes" header was set by makeResponse'
    );

    const text = await response.text();
    t.equal(text, 'abc', 'could be read as text');
  }

  t.end();
});

test('checkResponseSync', (t) => {
  const response = new Response('{message: "server died"}', {status: 500});
  t.equal(response.ok, false, 'Check reponse.ok');
  t.throws(() => checkResponseSync(response), /500/, 'Check reponse throws');
  // t.throws()
  t.end();
});

test('checkResponse', async (t) => {
  const response = new Response('{message: "server died"}', {status: 500});
  t.equal(response.ok, false, 'Check reponse.ok');
  t.rejects(() => checkResponse(response), /500/, 'Check reponse throws');
  // t.throws()
  t.end();
});
