// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test, vi} from 'vitest';
import {
  BearerTokenAuthentication,
  QueryParameterAuthentication,
  createAuthenticatedFetch,
  createBearerTokenCredential,
  getAuthenticatedFetch,
  redactCredentialURL,
  resolveAuthenticationOptions,
  resolveCredentials,
  resolveLoaderAuthenticationOptions,
  canParseWithWorker
} from '@loaders.gl/loader-utils';
import type {
  AuthenticationConstructor,
  AuthenticationRequest,
  Credential,
  Loader,
  RequestAuthentication,
  FetchLike
} from '@loaders.gl/loader-utils';

const ORIGIN = 'https://tiles.example.com';

/** Creates a scoped callback credential with deterministic defaults for each test. */
function createSigner(overrides: Partial<RequestAuthentication> = {}): RequestAuthentication {
  return {
    id: 'signer',
    type: 'request',
    origins: [ORIGIN],
    authenticate: ({url, options}) => ({url, options}),
    ...overrides
  };
}

describe('declarative authentication', () => {
  test('instantiates JSON declarations and preserves existing credential identity and order', () => {
    const existing = createBearerTokenCredential({id: 'existing', origins: [ORIGIN], token: 'old'});
    const declarations = JSON.parse(
      JSON.stringify([
        {type: 'bearer-token', id: 'bearer', origins: [ORIGIN], token: 'new'},
        {
          type: 'query-parameter',
          id: 'query',
          origins: [ORIGIN],
          parameterName: 'key',
          token: 'value'
        }
      ])
    );
    const resolved = resolveCredentials(
      [existing, ...declarations],
      [BearerTokenAuthentication, QueryParameterAuthentication]
    );
    expect(resolved[0]).toBe(existing);
    expect(resolved[1]).toBeInstanceOf(BearerTokenAuthentication);
    expect(resolved[2]).toMatchObject({type: 'query-parameter', name: 'key', token: 'value'});
    expect(resolveCredentials(resolved)).toBe(resolved);
    expect(declarations[0].type).toBe('bearer-token');
  });

  test('supports custom classes, application precedence and asynchronous loader discovery', async () => {
    const construct = vi.fn();
    /** Tracks construction while retaining the built-in credential contract. */
    class CustomAuthentication extends BearerTokenAuthentication {
      /** Creates and counts a credential instance. */
      constructor(options: ConstructorParameters<typeof BearerTokenAuthentication>[0]) {
        super(options);
        construct();
      }
    }
    const hook = vi.fn(async () => [BearerTokenAuthentication]);
    const loader = {getAuthentications: hook} as unknown as Loader;
    const original = {
      core: {
        authentications: [CustomAuthentication],
        credentials: [{type: 'bearer-token', id: 'custom', origins: [ORIGIN], token: 'secret'}]
      }
    };
    const resolved = await resolveLoaderAuthenticationOptions(loader, `${ORIGIN}/root`, original);
    expect(resolved.core.credentials[0]).toBeInstanceOf(CustomAuthentication);
    expect(original.core.credentials[0].type).toBe('bearer-token');
    expect(construct).toHaveBeenCalledTimes(1);
    expect(await resolveLoaderAuthenticationOptions(loader, `${ORIGIN}/child`, resolved)).toBe(
      resolved
    );
    expect(hook).toHaveBeenCalledTimes(1);
    expect(resolveAuthenticationOptions({})).toEqual({});
    expect(
      await resolveLoaderAuthenticationOptions(undefined, '', {core: {credentials: []}})
    ).toEqual({core: {credentials: []}});
  });

  test('reports missing types, invalid configurations and invalid class results without secrets', () => {
    expect(() => resolveCredentials([{type: 'secret-unregistered-type', token: 'secret'}])).toThrow(
      'index 0'
    );
    expect(() =>
      resolveCredentials([{type: 'bearer-token', token: 'secret'}], [BearerTokenAuthentication])
    ).toThrow('Invalid authentication configuration at index 0.');
    /** Deliberately omits the runtime credential contract. */
    class InvalidAuthentication {
      /** Declarative registry discriminator. */
      static type = 'invalid';
    }
    expect(() =>
      resolveCredentials(
        [{type: 'invalid'}],
        [InvalidAuthentication as unknown as AuthenticationConstructor]
      )
    ).toThrow('invalid credential at index 0');
    expect(() => resolveCredentials([null as unknown as Credential])).toThrow('index 0');
  });

  test('resolves a callback class from JSON and reuses it across requests', async () => {
    const construct = vi.fn();
    /** Example application-owned signing implementation. */
    class ApplicationAuthentication implements RequestAuthentication {
      /** Declarative registry discriminator. */
      static type = 'application-signer';
      /** Runtime request callback discriminator. */
      readonly type = 'request';
      /** Stable credential identifier. */
      readonly id = 'application';
      /** Exact input origins eligible for signing. */
      readonly origins = [ORIGIN];
      /** Application-owned signing configuration. */
      readonly configuration: {key: string};
      /** Retains configuration and records construction. */
      constructor(configuration: {key: string}) {
        this.configuration = configuration;
        construct();
      }
      /** Signs each path independently. */
      authenticate({url, options}: AuthenticationRequest) {
        const headers = new Headers(options.headers);
        headers.set('x-signature', `${new URL(url).pathname}:${this.configuration.key}`);
        return {url, options: {...options, headers}};
      }
    }
    const transport = vi.fn<FetchLike>(async () => new Response('ok'));
    const fetch = getAuthenticatedFetch({
      core: {
        fetch: transport,
        authentications: [ApplicationAuthentication],
        credentials: [{type: 'application-signer', key: 'value'}]
      }
    });
    await fetch(`${ORIGIN}/one`);
    await fetch(`${ORIGIN}/two`);
    expect(construct).toHaveBeenCalledTimes(1);
    expect(new Headers(transport.mock.calls[1][1]?.headers).get('x-signature')).toBe('/two:value');
  });
});

