// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test, vi} from 'vitest';
import {ArcGISVectorSource, ArcGISFeatureQueryError} from '@loaders.gl/arcgis/bundled';
import {ArcGISFeatureServerSourceLoader, ARCGIS_LOADERS} from '@loaders.gl/arcgis';
import {load} from '@loaders.gl/core';
import type {ArcGISFeatureQueryProgress} from '@loaders.gl/arcgis';

const LAYER_URL = 'https://example.com/FeatureServer/0?token=fixture';
const METADATA = {
  type: 'Feature Layer',
  objectIdField: 'OBJECTID',
  maxRecordCount: 2,
  capabilities: 'Query',
  supportedQueryFormats: 'JSON, geoJSON',
  advancedQueryCapabilities: {supportsPagination: true, supportsOrderBy: true}
};

/** Small deterministic service with five stable objects and overridable responses. */
function createService(
  overrides: {
    metadata?: Record<string, unknown>;
    count?: number;
    identifiers?: unknown;
    page?: (parameters: URLSearchParams) => unknown;
  } = {}
) {
  const source = new ArcGISVectorSource(LAYER_URL, {});
  const requests: URL[] = [];
  source.fetch = vi.fn(async (url, options) => {
    options?.signal?.throwIfAborted();
    const request = new URL(url);
    requests.push(request);
    expect(request.searchParams.get('token')).toBe('fixture');
    if (!request.pathname.endsWith('/query'))
      return Response.json({...METADATA, ...overrides.metadata});
    const parameters = request.searchParams;
    if (parameters.get('returnCountOnly') === 'true')
      return Response.json({count: overrides.count ?? 5});
    if (parameters.get('returnIdsOnly') === 'true')
      return Response.json(
        overrides.identifiers ?? {
          objectIdFieldName: 'OBJECTID',
          objectIds: [1, 2, 3, 4, 5]
        }
      );
    if (parameters.get('returnExtentOnly') === 'true')
      return Response.json({
        count: 5,
        extent: {xmin: 1, ymin: 2, xmax: 5, ymax: 6, spatialReference: {wkid: 4326}}
      });
    if (overrides.page) return Response.json(overrides.page(parameters));
    const offset = Number(parameters.get('resultOffset') || 0);
    const count = Number(parameters.get('resultRecordCount') || 2);
    const identifiers = parameters.has('objectIds')
      ? parameters.get('objectIds')!.split(',').map(Number)
      : [1, 2, 3, 4, 5].slice(offset, offset + count);
    return Response.json(
      collection(identifiers, !parameters.has('objectIds') && offset + count < 5)
    );
  });
  return {source, requests};
}

/** GeoJSON page whose IDs are also available as properties. */
function collection(identifiers: (number | string)[], exceededTransferLimit?: boolean) {
  return {
    type: 'FeatureCollection',
    features: identifiers.map(identifier => ({
      type: 'Feature',
      id: identifier,
      geometry: {type: 'Point', coordinates: [1, 2]},
      properties: {OBJECTID: identifier, value: null, measured: 1700000000000}
    })),
    ...(exceededTransferLimit === undefined ? {} : {properties: {exceededTransferLimit}})
  };
}

