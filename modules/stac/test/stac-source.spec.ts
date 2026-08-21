// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test, vi} from 'vitest';

import {STACSource, STACSourceLoaderWithParser} from '../src/stac-source';
import {STACSourceLoader} from '../src/stac-source-loader-types';
import type {STACItem} from '../src/stac-types';

const ROOT_URL = 'https://example.test/catalog.json';

describe('STACSource metadata loader', () => {
  test('exposes lightweight metadata and preloads the runtime source', async () => {
    expect(STACSourceLoader.fromUrl).toBe(true);
    expect(STACSourceLoader.fromBlob).toBe(false);
    expect(STACSourceLoader.testURL(ROOT_URL)).toBe(true);
    expect(STACSourceLoaderWithParser.createDataSource).toBeTypeOf('function');
    expect(STACSourceLoaderWithParser.createDataSource(ROOT_URL, {})).toBeInstanceOf(STACSource);
    await expect(STACSourceLoader.preload()).resolves.toBe(STACSourceLoaderWithParser);
    expect(() => STACSourceLoader.createDataSource(ROOT_URL, {})).toThrow(/async load/);
    expect(() => STACSourceLoaderWithParser.createDataSource(new Blob(), {})).toThrow(
      /catalog URL/
    );
  });
});

describe('STACSource static catalogs', () => {
  test('traverses relative links, avoids cycles, filters Items, and resolves assets', async () => {
    const documents: Record<string, unknown> = {
      [ROOT_URL]: createCatalog('root', [
        {rel: 'child', href: 'collections/places.json'},
        {rel: 'child', href: 'collections/places.json'}
      ]),
      'https://example.test/collections/places.json': createCollection('places', [
        {rel: 'root', href: '../catalog.json'},
        {rel: 'item', href: '../items/boston.json'},
        {rel: 'item', href: '../items/london.json'}
      ]),
      'https://example.test/items/boston.json': createItem(
        'boston',
        'places',
        [-71.2, 42.2, -70.9, 42.5],
        '2026-08-20T12:00:00Z',
        {
          data: {
            href: '../data/boston.parquet',
            type: 'application/vnd.apache.parquet',
            roles: ['data']
          }
        }
      ),
      'https://example.test/items/london.json': createItem(
        'london',
        'places',
        [-0.3, 51.3, 0.1, 51.7],
        '2020-01-01T00:00:00Z'
      )
    };
    const fetch = createFetch(documents);
    const source = createSource(ROOT_URL, fetch);

    await expect(source.getMetadata()).resolves.toMatchObject({mode: 'static'});
    const collections = await source.getCollections();
    expect(collections.map(collection => collection.id)).toEqual(['places']);

    const items = await collect(
      source.traverse({
        bbox: [-72, 41, -70, 43],
        datetime: '2025-01-01T00:00:00Z/..',
        collections: ['places']
      })
    );
    expect(items.map(item => item.id)).toEqual(['boston']);
    expect(source.getAssets(items[0], {roles: ['data']})).toEqual([
      expect.objectContaining({
        key: 'data',
        href: 'https://example.test/data/boston.parquet'
      })
    ]);
    expect(source.getAssets(items[0], {mediaTypes: ['image/png']})).toEqual([]);
    expect(fetch).toHaveBeenCalledTimes(5);
  });

  test('requires explicit traversal and enforces traversal limits', async () => {
    const documents: Record<string, unknown> = {
      [ROOT_URL]: createCatalog('root', [{rel: 'child', href: 'child.json'}]),
      'https://example.test/child.json': createCatalog('child', [
        {rel: 'child', href: 'grandchild.json'}
      ]),
      'https://example.test/grandchild.json': createCollection('collection', [])
    };
    const source = createSource(ROOT_URL, createFetch(documents));

    await expect(collect(source.search())).rejects.toThrow(/use STACSource\.traverse/);
    await expect(collect(source.traverse({maxRequests: 1}))).rejects.toThrow(/maxRequests/);
    await expect(source.getCollections({maxDepth: 0})).rejects.toThrow(/maxDepth/);
    await expect(source.getCollections({maxDepth: 1})).resolves.toEqual([]);
  });

  test('supports temporal intervals and conservative filtering of missing extents', async () => {
    const intervalItem = createItem('interval', 'events', [0, 0, 1, 1], null);
    intervalItem.properties.start_datetime = '2020-01-01T00:00:00Z';
    intervalItem.properties.end_datetime = '2020-12-31T23:59:59Z';
    const unknownItem = createItem('unknown', 'events', [0, 0, 1, 1], null);
    const documents: Record<string, unknown> = {
      [ROOT_URL]: createCollection('events', [
        {rel: 'item', href: 'interval.json'},
        {rel: 'item', href: 'unknown.json'}
      ]),
      'https://example.test/interval.json': intervalItem,
      'https://example.test/unknown.json': unknownItem
    };
    const source = createSource(ROOT_URL, createFetch(documents));

    expect(
      (await collect(source.traverse({datetime: '2020-06-01T00:00:00Z'}))).map(item => item.id)
    ).toEqual(['interval', 'unknown']);
    expect(
      (await collect(source.traverse({datetime: '2022-01-01T00:00:00Z'}))).map(item => item.id)
    ).toEqual(['unknown']);
    await expect(collect(source.traverse({datetime: 'not-a-date'}))).rejects.toThrow(
      /Invalid STAC datetime/
    );
  });

  test('reads linked ItemCollections and exercises all local Item constraints', async () => {
    const included = createItem('included', 'places', [0, 0, 0, 1, 1, 1]);
    const wrongId = createItem('wrong-id', 'places', [0, 0, 1, 1]);
    const noCollection = createItem('included', '', [0, 0, 1, 1]);
    delete noCollection.collection;
    const documents: Record<string, unknown> = {
      [ROOT_URL]: createCatalog('root', [{rel: 'item', href: 'items.json'}]),
      'https://example.test/items.json': createItemCollection([included, wrongId, noCollection], [])
    };
    const source = createSource(ROOT_URL, createFetch(documents));

    const items = await collect(
      source.traverse({
        ids: ['included'],
        collections: ['places'],
        bbox: [0, 0, 0, 1, 1, 1]
      })
    );
    expect(items).toEqual([included]);

    const detachedItem = createItem('detached', 'places', [0, 0, 1, 1], null, {
      data: {href: 'data.parquet', type: 'application/vnd.apache.parquet'},
      preview: {href: 'preview.png', type: 'image/png', roles: ['thumbnail']}
    });
    expect(source.getAssets(detachedItem, {roles: ['data']})).toEqual([]);
    expect(source.getAssets(detachedItem, {mediaTypes: ['image/png']})).toEqual([
      expect.objectContaining({key: 'preview', href: 'https://example.test/preview.png'})
    ]);
  });

  test('propagates aborts, HTTP failures, and invalid documents', async () => {
    const abortController = new AbortController();
    abortController.abort(new Error('stop'));
    const abortedSource = createSource(ROOT_URL, createFetch({}));
    await expect(abortedSource.getRoot({signal: abortController.signal})).rejects.toThrow('stop');

    const failedSource = createSource(
      ROOT_URL,
      vi.fn(async () => new Response('', {status: 503, statusText: 'Unavailable'}))
    );
    await expect(failedSource.getRoot()).rejects.toThrow(/503 Unavailable/);

    const invalidSource = createSource(ROOT_URL, createFetch({[ROOT_URL]: {hello: 'world'}}));
    await expect(invalidSource.getRoot()).rejects.toThrow(/Unsupported STAC object type/);

    const itemRoot = createSource(
      ROOT_URL,
      createFetch({[ROOT_URL]: createItem('item-root', 'collection', [0, 0, 1, 1])})
    );
    await expect(itemRoot.getRoot()).rejects.toThrow(/root must be a Catalog or Collection/);

    const primitiveRoot = createSource(ROOT_URL, createFetch({[ROOT_URL]: null}));
    await expect(primitiveRoot.getRoot()).rejects.toThrow(/Invalid STAC JSON document/);

    const invalidCatalog = createSource(
      ROOT_URL,
      createFetch({[ROOT_URL]: {type: 'Catalog', id: 7, links: []}})
    );
    await expect(invalidCatalog.getRoot()).rejects.toThrow(/Invalid STAC Catalog/);
  });

  test('bounds Collection traversal independently from Item traversal', async () => {
    const documents: Record<string, unknown> = {
      [ROOT_URL]: createCatalog('root', [
        {rel: 'child', href: 'item.json'},
        {rel: 'child', href: 'collection.json'}
      ]),
      'https://example.test/item.json': createItem('item', 'collection', [0, 0, 1, 1]),
      'https://example.test/collection.json': createCollection('collection', [])
    };
    const source = createSource(ROOT_URL, createFetch(documents));
    await expect(source.getCollections({maxRequests: 2})).rejects.toThrow(/maxRequests/);
  });
});

