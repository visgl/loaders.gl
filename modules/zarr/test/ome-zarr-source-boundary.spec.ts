// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {OMEZarrImageSource, OMEZarrSourceLoader} from '../src/ome-zarr-source-loader';

const NUMERIC_TYPES = [
  ['uint8', Uint8Array],
  ['uint16', Uint16Array],
  ['uint32', Uint32Array],
  ['int8', Int8Array],
  ['int16', Int16Array],
  ['int32', Int32Array],
  ['float32', Float32Array],
  ['float64', Float64Array]
] as const;

/** Creates a two-pixel Zarr v3 pyramid with deterministic fill values and optional RGB chunks. */
function createFixture({
  dataType = 'uint8',
  interleaved = false,
  dimensionNames = true,
  axes = ['c', 'y', 'x'] as unknown[],
  attributes = {} as Record<string, unknown>,
  labels = undefined as string[] | undefined
} = {}) {
  const responses = new Map<string, BodyInit>();
  const requests: string[] = [];
  const multiscales = [
    {
      axes,
      datasets: [
        {path: '0'},
        {path: '1', coordinateTransformations: [{type: 'scale', scale: [1, 2, 2]}]}
      ],
      coordinateTransformations: [{type: 'translation', translation: [0, 1, 2]}]
    }
  ];
  responses.set(
    '/zarr.json',
    JSON.stringify({
      zarr_format: 3,
      node_type: 'group',
      attributes: {multiscales, ...attributes}
    })
  );
  for (const level of [0, 1]) {
    const shape = interleaved ? [1, level === 0 ? 2 : 1, 3] : [3, 1, level === 0 ? 2 : 1];
    responses.set(
      `/${level}/zarr.json`,
      JSON.stringify({
        zarr_format: 3,
        node_type: 'array',
        shape,
        data_type: dataType,
        chunk_grid: {name: 'regular', configuration: {chunk_shape: shape}},
        chunk_key_encoding: {name: 'default', configuration: {separator: '/'}},
        codecs: [{name: 'bytes', configuration: {endian: 'little'}}],
        fill_value: 7,
        dimension_names: dimensionNames
          ? interleaved
            ? ['y', 'x', '_c']
            : ['c', 'y', 'x']
          : undefined,
        attributes: {}
      })
    );
  }
  const TypedArray = NUMERIC_TYPES.find(([name]) => name === dataType)?.[1];
  if (TypedArray) {
    responses.set(
      '/0/c/0/0/0',
      new TypedArray(interleaved ? [1, 11, 21, 2, 12, 22] : [1, 2, 11, 12, 21, 22]).buffer
    );
  }
  const fetcher = vi.fn(async (input: RequestInfo | URL, _options?: RequestInit) => {
    const path = new URL(input instanceof Request ? input.url : String(input)).pathname.replace(
      '/image.zarr',
      ''
    );
    requests.push(path);
    const body = responses.get(path);
    return body === undefined ? new Response(null, {status: 404}) : new Response(body);
  });
  const source = new OMEZarrImageSource('https://example.test/image.zarr', {
    zarr: {requireConsolidatedMetadata: false, labels},
    core: {fetch: fetcher}
  });
  return {source, responses, requests, fetcher};
}

test.each(
  NUMERIC_TYPES
)('OME-Zarr preserves %s values through both channel layouts', async (dataType, TypedArray) => {
  for (const interleaved of [false, true]) {
    const {source, requests} = createFixture({dataType, interleaved});
    const raster = await source.getRaster({channels: [2, 0], interleaved: true});
    expect(raster.data).toBeInstanceOf(TypedArray);
    expect(Array.from(raster.data as InstanceType<typeof TypedArray>)).toEqual([21, 1, 22, 2]);
    const planar = await source.getRaster({channels: [1, 2], interleaved: false});
    expect(
      (planar.data as InstanceType<typeof TypedArray>[]).map(channel => Array.from(channel))
    ).toEqual([
      [11, 12],
      [21, 22]
    ]);
    const single = await source.getRaster({channels: [1], interleaved: false});
    expect(single.data).toBeInstanceOf(TypedArray);
    expect(Array.from(single.data as InstanceType<typeof TypedArray>)).toEqual([11, 12]);
    const chunkRequestCount = requests.filter(path => path.includes('/c/')).length;
    (single.data as InstanceType<typeof TypedArray>)[0] = 99;
    expect(
      Array.from((await source.getRaster({channels: [1]})).data as InstanceType<typeof TypedArray>)
    ).toEqual([11, 12]);
    expect(requests.filter(path => path.includes('/c/'))).toHaveLength(chunkRequestCount);
  }
});

test('OME-Zarr reorders and repeats channels even when the selection has every band', async () => {
  const {source} = createFixture({interleaved: true});
  expect(Array.from((await source.getRaster({interleaved: true})).data as Uint8Array)).toEqual([
    1, 11, 21, 2, 12, 22
  ]);
  expect(
    Array.from(
      (await source.getRaster({channels: [2, 0, 1], interleaved: true})).data as Uint8Array
    )
  ).toEqual([21, 1, 11, 22, 2, 12]);
  expect(
    Array.from(
      (await source.getRaster({channels: [1, 1, 0], interleaved: true})).data as Uint8Array
    )
  ).toEqual([11, 11, 1, 12, 12, 2]);
});