describe('complete ArcGIS feature queries', () => {
  test('ordered pages preserve filters, cap page size, and report cumulative completion', async () => {
    const {source, requests} = createService();
    const progress: ArcGISFeatureQueryProgress[] = [];
    const result = await source.queryFeatures({
      pageSize: 10,
      boundingBox: [
        [0, 0],
        [10, 10]
      ],
      query: {where: 'value IS NULL', outFields: ['value']},
      onProgress: value => progress.push(value)
    });
    expect(result).toMatchObject({
      complete: true,
      reason: 'complete',
      strategy: 'offset',
      scope: 'viewport',
      loaded: 5,
      pages: 3
    });
    expect(result.data.features.map(feature => feature.id)).toEqual([1, 2, 3, 4, 5]);
    expect(progress.map(value => [value.loaded, value.complete])).toEqual([
      [2, false],
      [4, false],
      [5, true]
    ]);
    for (const request of requests.filter(request => request.pathname.endsWith('/query'))) {
      expect(request.searchParams.get('where')).toBe('value IS NULL');
      expect(request.searchParams.get('geometry')).toBe('0,0,10,10');
    }
    const pages = requests.filter(request => request.searchParams.has('resultOffset'));
    expect(pages.map(request => request.searchParams.get('resultOffset'))).toEqual(['0', '2', '4']);
    expect(
      pages.every(request => request.searchParams.get('orderByFields') === 'OBJECTID ASC')
    ).toBe(true);
    expect(pages[0].searchParams.get('outFields')).toBe('value,OBJECTID');
  });

  test('falls back to ID batches and deduplicates the ID response', async () => {
    const {source, requests} = createService({
      metadata: {advancedQueryCapabilities: {}},
      identifiers: {
        objectIdFieldName: 'OBJECTID',
        objectIds: [1, 2, 2, 3, 4, 5]
      }
    });
    const result = await source.queryFeatures({concurrency: 2});
    expect(result).toMatchObject({complete: true, strategy: 'object-ids', loaded: 5, pages: 3});
    expect(
      requests
        .filter(request => request.searchParams.has('objectIds'))
        .map(request => request.searchParams.get('objectIds'))
    ).toEqual(['1,2', '3,4', '5']);
  });

  test.each([
    'offset',
    'object-ids'
  ] as const)('%s stops at the feature cap with an explicit partial result', async strategy => {
    const {source} = createService();
    expect(await source.queryFeatures({strategy, maxFeatures: 3})).toMatchObject({
      complete: false,
      reason: 'feature-limit',
      loaded: 3
    });
  });

  test('a single page is never labeled a complete query', async () => {
    const {source} = createService();
    expect(await source.queryFeaturePage({query: {resultOffset: 4}})).toMatchObject({
      complete: false,
      reason: 'single-page',
      loaded: 1,
      strategy: 'page'
    });
  });

  test('detects a silently capped ID response by comparing its count', async () => {
    const {source} = createService({
      identifiers: {objectIdFieldName: 'OBJECTID', objectIds: [1, 2]}
    });
    expect(await source.queryFeatures({strategy: 'object-ids'})).toMatchObject({
      complete: false,
      reason: 'id-limit',
      loaded: 2
    });
  });

  test('does not ignore an explicit ID transfer limit even when counts match', async () => {
    const {source} = createService({
      identifiers: {
        objectIdFieldName: 'OBJECTID',
        objectIds: [1, 2, 3, 4, 5],
        exceededTransferLimit: true
      }
    });
    expect(await source.queryFeatures({strategy: 'object-ids'})).toMatchObject({
      complete: false,
      reason: 'id-limit'
    });
  });

  test('deduplicates repeated pages and stops a service that makes no progress', async () => {
    const {source} = createService({page: () => collection([1, 2], true)});
    const result = await source.queryFeatures();
    expect(result).toMatchObject({
      complete: false,
      loaded: 2,
      duplicates: 2,
      pages: 2,
      reason: 'no-progress'
    });
    await expect(source.getFeatures({format: 'geojson'} as never)).rejects.toThrow(
      'Incomplete ArcGIS query'
    );
  });

  test.each([
    'offset',
    'object-ids'
  ] as const)('%s detects disappearing records', async strategy => {
    const {source} = createService({page: () => collection([1], false)});
    expect(await source.queryFeatures({strategy})).toMatchObject({
      complete: false,
      reason: 'count-mismatch'
    });
  });

  test('empty transfer-limited pages cannot loop forever', async () => {
    const {source} = createService({page: () => collection([], true)});
    expect(await source.queryFeatures()).toMatchObject({
      complete: false,
      reason: 'no-progress',
      pages: 1
    });
  });

  test.each(['offset', 'object-ids'] as const)('%s completes an empty query', async strategy => {
    const {source} = createService({
      count: 0,
      identifiers: {objectIdFieldName: 'OBJECTID', objectIds: []},
      page: () => collection([], false)
    });
    expect(await source.queryFeatures({strategy})).toMatchObject({complete: true, loaded: 0});
  });

  test('ID-limited empty results remain incomplete', async () => {
    const {source} = createService({identifiers: {objectIdFieldName: 'OBJECTID', objectIds: []}});
    expect(await source.queryFeatures({strategy: 'object-ids'})).toMatchObject({
      complete: false,
      reason: 'id-limit'
    });
  });

  test('follows full pages without transfer flags until a short page', async () => {
    const {source} = createService({
      page: parameters =>
        collection(
          [1, 2, 3, 4, 5].slice(
            Number(parameters.get('resultOffset')),
            Number(parameters.get('resultOffset')) + 2
          )
        )
    });
    expect(await source.queryFeatures()).toMatchObject({complete: true, loaded: 5});
  });

  test('supports stable string IDs without coercing them to numbers', async () => {
    const {source} = createService({
      count: 1,
      identifiers: {objectIdFieldName: 'OBJECTID', objectIds: ['0001']},
      page: () => collection(['0001'], false)
    });
    expect((await source.queryFeatures({strategy: 'object-ids'})).data.features[0].id).toBe('0001');
  });

  test('rejects an ID field that changes between metadata and retrieval', async () => {
    const {source} = createService({identifiers: {objectIdFieldName: 'changed', objectIds: []}});
    await expect(source.queryFeatures({strategy: 'object-ids'})).rejects.toThrow(
      'changed the object ID field'
    );
  });

  test('reads counts, IDs and extents without retaining page controls', async () => {
    const {source, requests} = createService();
    expect(
      await source.queryCount({
        query: {resultOffset: 4, resultRecordCount: 1, where: 'value IS NULL'}
      })
    ).toBe(5);
    expect(await source.queryObjectIds()).toMatchObject({
      objectIds: [1, 2, 3, 4, 5],
      exceededTransferLimit: false
    });
    expect(await source.queryExtent()).toMatchObject({
      count: 5,
      extent: {spatialReference: {wkid: 4326}}
    });
    expect(requests[0].searchParams.has('resultOffset')).toBe(false);
    expect(requests[0].searchParams.has('resultRecordCount')).toBe(false);
  });
});