describe('STACSource API', () => {
  test('posts Item Search parameters and follows merged POST pagination', async () => {
    const root = createCatalog('api', [
      {rel: 'search', href: '/search', method: 'POST'},
      {rel: 'data', href: '/collections'}
    ]);
    root.conformsTo = ['https://api.stacspec.org/v1.0.0/item-search'];
    const boston = createItem('boston', 'places', [-71.2, 42.2, -70.9, 42.5]);
    const cambridge = createItem('cambridge', 'places', [-71.2, 42.3, -71, 42.5]);
    const fetch = vi.fn(async (url: string, options?: RequestInit) => {
      if (url === ROOT_URL) {
        return jsonResponse(root);
      }
      if (url === 'https://example.test/search') {
        const body = JSON.parse(String(options?.body || '{}'));
        if (body.token === 'next-page') {
          return jsonResponse(createItemCollection([cambridge], []));
        }
        expect(options?.method).toBe('POST');
        expect(body).toEqual({collections: ['places'], bbox: [-72, 41, -70, 43], limit: 1});
        return jsonResponse(
          createItemCollection(
            [boston],
            [
              {
                rel: 'next',
                href: '/search',
                method: 'POST',
                body: {token: 'next-page'},
                merge: true
              }
            ]
          )
        );
      }
      throw new Error(`Unexpected URL: ${url}`);
    });
    const source = createSource(ROOT_URL, fetch);

    await expect(source.getMetadata()).resolves.toMatchObject({mode: 'api'});
    const items = await collect(
      source.search({collections: ['places'], bbox: [-72, 41, -70, 43], limit: 1})
    );
    expect(items.map(item => item.id)).toEqual(['boston', 'cambridge']);
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  test('supports GET search and detects pagination cycles', async () => {
    const root = createCatalog('api', [{rel: 'search', href: '/search', method: 'GET'}]);
    const fetch = vi.fn(async (url: string) => {
      if (url === ROOT_URL) {
        return jsonResponse(root);
      }
      expect(url).toContain('ids=one%2Ctwo');
      return jsonResponse(createItemCollection([], [{rel: 'next', href: url, method: 'GET'}]));
    });
    const source = createSource(ROOT_URL, fetch);
    await expect(collect(source.search({ids: ['one', 'two']}))).rejects.toThrow(/cycle/);
  });

  test('follows Collections pagination', async () => {
    const root = createCatalog('api', [{rel: 'data', href: '/collections'}]);
    root.conformsTo = ['https://api.stacspec.org/v1.0.0/core'];
    const first = createCollection('first', []);
    const second = createCollection('second', []);
    const fetch = createFetch({
      [ROOT_URL]: root,
      'https://example.test/collections': {
        collections: [first],
        links: [{rel: 'next', href: '?page=2'}]
      },
      'https://example.test/collections?page=2': {collections: [second], links: []}
    });
    const source = createSource(ROOT_URL, fetch);
    const collections = await source.getCollections();
    expect(collections.map(collection => collection.id)).toEqual(['first', 'second']);
  });

  test('handles APIs without a Collections relation and rejects pagination cycles', async () => {
    const collectionRoot = createCollection('root-collection', []);
    collectionRoot.conformsTo = ['https://api.stacspec.org/v1.0.0/core'];
    const collectionSource = createSource(ROOT_URL, createFetch({[ROOT_URL]: collectionRoot}));
    await expect(collectionSource.getCollections()).resolves.toEqual([collectionRoot]);

    const catalogRoot = createCatalog('root-catalog', []);
    catalogRoot.conformsTo = ['https://api.stacspec.org/v1.0.0/core'];
    const catalogSource = createSource(ROOT_URL, createFetch({[ROOT_URL]: catalogRoot}));
    await expect(catalogSource.getCollections()).resolves.toEqual([]);

    const cyclingRoot = createCatalog('api', [{rel: 'data', href: '/collections'}]);
    cyclingRoot.conformsTo = ['https://api.stacspec.org/v1.0.0/core'];
    const cyclingSource = createSource(
      ROOT_URL,
      createFetch({
        [ROOT_URL]: cyclingRoot,
        'https://example.test/collections': {
          collections: [],
          links: [{rel: 'next', href: '/collections'}]
        }
      })
    );
    await expect(cyclingSource.getCollections()).rejects.toThrow(/cycle/);
  });

  test('rejects malformed Item Search and Collections responses', async () => {
    const searchRoot = createCatalog('api', [{rel: 'search', href: '/search'}]);
    const invalidItemCollection = createSource(
      ROOT_URL,
      createFetch({
        [ROOT_URL]: searchRoot,
        'https://example.test/search': {type: 'FeatureCollection', features: [], links: 'bad'}
      })
    );
    await expect(collect(invalidItemCollection.search())).rejects.toThrow(
      /Invalid STAC ItemCollection/
    );

    const invalidItem = createSource(
      ROOT_URL,
      createFetch({
        [ROOT_URL]: searchRoot,
        'https://example.test/search': createItemCollection(
          [{type: 'Feature', id: 'broken'} as unknown as STACItem],
          []
        )
      })
    );
    await expect(collect(invalidItem.search())).rejects.toThrow(/Invalid STAC Item/);

    const collectionsRoot = createCatalog('api', [{rel: 'data', href: '/collections'}]);
    collectionsRoot.conformsTo = ['https://api.stacspec.org/v1.0.0/core'];
    const invalidCollections = createSource(
      ROOT_URL,
      createFetch({[ROOT_URL]: collectionsRoot, 'https://example.test/collections': {links: []}})
    );
    await expect(invalidCollections.getCollections()).rejects.toThrow(
      /Invalid STAC Collections response/
    );

    const invalidCollection = createSource(
      ROOT_URL,
      createFetch({
        [ROOT_URL]: collectionsRoot,
        'https://example.test/collections': {collections: [{type: 'Catalog'}], links: []}
      })
    );
    await expect(invalidCollection.getCollections()).rejects.toThrow(/Invalid Collection/);
  });
});

function createSource(url: string, fetch: typeof globalThis.fetch): STACSource {
  return new STACSource(url, {core: {loadOptions: {core: {fetch}}}});
}

function createFetch(documents: Record<string, unknown>): typeof globalThis.fetch {
  return vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (!(url in documents)) {
      return new Response('', {status: 404, statusText: 'Not Found'});
    }
    return jsonResponse(documents[url]);
  });
}

