// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test, vi} from 'vitest';
import type {GeoJSONTable, Feature} from '@loaders.gl/schema';
import {
  addNextLinkHeader,
  collectFeaturePages,
  getPaginationOptions,
  iterateFeaturePages
} from '../src/feature-pagination';

const PAGE_URL = 'https://example.com/items?limit=1';

/** Creates a deterministic page with unique stable feature IDs. */
function createPage(
  identifiers: (string | number)[],
  metadata: Record<string, unknown> = {}
): GeoJSONTable {
  return {
    shape: 'geojson-table',
    type: 'FeatureCollection',
    features: identifiers.map(id => ({type: 'Feature', id, properties: {}, geometry: null})),
    ...metadata
  };
}

/** Traverses a deterministic sequence using service-style relative next links. */
function traversePages(tables: GeoJSONTable[], options = {}, signal?: AbortSignal) {
  let index = 0;
  const fetchPage = vi.fn(async (url: string) => ({table: tables[index++], url}));
  return {fetchPage, pages: iterateFeaturePages(PAGE_URL, fetchPage, options, signal)};
}

describe('bounded feature pagination', () => {
  test('collects relative pages and removes page-specific metadata without fabricating totals', async () => {
    const {pages, fetchPage} = traversePages([
      createPage([1], {links: [{rel: 'next', href: '?cursor=two'}], bbox: [0, 0, 1, 1]}),
      createPage(['1'], {numberReturned: 1, links: [{rel: 'self', href: 'items'}]})
    ]);
    const result = await collectFeaturePages(pages);
    expect(result.features.map(feature => feature.id)).toEqual([1, '1']);
    expect(result).toMatchObject({numberReturned: 2});
    expect(result).not.toHaveProperty('numberMatched');
    expect(result).not.toHaveProperty('bbox');
    expect(result).not.toHaveProperty('links');
    expect(fetchPage.mock.calls[1][0]).toBe('https://example.com/items?cursor=two');
  });

  test('preserves counts supplied on a later page and accepts an empty terminal page', async () => {
    const {pages} = traversePages([
      createPage([1], {next: '?cursor=two', totalFeatures: 1}),
      createPage([], {numberMatched: 1, numberReturned: 0, previous: '?limit=1'})
    ]);
    expect(await collectFeaturePages(pages)).toMatchObject({
      numberMatched: 1,
      totalFeatures: 1,
      numberReturned: 1
    });
  });

  test.each([
    [{maxPages: 1}, 'maxPages'],
    [{maxFeatures: 1}, 'maxFeatures']
  ])('rejects an exhausted bound instead of returning a truncated aggregate: %j', async (options, message) => {
    const {pages} = traversePages([createPage([1], {next: '?page=2'}), createPage([2])], options);
    await expect(collectFeaturePages(pages)).rejects.toThrow(message);
  });

  test.each([
    [createPage([1], {next: PAGE_URL}), createPage([2]), 'page URL'],
    [createPage([1], {next: '?page=2'}), createPage([1]), 'page contents'],
    [createPage([1], {next: '?page=2'}), createPage([1, 2]), 'feature ID'],
    [
      createPage([1], {next: '?page=2', numberMatched: 2}),
      createPage([2], {numberMatched: 3}),
      'changed'
    ],
    [createPage([1], {numberReturned: 0}), createPage([]), 'numberReturned'],
    [createPage([1], {numberMatched: 0}), createPage([]), 'more features'],
    [createPage([1], {numberMatched: -1}), createPage([]), 'invalid numberMatched'],
    [createPage([], {next: '?page=2'}), createPage([2]), 'no progress'],
    [createPage([1], {next: 'https://other.example/items'}), createPage([2]), 'same-origin'],
    [
      createPage([1], {next: 'https://user:secret@example.com/items'}),
      createPage([2]),
      'credentials'
    ],
    [createPage([1], {next: 'javascript:void(0)'}), createPage([2]), 'same-origin'],
    [createPage([1], {next: ''}), createPage([2]), 'invalid next'],
    [createPage([1], {links: [{rel: 'next'}]}), createPage([2]), 'invalid next'],
    [
      createPage([1], {
        links: [
          {rel: 'next', href: '?one'},
          {rel: 'next', href: '?two'}
        ]
      }),
      createPage([2]),
      'ambiguous'
    ]
  ])('rejects malformed or unstable page sequences (%#)', async (first, second, message) => {
    const {pages} = traversePages([first, second]);
    await expect(collectFeaturePages(pages)).rejects.toThrow(message);
  });

  test('rejects malformed features before collection', async () => {
    const {pages} = traversePages([createPage([], {features: null})]);
    await expect(collectFeaturePages(pages)).rejects.toThrow('FeatureCollection');
  });

  test('does not fetch ahead when a page consumer stops early', async () => {
    const {pages, fetchPage} = traversePages([createPage([1], {next: '?page=2'}), createPage([2])]);
    for await (const page of pages) {
      expect(page.features).toHaveLength(1);
      break;
    }
    expect(fetchPage).toHaveBeenCalledTimes(1);
  });

  test('cancels before fetch and after a fetch implementation ignores the signal', async () => {
    const controller = new AbortController();
    controller.abort();
    const {pages, fetchPage} = traversePages([createPage([])], {}, controller.signal);
    await expect(collectFeaturePages(pages)).rejects.toMatchObject({name: 'AbortError'});
    expect(fetchPage).not.toHaveBeenCalled();
    const second = new AbortController();
    const cancelledPages = iterateFeaturePages(
      PAGE_URL,
      async url => {
        second.abort();
        return {table: createPage([1]), url};
      },
      {},
      second.signal
    );
    await expect(collectFeaturePages(cancelledPages)).rejects.toMatchObject({name: 'AbortError'});
  });

  test('preserves unknown counts and response-relative links', async () => {
    const requests: string[] = [];
    const result = await collectFeaturePages(
      iterateFeaturePages(
        PAGE_URL,
        async url => {
          requests.push(url);
          return requests.length === 1
            ? {
                table: createPage([1], {numberMatched: 'unknown', next: '../final'}),
                url: 'https://example.com/redirect/items'
              }
            : {table: createPage([]), url};
        },
        {}
      )
    );
    expect(requests[1]).toBe('https://example.com/final');
    expect(result).toMatchObject({numberMatched: 'unknown', numberReturned: 1});
  });

  test('does not deduplicate unidentified records', async () => {
    const feature: Feature = {type: 'Feature', properties: {}, geometry: null};
    const {pages} = traversePages([createPage([], {features: [feature, {...feature}]})]);
    expect((await collectFeaturePages(pages)).features).toHaveLength(2);
  });

  test.each(['pageSize', 'maxPages', 'maxFeatures'])('validates %s before any request', name => {
    for (const value of [0, -1, 1.5, Infinity, NaN, Number.MAX_SAFE_INTEGER + 1])
      expect(() => getPaginationOptions({[name]: value})).toThrow(name);
    expect(getPaginationOptions()).toEqual({pageSize: 1000, maxPages: 100, maxFeatures: 100000});
  });

  test('parses Link headers with commas and multiple relation tokens, preferring body next links', () => {
    const table = createPage([]);
    expect(
      addNextLinkHeader(table, '<self>; rel="self", <?cursor=two,three>; rel="next alternate"')
    ).toMatchObject({
      links: [{rel: 'next', href: '?cursor=two,three'}]
    });
    const bodyNext = createPage([], {next: '?body'});
    expect(addNextLinkHeader(bodyNext, '<header>; rel=next')).toBe(bodyNext);
    expect(addNextLinkHeader(table, '<self>; title="next, page"; rel=self')).toBe(table);
  });
});

test('collecting an empty page iterator fails rather than returning fabricated data', async () => {
  const pages = iterateFeaturePages(
    '',
    async () => {
      throw new Error('unreachable');
    },
    {}
  );
  await expect(collectFeaturePages(pages)).rejects.toThrow('no pages');
});