describe('query lifecycle and limits', () => {
  test('bounds concurrent requests and preserves deterministic page order', async () => {
    const {source} = createService();
    const originalFetch = source.fetch;
    let active = 0;
    let maximum = 0;
    const releases: (() => void)[] = [];
    source.fetch = async (url, options) => {
      if (new URL(url).searchParams.has('objectIds')) {
        active++;
        maximum = Math.max(maximum, active);
        await new Promise<void>(resolve => releases.push(resolve));
        active--;
      }
      return originalFetch(url, options);
    };
    const resultPromise = source.queryFeatures({strategy: 'object-ids', concurrency: 2});
    await vi.waitFor(() => expect(releases).toHaveLength(2));
    releases[1]();
    releases[0]();
    await vi.waitFor(() => expect(releases).toHaveLength(3));
    releases[2]();
    expect((await resultPromise).data.features.map(feature => feature.id)).toEqual([1, 2, 3, 4, 5]);
    expect(maximum).toBe(2);
  });

  test('cancellation aborts metadata before subsequent requests', async () => {
    const {source} = createService();
    const controller = new AbortController();
    let receivedSignal: AbortSignal | undefined;
    source.fetch = vi.fn(async (_url, options) => {
      receivedSignal = options?.signal as AbortSignal;
      controller.abort();
      return Response.json(METADATA);
    });
    await expect(source.queryFeatures({signal: controller.signal})).rejects.toMatchObject({
      name: 'AbortError'
    });
    expect(receivedSignal?.aborted).toBe(true);
    expect(source.fetch).toHaveBeenCalledTimes(1);
  });

  test('a pre-aborted query does not fetch', async () => {
    const {source} = createService();
    const controller = new AbortController();
    controller.abort();
    await expect(source.queryFeatures({signal: controller.signal})).rejects.toMatchObject({
      name: 'AbortError'
    });
    expect(source.fetch).not.toHaveBeenCalled();
  });

  test('breaking iteration stops further pages and closes the internal request signal', async () => {
    const {source, requests} = createService();
    let requestSignal: AbortSignal | undefined;
    const originalFetch = source.fetch;
    source.fetch = async (url, options) => {
      requestSignal = options?.signal as AbortSignal;
      return originalFetch(url, options);
    };
    for await (const page of source.queryFeaturePages()) {
      expect(page.loaded).toBe(2);
      break;
    }
    expect(requests).toHaveLength(3);
    expect(requestSignal?.aborted).toBe(true);
  });

  test('cancellation from progress never emits a successful completion', async () => {
    const {source} = createService();
    const controller = new AbortController();
    await expect(
      source.queryFeatures({signal: controller.signal, onProgress: () => controller.abort()})
    ).rejects.toMatchObject({name: 'AbortError'});
  });

  test.each([
    [{pageSize: 0}, 'pageSize'],
    [{maxFeatures: -1}, 'maxFeatures'],
    [{concurrency: 0}, 'concurrency'],
    [{concurrency: 9}, 'concurrency'],
    [{query: {resultOffset: 1}}, 'manage paging'],
    [{query: {orderByFields: 'name'}}, 'manage paging']
  ])('rejects invalid retrieval controls %j', async (options, message) => {
    await expect(createService().source.queryFeatures(options as never)).rejects.toThrow(message);
  });

  test.each([
    [{capabilities: 'Create'}, {}, 'Query capability'],
    [{supportedQueryFormats: 'JSON'}, {}, 'GeoJSON queries'],
    [{objectIdField: undefined}, {}, 'stable object ID'],
    [{advancedQueryCapabilities: {}}, {strategy: 'offset'}, 'ordered pagination'],
    [{maxRecordCount: 0}, {}, 'maxRecordCount']
  ])('rejects unsupported metadata %j', async (metadata, options, message) => {
    await expect(createService({metadata}).source.queryFeatures(options as never)).rejects.toThrow(
      message
    );
  });
});

