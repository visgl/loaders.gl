// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {createDataSource, load, loadInBatches, parse} from '@loaders.gl/core';
import {BearerTokenAuthentication, DataSource} from '@loaders.gl/loader-utils';
import type {
  FetchLike,
  LoaderOptions,
  LoaderWithParser,
  RequestAuthentication,
  AuthenticationRequest,
  SourceLoader
} from '@loaders.gl/loader-utils';

const ORIGIN = 'https://tiles.example.com';

/** Application-owned signer used to verify public API propagation without an SDK. */
class TestAuthentication implements RequestAuthentication {
  /** Declarative provider name. */
  static readonly type = 'test-signing';
  /** Callback transport discriminator. */
  readonly type = 'request';
  /** Diagnostic identifier. */
  readonly id = 'test';
  /** Exact origin permitted to receive the signature. */
  readonly origins = [ORIGIN];
  /** Instantiation counter for root and nested requests. */
  static constructions = 0;
  /** Application-specific signing configuration. */
  readonly configuration: {key: string};
  /** Constructs a credential from the JSON config. */
  constructor(configuration: {key: string}) {
    this.configuration = configuration;
    TestAuthentication.constructions++;
  }
  /** Signs each individual URL with a deterministic test signature. */
  authenticate({url, options}: AuthenticationRequest) {
    const target = new URL(url);
    target.searchParams.set('signature', this.configuration.key);
    return {url: target.href, options};
  }
}

/** Parser that issues a child request through its authenticated context. */
const TestLoader = {
  id: 'authentication-test',
  name: 'Authentication test',
  module: 'core',
  version: 'test',
  extensions: ['auth'],
  mimeTypes: ['application/x-auth'],
  options: {},
  getAuthentications: () => [TestAuthentication],
  parse: async (_data, _options, context) => (await context.fetch(`${ORIGIN}/child`)).text(),
  parseInBatches: async function* (_iterator, _options, context) {
    yield (await context.fetch(`${ORIGIN}/child`)).text();
  }
} satisfies LoaderWithParser;

/** Supplies one JSON declaration and a hermetic transport. */
function getOptions(fetch: FetchLike): LoaderOptions {
  return {core: {worker: false, fetch, credentials: [{type: 'test-signing', key: 'secret'}]}};
}

test('load discovers a class before the root request and reuses its instance for child fetches', async () => {
  TestAuthentication.constructions = 0;
  const transport = vi.fn<FetchLike>(async () => new Response('loaded'));
  const options = getOptions(transport);
  expect(await load(`${ORIGIN}/root.auth`, TestLoader, options)).toBe('loaded');
  expect(transport.mock.calls.map(call => call[0])).toEqual([
    `${ORIGIN}/root.auth?signature=secret`,
    `${ORIGIN}/child?signature=secret`
  ]);
  expect(TestAuthentication.constructions).toBe(1);
  expect(options.core?.credentials?.[0].type).toBe('test-signing');
});

test('parse discovers classes for nested requests without a top-level fetch', async () => {
  const transport = vi.fn<FetchLike>(async () => new Response('child'));
  expect(await parse(new ArrayBuffer(0), TestLoader, getOptions(transport))).toBe('child');
  expect(transport.mock.calls[0][0]).toBe(`${ORIGIN}/child?signature=secret`);
});

test('loadInBatches authenticates both the root and requests from a batch parser', async () => {
  const transport = vi.fn<FetchLike>(async () => new Response('batch'));
  const batches = await loadInBatches(`${ORIGIN}/root.auth`, TestLoader, getOptions(transport));
  const results: unknown[] = [];
  for await (const batch of batches) results.push(batch);
  expect(results).toEqual(['batch']);
  expect(transport.mock.calls.map(call => call[0])).toEqual([
    `${ORIGIN}/root.auth?signature=secret`,
    `${ORIGIN}/child?signature=secret`
  ]);
});

