// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {ManagedVectorSource, type ManagedVectorSourceOptions} from '@loaders.gl/wms';
import type {Feature, GeoJSONTable} from '@loaders.gl/schema';
import type {GetFeaturesParameters, VectorSource} from '@loaders.gl/loader-utils';

const parameters: GetFeaturesParameters = {
  layers: ['roads'],
  crs: 'EPSG:3857',
  requestCrs: 'EPSG:3857',
  boundingBox: [
    [0, 0],
    [10, 10]
  ]
};

/** Creates a tiny point with optional stable ID. */
function makeFeature(coordinate: number, identifier?: string | number): Feature {
  return {
    type: 'Feature',
    id: identifier,
    properties: {coordinate},
    geometry: {type: 'Point', coordinates: [coordinate, coordinate]}
  };
}
/** Creates a complete GeoJSON response with preserved service count metadata. */
function makeTable(features: Feature[] = []): GeoJSONTable & {numberMatched: number} {
  return {
    shape: 'geojson-table',
    type: 'FeatureCollection',
    features,
    numberMatched: features.length
  };
}
/** Creates a source whose service calls can be controlled independently. */
function makeSource(getFeatures = vi.fn<VectorSource['getFeatures']>(async () => makeTable())) {
  return {
    getSchema: vi.fn(async () => ({fields: [], metadata: {}})),
    getMetadata: vi.fn(async () => ({name: 'test', keywords: [], layers: []})),
    getFeatures
  };
}
/** Allows tests to resolve a pending service call explicitly. */
function makeDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return {promise, resolve, reject};
}

test('contained and overlapping extents reuse complete coverage; only uncovered strips load', async () => {
  const source = makeSource(
    vi.fn(async () =>
      makeTable([makeFeature(2, 1), makeFeature(8, '1'), makeFeature(20, 'outside')])
    )
  );
  const managed = new ManagedVectorSource(source);
  await managed.getFeatures(parameters);
  const contained = (await managed.getFeatures({
    ...parameters,
    boundingBox: [
      [1, 1],
      [3, 3]
    ]
  })) as GeoJSONTable;
  expect(contained.features.map(feature => feature.id)).toEqual([1]);
  expect(source.getFeatures).toHaveBeenCalledTimes(1);
  await managed.getFeatures({
    ...parameters,
    boundingBox: [
      [5, 0],
      [15, 10]
    ]
  });
  expect(source.getFeatures.mock.calls[1][0].boundingBox).toEqual([
    [10, 0],
    [15, 10]
  ]);
  await managed.getFeatures({
    ...parameters,
    boundingBox: [
      [0, 0],
      [15, 10]
    ]
  });
  expect(source.getFeatures).toHaveBeenCalledTimes(2);
  const extents = managed.getLoadedExtents(parameters);
  extents[0][0][0] = -999;
  expect(managed.getLoadedExtents(parameters)[0]).toEqual(parameters.boundingBox);
});

test('surrounding requests subtract coverage in both dimensions', async () => {
  const source = makeSource();
  const managed = new ManagedVectorSource(source);
  await managed.getFeatures({
    ...parameters,
    boundingBox: [
      [2, 2],
      [8, 8]
    ]
  });
  await managed.getFeatures(parameters);
  expect(source.getFeatures.mock.calls.slice(1).map(([request]) => request.boundingBox)).toEqual([
    [
      [0, 0],
      [2, 10]
    ],
    [
      [8, 0],
      [10, 10]
    ],
    [
      [2, 0],
      [8, 2]
    ],
    [
      [2, 8],
      [8, 10]
    ]
  ]);
  await managed.getFeatures(parameters);
  expect(source.getFeatures).toHaveBeenCalledTimes(5);
});

test.each([
  {numberMatched: 2},
  {numberMatched: 'unknown'},
  {},
  {numberMatched: 1, links: [{rel: 'next'}]}
])('unknown, truncated or next-page metadata never establishes coverage: %j', async metadata => {
  const source = makeSource(
    vi.fn(
      async () =>
        ({...makeTable([makeFeature(1)]), numberMatched: undefined, ...metadata}) as GeoJSONTable
    )
  );
  const managed = new ManagedVectorSource(source);
  await managed.getFeatures(parameters);
  await managed.getFeatures(parameters);
  expect(source.getFeatures).toHaveBeenCalledTimes(2);
  expect(managed.getLoadedExtents(parameters)).toEqual([]);
});

test('totalFeatures and caller completeness policy can certify responses', async () => {
  const source = makeSource(
    vi.fn(async () => ({...makeTable(), numberMatched: undefined, totalFeatures: 0}))
  );
  const managed = new ManagedVectorSource(source);
  await managed.getFeatures(parameters);
  await managed.getFeatures(parameters);
  expect(source.getFeatures).toHaveBeenCalledTimes(1);
  const policy = vi.fn<NonNullable<ManagedVectorSourceOptions['isComplete']>>(() => true);
  const trusted = new ManagedVectorSource(makeSource(), {isComplete: policy});
  await trusted.getFeatures(parameters);
  expect(policy.mock.calls[0][1].format).toBe('geojson');
});

