import {expect, test, vi} from 'vitest';
import {createAuthenticatedFetch} from '@loaders.gl/loader-utils';
import {ArcGISAuthentication, createArcGISCredential} from '../src/authentication';

const ORIGIN = 'https://example.com';

test.each([
  '/sharing/rest/content/items/item',
  '/FeatureServer/0?f=json',
  '/FeatureServer/0/query',
  '/MapServer/tile/0/0/0',
  '/SceneServer/layers/0/nodes/root',
  '/SceneServer/layers/0/nodes/1/geometries/0'
])('renews HTTP 200 ArcGIS token errors for %s and preserves the response body', async path => {
  const token = vi.fn(({reason}) => (reason === 'refresh' ? 'fresh' : 'expired'));
  const transport = vi.fn(async (url: string, _options?: RequestInit) =>
    new URL(url).searchParams.get('token') === 'fresh'
      ? new Response(new Uint8Array([1, 2, 3]))
      : Response.json({error: {code: 498}})
  );
  const authenticatedFetch = createAuthenticatedFetch({
    fetch: transport,
    credentials: [new ArcGISAuthentication({origins: [ORIGIN], token})]
  });
  expect(
    new Uint8Array(await (await authenticatedFetch(`${ORIGIN}${path}`)).arrayBuffer())
  ).toEqual(new Uint8Array([1, 2, 3]));
  expect(transport).toHaveBeenCalledTimes(2);
  expect(token.mock.calls.map(([context]) => context.reason)).toEqual(['request', 'refresh']);
});

test.each([401, 403, 498, 499])('retains HTTP %i renewal with at most one replay', async status => {
  const token = vi.fn(() => 'token');
  const transport = vi.fn(
    async (_url: string, _options?: RequestInit) => new Response('', {status})
  );
  const authenticatedFetch = createAuthenticatedFetch({
    fetch: transport,
    credentials: [createArcGISCredential({origins: [ORIGIN], token})]
  });
  expect((await authenticatedFetch(`${ORIGIN}/FeatureServer`)).status).toBe(status);
  expect(transport).toHaveBeenCalledTimes(2);
});

test.each([
  [{error: {code: 403}}, 'application/json'],
  [{error: {code: 500}}, 'application/json'],
  [{features: []}, 'application/json'],
  ['invalid', 'application/json'],
  [{error: {code: 498}}, 'text/html'],
  [{text: 'x'.repeat(17000)}, 'application/json']
])('preserves non-renewable and large responses', async (body, contentType) => {
  const text = typeof body === 'string' ? body : JSON.stringify(body);
  const token = vi.fn(() => 'token');
  const authenticatedFetch = createAuthenticatedFetch({
    fetch: async () => new Response(text, {headers: {'content-type': contentType}}),
    credentials: [createArcGISCredential({origins: [ORIGIN], token})]
  });
  expect(await (await authenticatedFetch(`${ORIGIN}/FeatureServer`)).text()).toBe(text);
  expect(token).toHaveBeenCalledTimes(1);
});

test.each([
  '/FeatureServer/0/query',
  '/MapServer/2/query'
])('replays only read-only form POST queries: %s', async path => {
  const token = vi.fn(() => 'token');
  const transport = vi.fn(async (_url: string, _options?: RequestInit) =>
    Response.json({error: {code: 499}})
  );
  const authenticatedFetch = createAuthenticatedFetch({
    fetch: transport,
    credentials: [createArcGISCredential({origins: [ORIGIN], token})]
  });
  const controller = new AbortController();
  await authenticatedFetch(`${ORIGIN}${path}`, {
    method: 'POST',
    body: 'where=1%3D1',
    headers: {'content-type': 'application/x-www-form-urlencoded'},
    signal: controller.signal
  });
  expect(transport).toHaveBeenCalledTimes(2);
  expect(transport.mock.calls[1][1]).toMatchObject({
    body: 'where=1%3D1',
    signal: controller.signal
  });
});

test.each([
  ['/FeatureServer/0/applyEdits', 'application/x-www-form-urlencoded', 'x=1'],
  ['/FeatureServer/0/query', 'application/json', '{}'],
  ['/FeatureServer/0/query', 'application/x-www-form-urlencoded', new ReadableStream()]
])('never replays mutation or non-form POST requests', async (path, contentType, body) => {
  const transport = vi.fn(async (_url: string, _options?: RequestInit) =>
    Response.json({error: {code: 498}})
  );
  const authenticatedFetch = createAuthenticatedFetch({
    fetch: transport,
    credentials: [createArcGISCredential({origins: [ORIGIN], token: () => 'token'})]
  });
  await authenticatedFetch(`${ORIGIN}${path}`, {
    method: 'POST',
    body,
    headers: {'content-type': contentType}
  });
  expect(transport).toHaveBeenCalledTimes(1);
});

test('never sends credentials to a discovered untrusted host or replaces explicit tokens', async () => {
  const token = vi.fn(() => 'secret');
  const transport = vi.fn(async (_url: string, _options?: RequestInit) =>
    Response.json({error: {code: 498}})
  );
  const authenticatedFetch = createAuthenticatedFetch({
    fetch: transport,
    credentials: [createArcGISCredential({origins: [ORIGIN], token})]
  });
  await authenticatedFetch('https://other.example.com/SceneServer');
  await authenticatedFetch(`${ORIGIN}/FeatureServer?token=explicit`);
  expect(token).not.toHaveBeenCalled();
  expect(transport.mock.calls[0][0]).not.toContain('token');
  expect(transport.mock.calls[1][0]).toContain('token=explicit');
});

test('static tokens return ArcGIS failures without replay', async () => {
  const transport = vi.fn(async (_url: string, _options?: RequestInit) =>
    Response.json({error: {code: 499}})
  );
  const authenticatedFetch = createAuthenticatedFetch({
    fetch: transport,
    credentials: [createArcGISCredential({origins: [ORIGIN], token: 'static'})]
  });
  expect(await (await authenticatedFetch(`${ORIGIN}/FeatureServer`)).json()).toEqual({
    error: {code: 499}
  });
  expect(transport).toHaveBeenCalledTimes(1);
});

test('empty JSON response bodies and JSON null remain readable', async () => {
  for (const body of [null, 'null']) {
    const authenticatedFetch = createAuthenticatedFetch({
      fetch: async () => new Response(body, {headers: {'content-type': 'application/json'}}),
      credentials: [createArcGISCredential({origins: [ORIGIN], token: () => 'token'})]
    });
    expect(await (await authenticatedFetch(`${ORIGIN}/FeatureServer`)).text()).toBe(body || '');
  }
});

test('cancellation during renewal prevents replay', async () => {
  const controller = new AbortController();
  const transport = vi.fn(async () => Response.json({error: {code: 498}}));
  const authenticatedFetch = createAuthenticatedFetch({
    fetch: transport,
    credentials: [
      createArcGISCredential({
        origins: [ORIGIN],
        token: ({reason}) => {
          if (reason === 'refresh') controller.abort();
          return 'token';
        }
      })
    ]
  });
  await expect(
    authenticatedFetch(`${ORIGIN}/FeatureServer`, {signal: controller.signal})
  ).rejects.toMatchObject({name: 'AbortError'});
  expect(transport).toHaveBeenCalledTimes(1);
});