test('unregistered declarative credentials fail before network access', async () => {
  const transport = vi.fn<FetchLike>(async () => new Response('unused'));
  await expect(
    load(`${ORIGIN}/root.auth`, TestLoader, {
      core: {fetch: transport, credentials: [{type: 'unknown'}]}
    })
  ).rejects.toThrow('No authentication class');
  expect(transport).not.toHaveBeenCalled();
});

test('URL loading discovers authentication on a lazily loaded parser implementation', async () => {
  const transport = vi.fn<FetchLike>(async () => new Response('child'));
  const metadataLoader = {
    ...TestLoader,
    parse: undefined,
    parseInBatches: undefined,
    getAuthentications: undefined,
    preload: async () => TestLoader
  };
  expect(await load(`${ORIGIN}/root.auth`, metadataLoader, getOptions(transport))).toBe('child');
  const batches = await loadInBatches(`${ORIGIN}/root.auth`, metadataLoader, getOptions(transport));
  for await (const batch of batches) expect(batch).toBe('child');
  expect(transport.mock.calls.map(call => call[0])).toEqual([
    `${ORIGIN}/root.auth?signature=secret`,
    `${ORIGIN}/child?signature=secret`,
    `${ORIGIN}/root.auth?signature=secret`,
    `${ORIGIN}/child?signature=secret`
  ]);
});

/** Minimal source loader exercising the synchronous and async public source APIs. */
const TestSourceLoader = {
  ...TestLoader,
  type: 'test-source',
  fromUrl: true,
  fromBlob: false,
  defaultOptions: {},
  testURL: () => true,
  getAuthentications: () => [BearerTokenAuthentication],
  createDataSource: (data, options) => new DataSource(data, options)
} satisfies SourceLoader;

test('source APIs discover constructors and retain them for subsequent requests', async () => {
  const transport = vi.fn<FetchLike>(async () => new Response('source'));
  const options = {
    core: {
      fetch: transport,
      credentials: [{type: 'bearer-token', id: 'source', origins: [ORIGIN], token: 'secret'}]
    }
  };
  const sources = [
    createDataSource(`${ORIGIN}/source`, [TestSourceLoader], options),
    await load(`${ORIGIN}/source`, TestSourceLoader, options),
    await load(`${ORIGIN}/source`, [TestSourceLoader], options),
    await load(`${ORIGIN}/source`, [TestLoader, TestSourceLoader], options)
  ];
  for (const source of sources) await source.fetch(`${ORIGIN}/child`);
  expect(transport).toHaveBeenCalledTimes(4);
  for (const [, requestOptions] of transport.mock.calls) {
    expect(new Headers(requestOptions?.headers).get('authorization')).toBe('Bearer secret');
  }
});

test('synchronous source creation explains how to use an asynchronous discovery hook', () => {
  expect(() =>
    createDataSource(
      `${ORIGIN}/source`,
      [{...TestSourceLoader, getAuthentications: async () => [BearerTokenAuthentication]}],
      {
        core: {
          credentials: [{type: 'bearer-token', id: 'test', origins: [ORIGIN], token: 'secret'}]
        }
      }
    )
  ).toThrow('Use load()');
});

test('source loading preserves metadata discovery when preload replaces the source definition', async () => {
  const transport = vi.fn<FetchLike>(async () => new Response('child'));
  const sourceLoader = {
    ...TestSourceLoader,
    preload: async () => ({...TestSourceLoader, getAuthentications: undefined})
  };
  const options = {
    core: {
      fetch: transport,
      credentials: [{type: 'bearer-token', id: 'test', origins: [ORIGIN], token: 'secret'}]
    }
  };
  const sources = [
    await load(`${ORIGIN}/source`, sourceLoader, options),
    await load(`${ORIGIN}/source`, [sourceLoader], options),
    await load(`${ORIGIN}/source`, [TestLoader, sourceLoader], options)
  ];
  for (const source of sources) await source.fetch(`${ORIGIN}/child`);
  expect(transport).toHaveBeenCalledTimes(3);
  expect(new Headers(transport.mock.calls[0][1]?.headers).get('authorization')).toBe(
    'Bearer secret'
  );
});