test('typed IDs deduplicate newest data and absent IDs remain; Arrow and binary outputs reuse coverage', async () => {
  const source = makeSource(
    vi.fn(async () => makeTable([makeFeature(5, 1), makeFeature(5, '1'), makeFeature(5)]))
  );
  source.getFeatures.mockResolvedValueOnce(
    makeTable([makeFeature(4, 1), makeFeature(4, '1'), makeFeature(4)])
  );
  const managed = new ManagedVectorSource(source);
  await managed.getFeatures(parameters);
  const result = (await managed.getFeatures({
    ...parameters,
    boundingBox: [
      [0, 0],
      [15, 10]
    ]
  })) as GeoJSONTable;
  expect(result.features.map(feature => feature.properties?.coordinate)).toEqual([5, 5, 4, 5]);
  const arrow = await managed.getFeatures({...parameters, format: 'arrow'});
  expect(arrow.shape).toBe('arrow-table');
  if (arrow.shape === 'arrow-table') expect(arrow.data.numRows).toBe(4);
  const binary = await managed.getFeatures({...parameters, format: 'binary'});
  expect(binary.shape).toBe('binary-feature-collection');
  expect(source.getFeatures).toHaveBeenCalledTimes(2);
});

test('custom stable IDs and collection bounds support non-point data; null and empty geometries do not match', async () => {
  const collection: Feature = {
    type: 'Feature',
    properties: {key: 'road'},
    geometry: {
      type: 'GeometryCollection',
      geometries: [
        {
          type: 'LineString',
          coordinates: [
            [-1, 5],
            [20, 5]
          ]
        }
      ]
    }
  };
  const source = makeSource(
    vi.fn(async () =>
      makeTable([
        collection,
        collection,
        {type: 'Feature', properties: {}, geometry: null},
        {type: 'Feature', properties: {}, geometry: {type: 'Point', coordinates: []}}
      ])
    )
  );
  const managed = new ManagedVectorSource(source, {
    getFeatureId: feature => feature.properties?.key
  });
  const result = (await managed.getFeatures(parameters)) as GeoJSONTable;
  expect(result.features).toEqual([collection]);
});

test('layer/CRS scopes, bounded eviction, invalidation and clear reload appropriate requests', async () => {
  const source = makeSource();
  const managed = new ManagedVectorSource(source, {maxCachedExtents: 2});
  await managed.getFeatures(parameters);
  await managed.getFeatures({...parameters, layers: 'other'});
  await managed.getFeatures({...parameters, crs: 'EPSG:4326', requestCrs: 'EPSG:4326'});
  expect(managed.getLoadedExtents(parameters)).toEqual([]);
  await managed.getFeatures(parameters);
  managed.invalidateExtent({
    ...parameters,
    boundingBox: [
      [9, 9],
      [11, 11]
    ]
  });
  expect(managed.getLoadedExtents(parameters)).toEqual([]);
  await managed.getFeatures(parameters);
  managed.clear();
  expect(managed.getLoadedExtents(parameters)).toEqual([]);
  await managed.getFeatures(parameters);
  expect(source.getFeatures).toHaveBeenCalledTimes(6);
  expect(() => new ManagedVectorSource(source, {maxCachedExtents: 0})).toThrow('positive integer');
});

test('failed requests and wrong response shapes can be retried', async () => {
  const source = makeSource();
  source.getFeatures.mockRejectedValueOnce(new Error('offline'));
  const managed = new ManagedVectorSource(source);
  await expect(managed.getFeatures(parameters)).rejects.toThrow('offline');
  expect(managed.getLoadedExtents(parameters)).toEqual([]);
  source.getFeatures.mockResolvedValueOnce({shape: 'arrow-table'} as never);
  await expect(managed.getFeatures(parameters)).rejects.toThrow('GeoJSON');
  await managed.getFeatures(parameters);
  expect(source.getFeatures).toHaveBeenCalledTimes(3);
});

