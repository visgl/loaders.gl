// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {ManagedVectorSource, OGCAPIFeaturesSource, WFSVectorSource} from '@loaders.gl/wms';
import type {GetFeaturesParameters} from '@loaders.gl/loader-utils';

const PARAMETERS: GetFeaturesParameters = {
  layers: 'roads',
  boundingBox: [
    [0, 0],
    [10, 10]
  ],
  crs: 'CRS84',
  requestCrs: 'CRS84',
  format: 'geojson'
};

/** Encodes a small service response with stable feature IDs. */
function createResponse(identifiers: number[], metadata = {}, headers = {}): Response {
  return new Response(
    JSON.stringify({
      type: 'FeatureCollection',
      features: identifiers.map(id => ({
        type: 'Feature',
        id,
        properties: {},
        geometry: {type: 'Point', coordinates: [id, id]}
      })),
      ...metadata
    }),
    {headers}
  );
}

test('WFS 2.0 offsets use actual page counts under server caps and enable verified extent reuse', async () => {
  const source = new WFSVectorSource('https://example.com/wfs?token=demo', {
    wfs: {
      pagination: {pageSize: 10},
      wfsParameters: {sortBy: 'id', filter: '<Filter />', propertyName: ['id', 'geometry']}
    }
  });
  const requests: URL[] = [];
  source.fetch = vi.fn(async url => {
    const request = new URL(String(url));
    requests.push(request);
    const offset = Number(request.searchParams.get('STARTINDEX') || 0);
    return createResponse(offset === 0 ? [1, 2] : [3], {
      numberMatched: 3,
      numberReturned: offset === 0 ? 2 : 1
    });
  });
  const managed = new ManagedVectorSource(source);
  const result = await managed.getFeatures(PARAMETERS);
  expect(result).toMatchObject({features: [{id: 1}, {id: 2}, {id: 3}]});
  expect(requests.map(url => url.searchParams.get('STARTINDEX'))).toEqual([null, '2']);
  for (const url of requests) {
    expect(url.searchParams.get('COUNT')).toBe('10');
    expect(url.searchParams.get('token')).toBe('demo');
    expect(url.searchParams.get('SORTBY')).toBe('id');
    expect(url.searchParams.get('FILTER')).toBe('<Filter />');
    expect(url.searchParams.get('PROPERTYNAME')).toBe('id,geometry');
    expect(url.searchParams.get('BBOX')).toBe('0,0,10,10,CRS84');
  }
  await managed.getFeatures(PARAMETERS);
  expect(source.fetch).toHaveBeenCalledTimes(2);
  expect(managed.getLoadedExtents(PARAMETERS)).toEqual([PARAMETERS.boundingBox]);
});

test('WFS follows GML next links and handles an empty terminal collection', async () => {
  const source = new WFSVectorSource('https://example.com/wfs', {
    wfs: {pagination: {}, wfsParameters: {outputFormat: 'application/gml+xml'}}
  });
  const requests: string[] = [];
  source.fetch = async url => {
    requests.push(String(url));
    const members =
      requests.length === 1
        ? '<wfs:member><app:road gml:id="one"><app:geometry><gml:Point><gml:pos>1 1</gml:pos></gml:Point></app:geometry></app:road></wfs:member>'
        : '';
    const next = requests.length === 1 ? ' next="?cursor=last"' : '';
    return new Response(
      `<wfs:FeatureCollection xmlns:wfs="http://www.opengis.net/wfs/2.0" xmlns:gml="http://www.opengis.net/gml/3.2" xmlns:app="urn:app" numberMatched="1" numberReturned="${requests.length === 1 ? 1 : 0}"${next}>${members}</wfs:FeatureCollection>`,
      {headers: {'content-type': 'application/gml+xml'}}
    );
  };
  expect(await source.getFeatures(PARAMETERS)).toMatchObject({
    numberMatched: 1,
    numberReturned: 1,
    features: [{id: 'one'}]
  });
  expect(requests[1]).toBe('https://example.com/wfs?cursor=last');
});

test('WFS 1.1 requires next links for truncated totals, and offset subsets do not certify whole extents', async () => {
  const legacy = new WFSVectorSource('https://example.com/wfs', {
    wfs: {pagination: {}, wfsParameters: {version: '1.1.0'}}
  });
  legacy.fetch = async url => {
    expect(new URL(String(url)).searchParams.get('MAXFEATURES')).toBe('1000');
    return createResponse([1], {numberMatched: 2});
  };
  await expect(legacy.getFeatures(PARAMETERS)).rejects.toThrow('WFS 1.1');
  const subset = new WFSVectorSource('https://example.com/wfs', {
    wfs: {pagination: {}, wfsParameters: {startIndex: 2}}
  });
  subset.fetch = async () => createResponse([3], {numberMatched: 3});
  const managed = new ManagedVectorSource(subset);
  await managed.getFeatures(PARAMETERS);
  expect(managed.getLoadedExtents(PARAMETERS)).toEqual([]);
});

test('OGC API Features follows header/body cursor links, preserves endpoint parameters and returns Arrow', async () => {
  const source = new OGCAPIFeaturesSource('https://example.com/api/collections/roads?token=demo', {
    'ogc-api': {pagination: {pageSize: 1}}
  });
  const requests: URL[] = [];
  const controller = new AbortController();
  source.fetch = async (url, options) => {
    expect(options?.signal).toBe(controller.signal);
    requests.push(new URL(String(url)));
    if (requests.length === 1)
      return createResponse(
        [1],
        {numberMatched: 2},
        {link: '<?cursor=last&token=demo>; rel="next"'}
      );
    return createResponse([2], {numberMatched: 2});
  };
  const result = await source.getFeatures({
    ...PARAMETERS,
    format: 'arrow',
    signal: controller.signal
  });
  expect(result.shape).toBe('arrow-table');
  if (result.shape === 'arrow-table') expect(result.data.numRows).toBe(2);
  expect(requests[0].pathname).toBe('/api/collections/roads/items');
  expect(requests[0].searchParams.get('limit')).toBe('1');
  expect(requests[0].searchParams.get('token')).toBe('demo');
  expect(requests[1].search).toBe('?cursor=last&token=demo');
});