test('OME-Zarr resolves legacy axes, transformations, names and automatic pyramid levels', async () => {
  const {source} = createFixture({
    dimensionNames: false,
    axes: [{name: 'c'}, {name: 'y'}, {name: 'x'}]
  });
  const metadata = await source.getMetadata();
  expect(metadata).toMatchObject({
    name: 'image.zarr',
    sizeT: 1,
    sizeZ: 1,
    sizeC: 3,
    labels: ['c', 'y', 'x'],
    channels: []
  });
  expect(metadata.coordinateTransformations).toEqual([
    {type: 'translation', translation: [0, 1, 2]}
  ]);
  expect(metadata.levels[1]).toMatchObject({
    width: 1,
    height: 1,
    scale: [2, 1],
    coordinateTransformations: [{type: 'scale', scale: [1, 2, 2]}]
  });
  for (const [width, height, level] of [
    [1, 1, 1],
    [2, 1, 0],
    [100, 100, 0],
    [0, 1, 0]
  ]) {
    const raster = await source.getRaster({level: 'auto', width, height, channels: [0]});
    expect(raster.metadata?.level).toBe(level);
  }
  expect((await source.getQueryMetadata()).capabilities.levelOfDetail).toBe('pushdown');
  expect(Object.isFrozen(source.getRasterQueryCapabilities())).toBe(true);
  expect(OMEZarrSourceLoader.testURL('image.ZARR/0?key=1')).toBe(true);
  expect(OMEZarrSourceLoader.testURL('image.zarrish')).toBe(false);
});

test('OME-Zarr honors default channels and validates fractional and negative selections', async () => {
  const {fetcher} = createFixture();
  const source = OMEZarrSourceLoader.createDataSource('https://example.test/image.zarr', {
    zarr: {requireConsolidatedMetadata: false},
    omezarr: {defaultChannels: [2], interleaved: true},
    core: {fetch: fetcher}
  });
  expect(Array.from((await source.getRaster()).data as Uint8Array)).toEqual([21, 22]);
  for (const channels of [[-1], [0.5], [NaN]]) {
    await expect(source.getRaster({channels})).rejects.toThrow(/out of bounds/);
  }
  await expect(source.getRaster({t: 0.5})).rejects.toThrow(/time index/);
  await expect(source.getRaster({z: NaN})).rejects.toThrow(/z index/);
});

test('OME-Zarr resolves string axes and explicit dimension overrides', async () => {
  const {source} = createFixture({dimensionNames: false});
  expect((await source.getMetadata()).labels).toEqual(['c', 'y', 'x']);
  const explicit = createFixture({
    dimensionNames: false,
    axes: [{type: 'space'}],
    labels: ['c', 'y', 'x']
  }).source;
  expect((await explicit.getMetadata()).labels).toEqual(['c', 'y', 'x']);
});

test('OME-Zarr cancels cached raster reads without refetching chunks', async () => {
  const {source, requests} = createFixture();
  await source.getRaster({channels: [0]});
  const requestCount = requests.length;
  const controller = new AbortController();
  controller.abort();
  await expect(source.getRaster({channels: [0], signal: controller.signal})).rejects.toMatchObject({
    name: 'AbortError'
  });
  expect(requests).toHaveLength(requestCount);
});

test('OME-Zarr retries failed shared consolidated metadata and initialization requests', async () => {
  const {fetcher, responses} = createFixture();
  const source = new OMEZarrImageSource('https://example.test/image.zarr', {
    zarr: {metadataPath: 'zarr.json'},
    core: {fetch: fetcher}
  });
  const failed = await Promise.allSettled([source.getMetadata(), source.getMetadata()]);
  expect(failed.map(result => result.status)).toEqual(['rejected', 'rejected']);
  expect(fetcher).toHaveBeenCalledTimes(1);
  const group = JSON.parse(responses.get('/zarr.json') as string);
  group.consolidated_metadata = {kind: 'inline', metadata: {}};
  responses.set('/zarr.json', JSON.stringify(group));
  const [first, second] = await Promise.all([source.getMetadata(), source.getMetadata()]);
  expect(first).toBe(second);
  const consolidated = await source.getConsolidatedMetadata();
  expect(consolidated.format).toBe('v3');
  expect(await source.getConsolidatedMetadata()).toBe(consolidated);
});

test('OME-Zarr rejects invalid axes and unsupported numeric metadata', async () => {
  await expect(createFixture({labels: ['c', 'x', 'y']}).source.getMetadata()).rejects.toThrow(
    /Invalid labels/
  );
  await expect(createFixture({labels: ['y', 'x']}).source.getMetadata()).rejects.toThrow(
    /Labels do not match/
  );
  await expect(createFixture({dataType: 'uint64'}).source.getMetadata()).rejects.toThrow(
    /not currently supported/
  );
  await expect(
    createFixture({dimensionNames: false, axes: [{type: 'space'}]}).source.getMetadata()
  ).rejects.toThrow(/Labels do not match/);
});

test('OME-Zarr maps missing file responses into format probes through an injected core API', async () => {
  const {fetcher} = createFixture();
  const fetchFile = vi.fn(async (url: string, options?: RequestInit) =>
    url.endsWith('zarr.json')
      ? new Response(null, {status: 400, statusText: 'ENOENT: missing file'})
      : fetcher(url, options)
  );
  const source = new OMEZarrImageSource(
    'https://example.test/image.zarr',
    {zarr: {requireConsolidatedMetadata: false}},
    {fetchFile} as any
  );
  await expect(source.getMetadata()).rejects.toThrow();
  expect(fetchFile.mock.calls.some(([url]) => url.endsWith('.zgroup'))).toBe(true);
});