test('shared requests allow independent cancellation; all consumers canceled aborts the fetch', async () => {
  const deferred = makeDeferred<GeoJSONTable>();
  const source = makeSource(vi.fn(async () => deferred.promise));
  const managed = new ManagedVectorSource(source);
  const firstController = new AbortController();
  const first = managed.getFeatures({...parameters, signal: firstController.signal});
  const second = managed.getFeatures(parameters);
  const firstAssertion = expect(first).rejects.toMatchObject({name: 'AbortError'});
  firstController.abort();
  await firstAssertion;
  expect(source.getFeatures.mock.calls[0][0].signal?.aborted).toBe(false);
  deferred.resolve(makeTable());
  await second;
  expect(source.getFeatures).toHaveBeenCalledTimes(1);
  managed.clear();
  const lastResponse = makeDeferred<GeoJSONTable>();
  source.getFeatures.mockImplementationOnce(async () => lastResponse.promise);
  const controller = new AbortController();
  const last = managed.getFeatures({...parameters, signal: controller.signal});
  const lastAssertion = expect(last).rejects.toMatchObject({name: 'AbortError'});
  await vi.waitFor(() => expect(source.getFeatures).toHaveBeenCalledTimes(2));
  controller.abort();
  await lastAssertion;
  expect(source.getFeatures.mock.calls[1][0].signal?.aborted).toBe(true);
  lastResponse.resolve(makeTable());
  await Promise.resolve();
  expect(managed.getLoadedExtents(parameters)).toEqual([]);
});

test('invalidation aborts waiters and late ignored-abort responses cannot restore coverage', async () => {
  const deferred = makeDeferred<GeoJSONTable>();
  const source = makeSource(vi.fn(async () => deferred.promise));
  const managed = new ManagedVectorSource(source);
  const request = managed.getFeatures(parameters);
  await vi.waitFor(() => expect(source.getFeatures).toHaveBeenCalledTimes(1));
  const assertion = expect(request).rejects.toMatchObject({name: 'AbortError'});
  managed.invalidateExtent(parameters);
  await assertion;
  expect(source.getFeatures.mock.calls[0][0].signal?.aborted).toBe(true);
  deferred.resolve(makeTable());
  await Promise.resolve();
  expect(managed.getLoadedExtents(parameters)).toEqual([]);
  await managed.getFeatures(parameters);
  expect(source.getFeatures).toHaveBeenCalledTimes(2);
});

test('unknown or differing CRSs and degenerate bounds pass through; metadata delegation and validation', async () => {
  const source = makeSource();
  const managed = new ManagedVectorSource(source);
  await managed.getFeatures({...parameters, requestCrs: undefined});
  await managed.getFeatures({...parameters, requestCrs: 'EPSG:4326'});
  await managed.getFeatures({
    ...parameters,
    boundingBox: [
      [1, 1],
      [1, 1]
    ]
  });
  expect(managed.getLoadedExtents(parameters)).toEqual([]);
  expect(source.getFeatures).toHaveBeenCalledTimes(3);
  expect(await managed.getSchema()).toEqual({fields: [], metadata: {}});
  expect((await managed.getMetadata()).name).toBe('test');
  await expect(
    managed.getFeatures({
      ...parameters,
      boundingBox: [
        [2, 1],
        [1, 1]
      ]
    })
  ).rejects.toThrow('ordered');
  await expect(
    managed.getFeatures({
      ...parameters,
      boundingBox: [
        [0, 0],
        [Infinity, 1]
      ]
    })
  ).rejects.toThrow('finite');
  const controller = new AbortController();
  controller.abort();
  await expect(
    managed.getFeatures({...parameters, signal: controller.signal})
  ).rejects.toMatchObject({name: 'AbortError'});
});

test('newest completion wins for shared IDs even when requests finish out of order', async () => {
  const firstResponse = makeDeferred<GeoJSONTable>();
  const secondResponse = makeDeferred<GeoJSONTable>();
  const source = makeSource(
    vi
      .fn<VectorSource['getFeatures']>()
      .mockImplementationOnce(() => firstResponse.promise)
      .mockImplementationOnce(() => secondResponse.promise)
  );
  const managed = new ManagedVectorSource(source);
  const first = managed.getFeatures(parameters);
  const second = managed.getFeatures({
    ...parameters,
    boundingBox: [
      [10, 0],
      [20, 10]
    ]
  });
  secondResponse.resolve(makeTable([makeFeature(15, 'moving')]));
  await second;
  firstResponse.resolve(makeTable([makeFeature(2, 'moving')]));
  await first;
  const result = (await managed.getFeatures({
    ...parameters,
    boundingBox: [
      [0, 0],
      [20, 10]
    ]
  })) as GeoJSONTable;
  expect(result.features.map(feature => feature.properties?.coordinate)).toEqual([2]);
});

test('an updated ID moved outside the query does not resurrect its old cached geometry', async () => {
  const source = makeSource();
  source.getFeatures.mockResolvedValueOnce(makeTable([makeFeature(2, 'moving')]));
  source.getFeatures.mockResolvedValueOnce(makeTable([makeFeature(15, 'moving')]));
  const managed = new ManagedVectorSource(source);
  await managed.getFeatures(parameters);
  await managed.getFeatures({
    ...parameters,
    boundingBox: [
      [10, 10],
      [20, 20]
    ]
  });
  const result = (await managed.getFeatures(parameters)) as GeoJSONTable;
  expect(result.features).toEqual([]);
});
