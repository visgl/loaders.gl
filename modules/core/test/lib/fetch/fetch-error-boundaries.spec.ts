// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {
  getErrorMessageFromResponse,
  getErrorMessageFromResponseSync
} from '../../../src/lib/fetch/fetch-error-message';
import {
  checkFetchResponseStatus,
  checkFetchResponseStatusSync
} from '../../../src/lib/loader-utils/check-errors';

test('fetch error helpers format JSON, text, HTML, and unreadable responses', async () => {
  const jsonResponse = new Response('{"error":"bad"}', {
    status: 400,
    statusText: 'Bad Request',
    headers: {'Content-Type': 'application/json'}
  });
  expect(await getErrorMessageFromResponse(jsonResponse)).toContain('{"error":"bad"}');
  expect(getErrorMessageFromResponseSync(jsonResponse)).toContain('400');

  const textResponse = new Response('plain failure', {status: 500, statusText: 'Server Error'});
  expect(await getErrorMessageFromResponse(textResponse)).toContain('Server Error');
  await expect(checkFetchResponseStatus(textResponse)).rejects.toThrow(/plain fail/);

  const htmlResponse = new Response('<pre>precise failure</pre>', {status: 503});
  await expect(checkFetchResponseStatus(htmlResponse)).rejects.toThrow('precise failure');
  expect(() => checkFetchResponseStatusSync(new Response(null, {status: 404}))).toThrow(
    'fetch failed 404'
  );
  await expect(
    checkFetchResponseStatus(new Response(null, {status: 204}))
  ).resolves.toBeUndefined();
  expect(() => checkFetchResponseStatusSync(new Response(null, {status: 204}))).not.toThrow();

  const unreadableResponse = {
    url: 'memory://error',
    status: 500,
    statusText: 'Unreadable',
    headers: new Headers({'Content-Type': 'application/json'}),
    text: async () => {
      throw new Error('body unavailable');
    }
  } as Response;
  expect(await getErrorMessageFromResponse(unreadableResponse)).toContain('memory://error');
});
