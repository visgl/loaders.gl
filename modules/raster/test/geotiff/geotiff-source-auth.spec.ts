// loaders.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {createBearerTokenCredential, sampleRaster} from '@loaders.gl/core/loader-utils';
import type {RequestAuthentication, TokenProvider} from '@loaders.gl/core/loader-utils';
import {GeoTIFFRasterSource} from '@loaders.gl/raster/geotiff/bundled';
import type {GeoTIFFSourceLoaderOptions} from '@loaders.gl/raster/geotiff/bundled';

/** Origin of the in-memory range endpoint. */
const ORIGIN = 'https://rasters.example.invalid';
/** URL used to open the GeoTIFF source. */
const SOURCE_URL = `${ORIGIN}/fixture.tif`;
/** Byte offset of the image file directory, beyond the initial header read. */
const DIRECTORY_OFFSET = 2048;
/** Byte offset of the pixel tile, beyond the directory read. */
const PIXEL_OFFSET = 4096;

/** Captures one outgoing GeoTIFF request at the fetch boundary. */
type RangeRequest = {
  /** URL after any authentication rewrite. */
  url: string;
  /** Headers after request authentication. */
  headers: Headers;
  /** First requested byte. */
  offset: number;
};

/** Builds a little-endian GeoTIFF containing one two-pixel float tile. */
function createFloatTIFF(): Uint8Array<ArrayBuffer> {
  const pixelScaleOffset = DIRECTORY_OFFSET + 200;
  const tiepointOffset = pixelScaleOffset + 24;
  const geoKeyOffset = tiepointOffset + 48;
  const bytes = new Uint8Array(PIXEL_OFFSET + 8);
  const view = new DataView(bytes.buffer);
  bytes.set([73, 73, 42, 0]);
  view.setUint32(4, DIRECTORY_OFFSET, true);
  const entries = [
    [256, 4, 1, 2],
    [257, 4, 1, 1],
    [258, 3, 1, 32],
    [259, 3, 1, 1],
    [262, 3, 1, 1],
    [277, 3, 1, 1],
    [284, 3, 1, 1],
    [322, 4, 1, 2],
    [323, 4, 1, 1],
    [324, 4, 1, PIXEL_OFFSET],
    [325, 4, 1, 8],
    [339, 3, 1, 3],
    [33550, 12, 3, pixelScaleOffset],
    [33922, 12, 6, tiepointOffset],
    [34735, 3, 16, geoKeyOffset]
  ];
  view.setUint16(DIRECTORY_OFFSET, entries.length, true);
  entries.forEach(([tag, type, count, value], index) => {
    const offset = DIRECTORY_OFFSET + 2 + index * 12;
    view.setUint16(offset, tag, true);
    view.setUint16(offset + 2, type, true);
    view.setUint32(offset + 4, count, true);
    view.setUint32(offset + 8, value, true);
  });
  [1, 1, 0].forEach((value, index) => view.setFloat64(pixelScaleOffset + index * 8, value, true));
  [0, 0, 0, 0, 1, 0].forEach((value, index) =>
    view.setFloat64(tiepointOffset + index * 8, value, true)
  );
  [1, 1, 0, 3, 1024, 0, 1, 2, 1025, 0, 1, 1, 2048, 0, 1, 4326].forEach((value, index) =>
    view.setUint16(geoKeyOffset + index * 2, value, true)
  );
  view.setFloat32(PIXEL_OFFSET, 4, true);
  view.setFloat32(PIXEL_OFFSET + 4, 8, true);
  return bytes;
}

/** Reads and checks the fixture through a fake range endpoint, returning its request log. */
async function readRemoteRaster(options: GeoTIFFSourceLoaderOptions, rejectTokenOnce?: string) {
  const bytes = createFloatTIFF();
  const requests: RangeRequest[] = [];
  let rejected = false;
  const source = new GeoTIFFRasterSource(SOURCE_URL, {
    ...options,
    core: {
      ...options.core,
      fetch: async (url, requestOptions) => {
        const headers = new Headers(requestOptions?.headers);
        const range = headers.get('Range');
        const match = range?.match(/^bytes=(\d+)-(\d+)$/);
        const offset = Number(match?.[1]);
        requests.push({url, headers, offset});
        if (!match) throw new Error(`Expected a single GeoTIFF byte range, received ${range}`);
        if (
          rejectTokenOnce &&
          !rejected &&
          headers.get('Authorization') === `Bearer ${rejectTokenOnce}`
        ) {
          rejected = true;
          return new Response(null, {status: 401});
        }
        const end = Math.min(Number(match[2]), bytes.length - 1);
        return new Response(bytes.slice(offset, end + 1), {
          status: 206,
          headers: {'Content-Range': `bytes ${offset}-${end}/${bytes.length}`}
        });
      }
    }
  });
  try {
    const metadata = await source.getMetadata();
    expect(metadata).toMatchObject({width: 2, height: 1, crs: 'EPSG:4326'});
    const raster = await source.getRaster({
      interleaved: true,
      viewport: {
        id: 'fixture',
        width: 2,
        height: 1,
        center: [1, 0.5],
        zoom: 0,
        bounds: metadata.boundingBox!,
        project: coordinates => coordinates,
        unprojectPosition: ([longitude, latitude]) => [longitude, latitude, 0]
      }
    });
    expect(sampleRaster(raster, [0, 0]).values).toEqual([4]);
    expect(sampleRaster(raster, [1, 0]).values).toEqual([8]);
    expect(requests.map(({offset}) => offset)).toEqual(
      expect.arrayContaining([0, DIRECTORY_OFFSET, PIXEL_OFFSET])
    );
    return requests;
  } finally {
    source.finalize();
  }
}