test('OGC API Features refuses count truncation without a next link, but does not invent unknown totals', async () => {
  const source = new OGCAPIFeaturesSource('https://example.com/api', {'ogc-api': {pagination: {}}});
  source.fetch = async () => createResponse([1], {numberMatched: 2});
  await expect(source.getFeatures(PARAMETERS)).rejects.toThrow('without a next link');
  source.fetch = async () => createResponse([1]);
  const managed = new ManagedVectorSource(source);
  await managed.getFeatures(PARAMETERS);
  expect(managed.getLoadedExtents(PARAMETERS)).toEqual([]);
});

test('single-page calls remain unchanged and the explicit page API does not fetch ahead', async () => {
  const source = new OGCAPIFeaturesSource('https://example.com/api');
  source.fetch = vi.fn(async () =>
    createResponse([1], {numberMatched: 2, links: [{rel: 'next', href: '?cursor=two'}]})
  );
  expect(await source.getFeatures(PARAMETERS)).toMatchObject({
    numberMatched: 2,
    features: [{id: 1}]
  });
  for await (const page of source.getFeaturesInPages(PARAMETERS, {pageSize: 2})) {
    expect(page.features).toHaveLength(1);
    break;
  }
  expect(source.fetch).toHaveBeenCalledTimes(2);
});

test('failed later pages establish no managed coverage and a retry gathers every page', async () => {
  const source = new OGCAPIFeaturesSource('https://example.com/api', {'ogc-api': {pagination: {}}});
  let fail = true;
  source.fetch = async url =>
    String(url).includes('cursor=two')
      ? fail
        ? new Response('unavailable', {status: 503})
        : createResponse([2], {numberMatched: 2})
      : createResponse([1], {numberMatched: 2, links: [{rel: 'next', href: '?cursor=two'}]});
  const managed = new ManagedVectorSource(source);
  await expect(managed.getFeatures(PARAMETERS)).rejects.toThrow('503');
  expect(managed.getLoadedExtents(PARAMETERS)).toEqual([]);
  fail = false;
  expect(await managed.getFeatures(PARAMETERS)).toMatchObject({features: [{id: 1}, {id: 2}]});
  expect(managed.getLoadedExtents(PARAMETERS)).toHaveLength(1);
});

test('WFS endpoint offsets are case insensitive and count-only or invalid-offset requests fail before fetching', async () => {
  const source = new WFSVectorSource('https://example.com/wfs?startIndex=1', {
    wfs: {pagination: {}}
  });
  const offsets: string[] = [];
  source.fetch = async url => {
    const request = new URL(String(url));
    const offset =
      request.searchParams.get('STARTINDEX') || request.searchParams.get('startIndex') || '';
    offsets.push(offset);
    return createResponse([Number(offset) + 1], {numberMatched: 3});
  };
  expect(await source.getFeatures(PARAMETERS)).toMatchObject({
    numberMatched: 3,
    features: [{id: 2}, {id: 3}]
  });
  expect(offsets).toEqual(['1', '2']);
  for (const query of ['resultType=hits', 'STARTINDEX=-1']) {
    const invalid = new WFSVectorSource(`https://example.com/wfs?${query}`, {
      wfs: {pagination: {}}
    });
    invalid.fetch = vi.fn();
    await expect(invalid.getFeatures(PARAMETERS)).rejects.toThrow(/resultType|startIndex/);
    expect(invalid.fetch).not.toHaveBeenCalled();
  }
});

test('WFS offset fallback after an opaque cursor page preserves the original bounded query', async () => {
  const source = new WFSVectorSource('https://example.com/wfs?token=demo', {
    wfs: {pagination: {pageSize: 1}, wfsParameters: {sortBy: 'id', filter: '<Filter />'}}
  });
  const requests: URL[] = [];
  source.fetch = async url => {
    requests.push(new URL(String(url)));
    return createResponse([requests.length], {
      numberMatched: 3,
      ...(requests.length === 1 ? {next: '/opaque/page?cursor=two'} : {})
    });
  };
  expect(await source.getFeatures(PARAMETERS)).toMatchObject({
    features: [{id: 1}, {id: 2}, {id: 3}]
  });
  expect(requests[1].pathname).toBe('/opaque/page');
  const offsetRequest = requests[2];
  expect(offsetRequest.pathname).toBe('/wfs');
  expect(offsetRequest.searchParams.get('STARTINDEX')).toBe('2');
  expect(offsetRequest.searchParams.get('COUNT')).toBe('1');
  expect(offsetRequest.searchParams.get('BBOX')).toBe('0,0,10,10,CRS84');
  expect(offsetRequest.searchParams.get('SRSNAME')).toBe('CRS84');
  expect(offsetRequest.searchParams.get('SORTBY')).toBe('id');
  expect(offsetRequest.searchParams.get('FILTER')).toBe('<Filter />');
  expect(offsetRequest.searchParams.get('token')).toBe('demo');
  expect(offsetRequest.searchParams.has('cursor')).toBe(false);
});
