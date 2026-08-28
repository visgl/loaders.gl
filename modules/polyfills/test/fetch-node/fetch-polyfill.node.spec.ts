import http from 'node:http';
import https from 'node:https';
import {Readable} from 'node:stream';
import {gzipSync} from 'node:zlib';
import {afterEach, describe, expect, test, vi} from 'vitest';
import {createHTTPRequestReadStream, fetchNode} from '../../src/fetch/fetch-polyfill';

const originalFetch = globalThis.fetch;

describe('fetchNode polyfill', () => {
  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  test('delegates request and data URLs to an installed native fetch', async () => {
    const nativeFetch = vi.fn().mockResolvedValue(new globalThis.Response('native'));
    globalThis.fetch = nativeFetch;

    await expect(fetchNode('https://example.test/data', {})).resolves.toMatchObject({status: 200});
    await expect(fetchNode('data:text/plain,hello', {})).resolves.toMatchObject({status: 200});
    expect(nativeFetch).toHaveBeenCalledTimes(2);
  });

  test('decodes data URLs when it is the active fetch implementation', async () => {
    globalThis.fetch = fetchNode as typeof fetch;
    const response = await fetchNode('data:text/plain;base64,aGVsbG8=', {});

    expect(response.headers.get('content-type')).toBe('text/plain');
    await expect(response.text()).resolves.toBe('hello');
  });

  test('creates HTTP and HTTPS request streams with normalized options', async () => {
    const httpRequest = mockRequest(http, {statusCode: 201, statusMessage: 'Created'});
    const httpsRequest = mockRequest(https, {statusCode: undefined, statusMessage: undefined});

    const httpResponse = await createHTTPRequestReadStream('http://example.test:8080/path', {
      headers: {'X-Test': 'yes'},
      fetch: {method: 'POST'}
    });
    const httpsResponse = await createHTTPRequestReadStream('https://example.test/secure', {});

    expect(httpResponse.statusCode).toBe(201);
    expect(httpsResponse.statusCode).toBeUndefined();
    expect(httpRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        hostname: 'example.test',
        port: '8080',
        path: '/path',
        method: 'POST',
        headers: {'x-test': 'yes', 'accept-encoding': 'gzip,br,deflate'}
      }),
      expect.any(Function)
    );
    expect(httpsRequest).toHaveBeenCalledOnce();
  });

  test('follows relative redirects and synthesizes gzip metadata', async () => {
    globalThis.fetch = fetchNode as typeof fetch;
    let requestCount = 0;
    vi.spyOn(http, 'request').mockImplementation((options: any, callback: any) => {
      requestCount++;
      const response = createIncomingMessage(
        requestCount === 1
          ? {statusCode: 302, headers: {location: '/next'}}
          : {statusCode: 200, headers: {}, body: 'redirected'}
      );
      queueMicrotask(() => callback(response));
      return createRequestStub();
    });

    const redirected = await fetchNode('http://example.test/start', {});
    expect(redirected.url).toBe('http://example.test/next');
    await expect(redirected.text()).resolves.toBe('redirected');

    vi.mocked(http.request).mockRestore();
    mockRequest(http, {statusCode: 200, headers: {}, body: gzipSync('gzip bytes')});
    const gzipResponse = await fetchNode('http://example.test/data.gz', {
      followRedirect: false
    } as any);
    expect(gzipResponse.headers.get('content-encoding')).toBe('gzip');
  });

  test('can preserve redirects and converts request errors to responses', async () => {
    globalThis.fetch = fetchNode as typeof fetch;
    mockRequest(http, {statusCode: 307, headers: {location: 'https://example.test/next'}});
    const redirect = await fetchNode('http://example.test/start', {followRedirect: false} as any);
    expect(redirect.status).toBe(307);

    vi.restoreAllMocks();
    vi.spyOn(http, 'request').mockImplementation(() => {
      const listeners: Record<string, (error: Error) => void> = {};
      return {
        on(type: string, listener: (error: Error) => void) {
          listeners[type] = listener;
        },
        end() {
          listeners.error(new Error('connection failed'));
        }
      } as any;
    });
    const failure = await fetchNode('http://example.test/failure', {});
    expect(failure.status).toBe(400);
    expect(failure.statusText).toContain('connection failed');
  });
});

/** Installs a deterministic request response on a Node protocol module. */
function mockRequest(
  protocol: typeof http | typeof https,
  responseOptions: {
    statusCode?: number;
    statusMessage?: string;
    headers?: Record<string, string>;
    body?: string | Uint8Array;
  }
) {
  return vi.spyOn(protocol, 'request').mockImplementation((_options: any, callback: any) => {
    const response = createIncomingMessage(responseOptions);
    queueMicrotask(() => callback(response));
    return createRequestStub();
  });
}

/** Creates a readable IncomingMessage-compatible response double. */
function createIncomingMessage(options: {
  statusCode?: number;
  statusMessage?: string;
  headers?: Record<string, string>;
  body?: string | Uint8Array;
}) {
  const response = Readable.from([Buffer.from(options.body || '')]) as http.IncomingMessage;
  response.statusCode = options.statusCode;
  response.statusMessage = options.statusMessage;
  response.headers = options.headers || {};
  return response;
}

/** Creates the request methods used by the polyfill. */
function createRequestStub() {
  return {on: vi.fn(), end: vi.fn()} as any;
}