test('sends an origin-scoped bearer token with every GeoTIFF byte range', async () => {
  const credential = createBearerTokenCredential({
    id: 'static',
    origins: [ORIGIN],
    token: 'fixture-token'
  });
  const requests = await readRemoteRaster({core: {credentials: [credential]}});

  for (const {url, headers} of requests) {
    expect(url).toBe(SOURCE_URL);
    expect(headers.get('Authorization')).toBe('Bearer fixture-token');
  }
});

test('refreshes a rejected token once and replays the same GeoTIFF byte range', async () => {
  let currentToken = 'first-token';
  const token = vi.fn<TokenProvider>(({reason}) => {
    if (reason === 'refresh') currentToken = 'fresh-token';
    return currentToken;
  });
  const credential = createBearerTokenCredential({
    id: 'refreshing',
    origins: [ORIGIN],
    token,
    refreshStatusCodes: [401]
  });
  const requests = await readRemoteRaster({core: {credentials: [credential]}}, 'first-token');

  expect(token).toHaveBeenNthCalledWith(1, expect.objectContaining({reason: 'request'}));
  const refreshCalls = token.mock.calls.filter(([{reason}]) => reason === 'refresh');
  expect(refreshCalls).toHaveLength(1);
  expect(refreshCalls[0][0].response?.status).toBe(401);
  const [initial, replay, ...subsequent] = requests;
  expect(initial.headers.get('Authorization')).toBe('Bearer first-token');
  expect(replay.url).toBe(initial.url);
  expect(replay.headers.get('Range')).toBe(initial.headers.get('Range'));
  for (const {headers} of [replay, ...subsequent]) {
    expect(headers.get('Authorization')).toBe('Bearer fresh-token');
  }
});

test('omits the bearer token when the GeoTIFF origin is outside its scope', async () => {
  const credential = createBearerTokenCredential({
    id: 'unrelated',
    origins: ['https://other.example.invalid'],
    token: 'other-token'
  });
  const requests = await readRemoteRaster({core: {credentials: [credential]}});

  for (const {headers} of requests) {
    expect(headers.has('Authorization')).toBe(false);
  }
});

test('signs every GeoTIFF range URL and preserves the byte range', async () => {
  const signedRanges: (string | null)[] = [];
  const credential: RequestAuthentication = {
    id: 'signing',
    type: 'request',
    origins: [ORIGIN],
    /** Appends a test signature and records the range the signer received. */
    authenticate({url, options}) {
      signedRanges.push(new Headers(options.headers).get('Range'));
      const signedURL = new URL(url);
      signedURL.searchParams.set('signature', 'fixture-signature');
      return {url: signedURL.toString(), options};
    }
  };
  const requests = await readRemoteRaster({core: {credentials: [credential]}});

  expect(requests.map(({headers}) => headers.get('Range'))).toEqual(signedRanges);
  for (const {url} of requests) {
    expect(url).toBe(`${SOURCE_URL}?signature=fixture-signature`);
  }
});

test('sends static GeoTIFF headers alongside the bearer token', async () => {
  const credential = createBearerTokenCredential({
    id: 'static',
    origins: [ORIGIN],
    token: 'fixture-token'
  });
  const requests = await readRemoteRaster({
    core: {credentials: [credential]},
    geotiff: {headers: {'X-Fixture': 'fixture-header'}}
  });

  for (const {headers} of requests) {
    expect(headers.get('X-Fixture')).toBe('fixture-header');
    expect(headers.get('Authorization')).toBe('Bearer fixture-token');
  }
});