describe('request authentication callbacks', () => {
  test('request defaults without credentials preserve URLs and immediate transport invocation', async () => {
    const transport = vi.fn<FetchLike>(async () => new Response('ok'));
    const fetch = createAuthenticatedFetch({
      fetch: transport,
      credentials: [],
      fetchOptions: {headers: {'x-default': 'value'}}
    });
    const request = fetch('https:/example.com/path');
    expect(transport).toHaveBeenCalledTimes(1);
    expect(transport.mock.calls[0][0]).toBe('https:/example.com/path');
    expect(new Headers(transport.mock.calls[0][1]?.headers).get('x-default')).toBe('value');
    await request;
  });

  test('signs final headers, query tokens, method and body without mutating caller options', async () => {
    const controller = new AbortController();
    const body = 'payload';
    const headers = new Headers({Range: 'bytes=0-9'});
    const authenticate = vi.fn(({url, options}: AuthenticationRequest) => {
      expect(new Headers(options.headers).get('content-type')).toBe('text/plain');
      expect(new Headers(options.headers).get('range')).toBe('bytes=0-9');
      expect(new Headers(options.headers).get('authorization')).toBe('Bearer token');
      expect(options.method).toBe('PUT');
      expect(options.body).toBe(body);
      const signedHeaders = new Headers(options.headers);
      signedHeaders.set('x-signature', 'signed');
      return {url: `${url}?signature=signed`, options: {...options, headers: signedHeaders}};
    });
    const transport = vi.fn<FetchLike>(async () => new Response('ok'));
    const fetch = createAuthenticatedFetch({
      fetch: transport,
      fetchOptions: {method: 'PUT', headers: {'content-type': 'text/plain'}},
      credentials: [
        createSigner({authenticate}),
        createBearerTokenCredential({id: 'bearer', origins: [ORIGIN], token: 'token'})
      ]
    });
    await fetch(`${ORIGIN}/tile`, {headers, body, signal: controller.signal});
    expect(transport.mock.calls[0][0]).toBe(`${ORIGIN}/tile?signature=signed`);
    expect(transport.mock.calls[0][1]?.signal).toBe(controller.signal);
    expect(headers.has('x-signature')).toBe(false);
    expect(authenticate).toHaveBeenCalledTimes(1);
  });

  test('rewrites custom URLs and scopes callbacks to exact authorities', async () => {
    const authenticate = vi.fn(({url, options}: AuthenticationRequest) => ({
      url: url.replace('s3://my-bucket/', `${ORIGIN}/`),
      options
    }));
    const transport = vi.fn<FetchLike>(async () => new Response('ok'));
    const fetch = createAuthenticatedFetch({
      fetch: transport,
      credentials: [createSigner({origins: ['s3://my-bucket'], authenticate})]
    });
    await fetch('s3://my-bucket/one');
    await fetch('s3://another-bucket/two');
    await fetch('s3://my-bucket.evil/three');
    await fetch('/relative');
    expect(authenticate).toHaveBeenCalledTimes(1);
    expect(transport.mock.calls.map(call => call[0])).toEqual([
      `${ORIGIN}/one`,
      's3://another-bucket/two',
      's3://my-bucket.evil/three',
      '/relative'
    ]);
  });

  test.each([
    'https://tiles.example.com/path',
    'not a url',
    'https://user:pass@example.com',
    'data:text/plain,foo'
  ])('rejects invalid scope %s', origin => {
    expect(() =>
      createAuthenticatedFetch({credentials: [createSigner({origins: [origin]})]})
    ).toThrow('origin');
  });

  test('rejects empty scopes and malformed callback results', async () => {
    expect(() => createAuthenticatedFetch({credentials: [createSigner({origins: []})]})).toThrow(
      'origin'
    );
    const fetch = createAuthenticatedFetch({
      credentials: [createSigner({authenticate: () => null as never})]
    });
    await expect(fetch(`${ORIGIN}/tile`)).rejects.toThrow('invalid request');
  });

  test('composes callbacks in order and does not double-sign nested authenticated fetches', async () => {
    const order: string[] = [];
    const first = createSigner({
      authenticate: ({url, options}) => {
        order.push('first');
        return {url, options};
      }
    });
    const second = createSigner({
      authenticate: ({url, options}) => {
        order.push('second');
        return {url, options};
      }
    });
    const transport = vi.fn<FetchLike>(async () => new Response('ok'));
    const credentials = [first];
    const parent = createAuthenticatedFetch({fetch: transport, credentials});
    expect(createAuthenticatedFetch({fetch: parent, credentials})).toBe(parent);
    const nested = createAuthenticatedFetch({fetch: parent, credentials: [first, second]});
    await nested(`${ORIGIN}/tile`);
    expect(order).toEqual(['first', 'second']);
    expect(transport).toHaveBeenCalledTimes(1);
  });

  test('re-signs the original unsigned request once on an opted-in failure', async () => {
    const authenticate = vi.fn(({url, options, reason, response}: AuthenticationRequest) => {
      expect(url).toBe(`${ORIGIN}/tile`);
      if (reason === 'retry') expect(response?.status).toBe(403);
      return {url: `${url}?signature=${reason}`, options};
    });
    const transport = vi.fn<FetchLike>(async () => new Response('denied', {status: 403}));
    const fetch = createAuthenticatedFetch({
      fetch: transport,
      credentials: [createSigner({authenticate, refreshStatusCodes: [403]})]
    });
    const response = await fetch(`${ORIGIN}/tile`);
    expect(response.status).toBe(403);
    expect(transport.mock.calls.map(call => call[0])).toEqual([
      `${ORIGIN}/tile?signature=request`,
      `${ORIGIN}/tile?signature=retry`
    ]);
    expect(authenticate).toHaveBeenCalledTimes(2);
  });

  test('nested wrappers reuse declarations without sharing instances across independent transports', async () => {
    const constructed = vi.fn();
    const signed = vi.fn();
    /** Tracks the lifetime of an application-provided declarative signer. */
    class SigningAuthentication implements RequestAuthentication {
      /** Declarative registry discriminator. */
      static readonly type = 'test-signer';
      /** Callback runtime discriminator. */
      readonly type = 'request';
      /** Allowed signing destination. */
      readonly origins = [ORIGIN];
      /** Identifier supplied in the declaration. */
      readonly id: string;
      /** Records construction from a single declaration. */
      constructor(configuration: {id: string}) {
        this.id = configuration.id;
        constructed(this.id);
      }
      /** Appends one deterministic signature for this credential. */
      authenticate({url, options}: AuthenticationRequest) {
        signed(this.id);
        const target = new URL(url);
        target.searchParams.append('signature', this.id);
        return {url: target.href, options};
      }
    }
    const transport = vi.fn<FetchLike>(async () => new Response('ok'));
    const credentials = [{type: 'test-signer', id: 'first'}];
    const authentications = [SigningAuthentication];
    const parent = createAuthenticatedFetch({fetch: transport, credentials, authentications});
    expect(createAuthenticatedFetch({fetch: parent, credentials, authentications})).toBe(parent);
    const nested = createAuthenticatedFetch({
      fetch: parent,
      credentials: [...credentials],
      authentications,
      fetchOptions: {headers: {'x-default': 'value'}}
    });
    await nested(`${ORIGIN}/one`);
    expect(transport.mock.calls[0][0]).toBe(`${ORIGIN}/one?signature=first`);
    expect(constructed).toHaveBeenCalledTimes(1);
    expect(signed).toHaveBeenCalledTimes(1);

    const additional = {type: 'test-signer', id: 'second'};
    const extended = createAuthenticatedFetch({
      fetch: nested,
      credentials: [additional, ...credentials],
      authentications
    });
    await extended(`${ORIGIN}/two`);
    expect(transport.mock.calls[1][0]).toBe(`${ORIGIN}/two?signature=second&signature=first`);
    expect(constructed).toHaveBeenCalledTimes(2);
    expect(signed.mock.calls.map(([id]) => id)).toEqual(['first', 'second', 'first']);

    createAuthenticatedFetch({fetch: transport, credentials, authentications});
    expect(constructed).toHaveBeenCalledTimes(3);
    expect(credentials[0]).toEqual({type: 'test-signer', id: 'first'});
  });

  test.each(['POST', 'PATCH'])('does not replay unsafe %s requests', async method => {
    const transport = vi.fn<FetchLike>(async () => new Response(null, {status: 403}));
    const fetch = createAuthenticatedFetch({
      fetch: transport,
      credentials: [createSigner({refreshStatusCodes: [403]})]
    });
    await fetch(`${ORIGIN}/tile`, {method});
    expect(transport).toHaveBeenCalledTimes(1);
  });

  test('does not retry callbacks by default and respects a callback changing the method', async () => {
    const transport = vi.fn<FetchLike>(async () => new Response(null, {status: 403}));
    await createAuthenticatedFetch({fetch: transport, credentials: [createSigner()]})(
      `${ORIGIN}/tile`
    );
    await createAuthenticatedFetch({
      fetch: transport,
      credentials: [
        createSigner({
          refreshStatusCodes: [403],
          authenticate: ({url, options}) => ({url, options: {...options, method: 'POST'}})
        })
      ]
    })(`${ORIGIN}/tile`);
    expect(transport).toHaveBeenCalledTimes(2);
  });

  test('does not send a request aborted during asynchronous signing', async () => {
    const controller = new AbortController();
    const transport = vi.fn<FetchLike>(async () => new Response('ok'));
    const fetch = createAuthenticatedFetch({
      fetch: transport,
      credentials: [
        createSigner({
          authenticate: async ({url, options}) => {
            controller.abort();
            return {url, options};
          }
        })
      ]
    });
    await expect(fetch(`${ORIGIN}/tile`, {signal: controller.signal})).rejects.toMatchObject({
      name: 'AbortError'
    });
    await expect(fetch(`${ORIGIN}/tile`, {signal: controller.signal})).rejects.toMatchObject({
      name: 'AbortError'
    });
    expect(transport).not.toHaveBeenCalled();
  });

  test('keeps callback parsing on the caller and redacts arbitrary signing parameters', () => {
    const credential = createSigner();
    expect(
      canParseWithWorker({id: 'json', worker: true} as Loader, {
        core: {credentials: [credential], _nodeWorkers: true}
      })
    ).toBe(false);
    const redacted = redactCredentialURL(
      `${ORIGIN}/tile?X-Amz-Signature=secret&X-Amz-Credential=secret`,
      [credential]
    );
    expect(redacted).not.toContain('secret');
  });
});