describe('records, endpoints, errors and coordinate references', () => {
  test('nonspatial tables retain attributes, nulls and raw date values in GeoJSON and Arrow', async () => {
    const {source} = createService({
      metadata: {type: 'Table', supportedQueryFormats: 'JSON'},
      page: parameters => {
        expect(parameters.get('f')).toBe('json');
        const offset = Number(parameters.get('resultOffset') || 0);
        return {
          features: [1, 2, 3, 4, 5].slice(offset, offset + 2).map(identifier => ({
            attributes: {OBJECTID: identifier, nullable: null, date: 1700000000000}
          })),
          exceededTransferLimit: offset < 4
        };
      }
    });
    const result = await source.queryFeatures();
    expect(result.data.features[0]).toEqual({
      type: 'Feature',
      id: 1,
      geometry: null,
      properties: {OBJECTID: 1, nullable: null, date: 1700000000000}
    });
    const table = await source.getFeatures({format: 'arrow'} as never);
    expect(table.shape).toBe('arrow-table');
    expect((table as any).data.numRows).toBe(5);
    await expect(source.getFeatures({format: 'binary'} as never)).rejects.toThrow(
      'null geometries'
    );
  });

  test.each([
    'geojson',
    'binary',
    'arrow'
  ] as const)('complete spatial results convert to %s', async format => {
    const result = await createService().source.getFeatures({format} as never);
    expect(result.shape).toBe(
      format === 'geojson'
        ? 'geojson-table'
        : format === 'arrow'
          ? 'arrow-table'
          : 'binary-feature-collection'
    );
  });

  test('the registry selects queryable MapServer layers without changing MapServer roots', async () => {
    expect(ArcGISFeatureServerSourceLoader.testURL('https://example.com/MapServer/3')).toBe(true);
    expect(ArcGISFeatureServerSourceLoader.testURL('https://example.com/MapServer')).toBe(false);
    const source = await load('https://example.com/MapServer/3', ARCGIS_LOADERS);
    expect(source).toBeInstanceOf(ArcGISVectorSource);
    expect(new URL(source.getFeaturesURL({})).pathname).toBe('/MapServer/3/query');
  });

  test.each([
    ['https://example.com/FeatureServer', {}, 'Select a layer'],
    ['https://example.com/MapServer/2', {layers: '1'}, 'conflicts'],
    [LAYER_URL, {layers: ['0', '1']}, 'exactly one'],
    ['https://example.com/unrelated', {}, 'layer URL'],
    [LAYER_URL, {crs: 'CRS:84'}, 'WKID'],
    [
      LAYER_URL,
      {
        boundingBox: [
          [10, 0],
          [0, 10]
        ]
      },
      'boundingBox'
    ]
  ])('validates endpoint and coordinate input %s %j', (url, parameters, message) => {
    expect(() => new ArcGISVectorSource(url, {}).getFeaturesURL(parameters as never)).toThrow(
      message
    );
  });

  test('rejects projected GeoJSON output but accepts projected query bounds', async () => {
    const {source, requests} = createService();
    await expect(source.queryFeatures({crs: 'EPSG:3857'})).rejects.toThrow('requires EPSG:4326');
    expect(
      (
        await source.queryFeatures({
          requestCrs: 'EPSG:3857',
          boundingBox: [
            [0, 0],
            [100, 100]
          ]
        })
      ).complete
    ).toBe(true);
    expect(requests.at(-1)!.searchParams.get('inSR')).toBe('3857');
    expect(requests.at(-1)!.searchParams.get('outSR')).toBe('4326');
  });

  test.each([200, 403])('recognizes JSON errors on HTTP %s', async status => {
    const source = createService().source;
    source.fetch = async () =>
      Response.json(
        {error: {code: 498, message: 'Expired token', details: ['Renew the session']}},
        {status}
      );
    await expect(source.queryCount()).rejects.toMatchObject({
      name: 'ArcGISFeatureQueryError',
      code: 498,
      details: ['Renew the session']
    });
    try {
      await source.queryCount();
    } catch (error) {
      expect(error).toBeInstanceOf(ArcGISFeatureQueryError);
    }
  });

  test.each([
    [() => new Response('<html>Bad gateway</html>', {status: 502}), 'non-JSON'],
    [() => Response.json({}, {status: 503, statusText: 'Unavailable'}), 'Unavailable'],
    [() => Response.json({count: -1}), 'nonnegative count']
  ])('rejects malformed count responses', async (response, message) => {
    const source = createService().source;
    source.fetch = async () => response();
    await expect(source.queryCount()).rejects.toThrow(message);
  });

  test.each([
    {},
    {objectIdFieldName: 'OBJECTID', objectIds: [Number.MAX_SAFE_INTEGER + 1]},
    {objectIdFieldName: 'OBJECTID', objectIds: [null]}
  ])('rejects malformed or lossy ID results %j', async identifiers => {
    await expect(createService({identifiers}).source.queryObjectIds()).rejects.toThrow(
      /object IDs/
    );
  });

  test('rejects malformed feature and table records instead of dropping rows', async () => {
    await expect(
      createService({page: () => ({features: []})}).source.queryFeaturePage()
    ).rejects.toThrow('FeatureCollection');
    await expect(
      createService({
        page: () => ({type: 'FeatureCollection', features: [{type: 'Feature'}]})
      }).source.queryFeaturePage()
    ).rejects.toThrow('Invalid ArcGIS GeoJSON');
    await expect(
      createService({
        metadata: {type: 'Table'},
        page: () => ({features: [{}]})
      }).source.queryFeaturePage()
    ).rejects.toThrow('nonspatial table');
  });

  test('rejects malformed extents and accepts a null extent', async () => {
    const source = createService().source;
    source.fetch = async () => Response.json({extent: {xmin: 1}});
    await expect(source.queryExtent()).rejects.toThrow('spatial reference');
    source.fetch = async () => Response.json({extent: null});
    expect(await source.queryExtent()).toEqual({extent: null});
  });
});