function jsonResponse(value: unknown): Response {
  return new Response(JSON.stringify(value), {
    status: 200,
    headers: {'content-type': 'application/json'}
  });
}

function createCatalog(id: string, links: Array<Record<string, unknown>>) {
  return {
    type: 'Catalog' as const,
    stac_version: '1.1.0',
    id,
    description: id,
    links
  };
}

function createCollection(id: string, links: Array<Record<string, unknown>>) {
  return {
    ...createCatalog(id, links),
    type: 'Collection' as const,
    license: 'MIT',
    extent: {
      spatial: {bbox: [[-180, -90, 180, 90]]},
      temporal: {interval: [[null, null]]}
    }
  };
}

function createItem(
  id: string,
  collection: string,
  bbox: NonNullable<STACItem['bbox']>,
  datetime: string | null = '2026-01-01T00:00:00Z',
  assets: STACItem['assets'] = {}
): STACItem {
  return {
    type: 'Feature',
    stac_version: '1.1.0',
    id,
    collection,
    bbox,
    geometry: null,
    properties: {datetime},
    links: [],
    assets
  };
}

function createItemCollection(items: STACItem[], links: Array<Record<string, unknown>>) {
  return {type: 'FeatureCollection' as const, features: items, links};
}

async function collect<T>(values: AsyncIterable<T>): Promise<T[]> {
  const result: T[] = [];
  for await (const value of values) {
    result.push(value);
  }
  return result;
}