test('GeoJSON transfer flags survive short pages and application caps', async () => {
  const {source} = createService({
    page: parameters => {
      const offset = Number(parameters.get('resultOffset') || 0);
      return collection([offset + 1], offset < 4);
    }
  });
  expect(await source.queryFeatures()).toMatchObject({complete: true, loaded: 5, pages: 5});
  const capped = createService({page: () => collection([1])}).source;
  expect(await capped.queryFeatures({maxFeatures: 1})).toMatchObject({
    complete: false,
    reason: 'feature-limit'
  });
});

test('page controls reject negative offsets and cap an explicit page length', async () => {
  const {source, requests} = createService();
  await expect(source.queryFeaturePage({query: {resultOffset: -1}})).rejects.toThrow('nonnegative');
  await expect(source.queryFeaturePage({query: {resultRecordCount: 0}})).rejects.toThrow(
    'positive'
  );
  expect((await source.queryFeaturePage({query: {resultRecordCount: 1}})).loaded).toBe(1);
  expect(requests.at(-1)!.searchParams.get('resultRecordCount')).toBe('1');
});

test('field-based identities and metadata retries preserve schema discovery', async () => {
  const {source} = createService({
    metadata: {objectIdField: undefined, fields: [{name: 'OBJECTID', type: 'esriFieldTypeOID'}]}
  });
  expect((await source.queryFeatures()).complete).toBe(true);
  source.fetch = async () => Response.json({error: {message: 'Temporary failure', code: 503}});
  await expect(source.getSchema()).rejects.toThrow('Temporary');
  source.fetch = async () =>
    Response.json({
      tables: [{id: 2, name: 'Records'}],
      fields: [
        {name: 'large', type: 'esriFieldTypeBigInteger'},
        {name: 'small', type: 'esriFieldTypeSmallInteger'},
        {name: 'single', type: 'esriFieldTypeSingle'},
        {name: 'date', type: 'esriFieldTypeDate'},
        {name: 'oid64', type: 'esriFieldTypeOID', length: 8}
      ]
    });
  expect((await source.getSchema()).fields.map(field => field.type)).toEqual([
    'int64',
    'int16',
    'float32',
    'timestamp-millisecond',
    'int64'
  ]);
  expect((await source.getMetadata()).layers[0]).toMatchObject({name: '2', title: 'Records'});
});
