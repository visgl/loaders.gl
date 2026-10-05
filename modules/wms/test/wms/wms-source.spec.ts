// loaders.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {withFetchMock, mockResults, requestInits} from '../test-utils/fetch-spy';
import {ImageSource, WMSSourceLoader} from '@loaders.gl/wms';
const WMS_SERVICE_URL = 'https:/mock-wms-service';
const WMS_VERSION = '1.3.0';
test('WMSSourceLoader#constructor', async () => {
  const wmsImageSource = WMSSourceLoader.createDataSource(WMS_SERVICE_URL, {});
  const getCapabilitiesUrl = wmsImageSource.getCapabilitiesURL();
  expect(getCapabilitiesUrl, 'getCapabilitiesURL').toBe(
    `https:/mock-wms-service?SERVICE=WMS&VERSION=${WMS_VERSION}&REQUEST=GetCapabilities`
  );
});
test('ImageSource legacy runtime guard recognizes the structural capability', () => {
  const wmsImageSource = WMSSourceLoader.createDataSource(WMS_SERVICE_URL, {});

  expect(wmsImageSource instanceof ImageSource).toBe(true);
  expect({} instanceof ImageSource).toBe(false);
});
test('WMSSourceLoader#getMapURL', async () => {
  let wmsImageSource = WMSSourceLoader.createDataSource(WMS_SERVICE_URL, {});
  let getMapUrl = wmsImageSource.getMapURL({
    width: 800,
    height: 600,
    bbox: [30, 70, 35, 75],
    layers: ['oms'],
    crs: 'EPSG:3857'
  });
  expect(getMapUrl, 'getMapURL layers in params').toBe(
    `https:/mock-wms-service?SERVICE=WMS&VERSION=${WMS_VERSION}&REQUEST=GetMap&FORMAT=image/png&LAYERS=oms&STYLES=&CRS=EPSG:3857&WIDTH=800&HEIGHT=600&BBOX=30,70,35,75`
  );
  wmsImageSource = WMSSourceLoader.createDataSource(WMS_SERVICE_URL, {
    wmsParameters: {layers: ['oms'], crs: 'EPSG:3857'}
  });
  getMapUrl = wmsImageSource.getMapURL({
    width: 800,
    height: 600,
    bbox: [30, 70, 35, 75]
  });
  expect(getMapUrl, 'getMapURL layers in constructor').toBe(
    `https:/mock-wms-service?SERVICE=WMS&VERSION=${WMS_VERSION}&REQUEST=GetMap&FORMAT=image/png&LAYERS=oms&STYLES=&CRS=EPSG:3857&WIDTH=800&HEIGHT=600&BBOX=30,70,35,75`
  );
});
test('WMSSourceLoader#getFeatureInfoURL', async () => {});
test('WMSSourceLoader#getFeatureInfoURL maps WMS 1.3 coordinates and vendor parameters', () => {
  const source = WMSSourceLoader.createDataSource(WMS_SERVICE_URL, {
    wms: {vendorParameters: {token: 'base'}},
    wmsParameters: {layers: ['roads'], query_layers: ['roads'], crs: 'EPSG:4326'}
  });
  const url = new URL(
    source.getFeatureInfoURL(
      {
        x: 12,
        y: 34,
        width: 800,
        height: 600,
        bbox: [30, 70, 35, 75]
      },
      {token: 'request', empty: 0}
    )
  );
  expect(url.searchParams.get('I')).toBe('12');
  expect(url.searchParams.get('J')).toBe('34');
  expect(url.searchParams.get('BBOX')).toBe('70,30,75,35');
  expect(url.searchParams.get('TOKEN')).toBe('request');
  expect(url.searchParams.get('EMPTY')).toBe('');
});
test('WMSSourceLoader#describeLayerURL', async () => {
  const wmsImageSource = WMSSourceLoader.createDataSource(WMS_SERVICE_URL, {url: WMS_SERVICE_URL});
  const describeLayerUrl = wmsImageSource.describeLayerURL({});
  expect(describeLayerUrl, 'describeLayerURL').toBe(
    `https:/mock-wms-service?SERVICE=WMS&VERSION=${WMS_VERSION}&REQUEST=DescribeLayer`
  );
});
test('WMSSourceLoader#getLegendGraphicURL', async () => {
  const wmsImageSource = WMSSourceLoader.createDataSource(WMS_SERVICE_URL, {url: WMS_SERVICE_URL});
  const getLegendGraphicUrl = wmsImageSource.getLegendGraphicURL({});
  expect(getLegendGraphicUrl, 'getLegendGraphicURL').toBe(
    `https:/mock-wms-service?SERVICE=WMS&VERSION=${WMS_VERSION}&REQUEST=GetLegendGraphic`
  );
});
test('WMSSourceLoader#WMS versions', async () => {
  const wms111Service = WMSSourceLoader.createDataSource(WMS_SERVICE_URL, {
    wmsParameters: {version: '1.1.1', layers: ['oms']}
  });
  let getMapUrl = wms111Service.getMapURL({
    width: 800,
    height: 600,
    bbox: [30, 70, 35, 75]
  });
  expect(getMapUrl, 'getMapURL replaces CRS with SRS in WMS 1.1.1').toBe(
    'https:/mock-wms-service?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&FORMAT=image/png&LAYERS=oms&STYLES=&SRS=EPSG:4326&WIDTH=800&HEIGHT=600&BBOX=30,70,35,75'
  );
  const wms130Service = WMSSourceLoader.createDataSource(WMS_SERVICE_URL, {
    wms: {
      substituteCRS84: true
    },
    wmsParameters: {version: '1.3.0', layers: ['oms']}
  });
  getMapUrl = wms130Service.getMapURL({
    width: 800,
    height: 600,
    bbox: [30, 70, 35, 75]
  });
  expect(getMapUrl, 'getMapURL replaces ESPG:4326 with CRS:84 in WMS 1.3.0').toBe(
    'https:/mock-wms-service?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&FORMAT=image/png&LAYERS=oms&STYLES=&CRS=CRS:84&WIDTH=800&HEIGHT=600&BBOX=30,70,35,75'
  );
});
// TODO - move to image-source.spec.ts
test('WMSSourceLoader#fetch override', async () => {
  const wmsImageSource = WMSSourceLoader.createDataSource(WMS_SERVICE_URL, {
    core: {
      fetch: {headers: {Authorization: 'Bearer abc'}}
    },
    wms: {
      substituteCRS84: true
    }
  });
  const generatedUrl = wmsImageSource.getFeatureInfoURL({
    x: 1,
    y: 1,
    width: 800,
    height: 600,
    bbox: [30, 70, 35, 75],
    layers: ['oms'],
    // eslint-disable-next-line camelcase
    query_layers: ['oms']
  });
  mockResults[generatedUrl] = 'mock data';
  await withFetchMock(async () => {
    await wmsImageSource.getFeatureInfo({
      x: 1,
      y: 1,
      width: 800,
      height: 600,
      bbox: [30, 70, 35, 75],
      layers: ['oms'],
      // eslint-disable-next-line camelcase
      query_layers: ['oms']
    });
    const headers = requestInits[generatedUrl]?.headers;
    expect(
      Object.fromEntries(new Headers(headers).entries()),
      'authorization header provided in constructor passed to fetch'
    ).toEqual({authorization: 'Bearer abc'});
  });
});
test('WMSSourceLoader#getImage', async () => {
  const wmsImageSource = WMSSourceLoader.createDataSource(WMS_SERVICE_URL, {url: WMS_SERVICE_URL});
  let getMapParameters;
  // @ts-ignore
  wmsImageSource.getMap = parameters => {
    getMapParameters = parameters;
  };
  await wmsImageSource.getImage({
    width: 800,
    height: 600,
    boundingBox: [
      [30, 70],
      [35, 75]
    ],
    layers: ['oms']
  });
  expect(getMapParameters, 'boundingBox transformed to bbox').toEqual({
    width: 800,
    height: 600,
    bbox: [30, 70, 35, 75],
    layers: ['oms']
  });
});

test('WMSSourceLoader parses base URLs and normalizes metadata', async () => {
  const source = WMSSourceLoader.createDataSource(WMS_SERVICE_URL, {});
  expect(source._parseWMSUrl('https://example.com/wms?SERVICE=WMS&request=GetMap')).toEqual({
    url: 'https://example.com/wms',
    parameters: {SERVICE: 'WMS', request: 'GetMap'}
  });
  expect(source.normalizeMetadata({title: 'service'} as any)).toEqual({title: 'service'});
  source.getCapabilities = async () => ({title: 'service'}) as any;
  await expect(source.getMetadata()).resolves.toEqual({title: 'service'});
});

test('WMSSourceLoader forwards text responses and abort signals', async () => {
  const source = WMSSourceLoader.createDataSource(WMS_SERVICE_URL, {
    wmsParameters: {layers: ['roads'], query_layers: ['roads']}
  });
  let requestInit: RequestInit | undefined;
  source.fetch = async (_url, init) => {
    requestInit = init;
    return new Response('feature text', {headers: {'content-type': 'text/plain'}});
  };
  await expect(
    source.getFeatureInfoText({
      x: 1,
      y: 2,
      width: 10,
      height: 20,
      bbox: [0, 0, 1, 1],
      layers: ['roads'],
      query_layers: ['roads']
    })
  ).resolves.toBe('feature text');

  const controller = new AbortController();
  source.coreApi.parse = async () => ({width: 1, height: 1}) as any;
  await source.getMap(
    {width: 1, height: 1, bbox: [0, 0, 1, 1], layers: ['roads']},
    undefined,
    controller.signal
  );
  expect(requestInit?.signal).toBe(controller.signal);
});

test('WMSSourceLoader validates bounding boxes and parses service errors', async () => {
  const source = WMSSourceLoader.createDataSource(WMS_SERVICE_URL, {}) as any;
  expect(source._flipBoundingBox('invalid', source.wmsParameters)).toBeNull();
  expect(source._flipBoundingBox([1, 2, 3], source.wmsParameters)).toBeNull();
  expect(
    source._flipBoundingBox([1, 2, 3, 4], {...source.wmsParameters, version: '1.1.1'})
  ).toEqual([1, 2, 3, 4]);

  const errorXML = new TextEncoder().encode(
    '<ServiceExceptionReport><ServiceException code="InvalidRequest">bad request</ServiceException></ServiceExceptionReport>'
  );
  const errorResponse = new Response(errorXML, {
    status: 400,
    headers: {'content-type': 'application/vnd.ogc.se_xml'}
  });
  expect(() => source._checkResponse(errorResponse, errorXML.buffer)).toThrow();
  expect(source._parseError(errorXML.buffer)).toBeInstanceOf(Error);

  source.fetch = async () => errorResponse;
  await expect(source._fetchArrayBuffer('https://example.com/error')).rejects.toThrow();
});

test('WMSSourceLoader reports image parse failures as WMS errors', async () => {
  const source = WMSSourceLoader.createDataSource(WMS_SERVICE_URL, {
    wmsParameters: {layers: ['roads']}
  });
  const errorXML = new TextEncoder().encode(
    '<ServiceExceptionReport><ServiceException>not an image</ServiceException></ServiceExceptionReport>'
  );
  source.fetch = async () =>
    new Response(errorXML, {status: 200, headers: {'content-type': 'application/octet-stream'}});
  source.coreApi.parse = async () => {
    throw new Error('image decode failed');
  };
  await expect(source.getLegendGraphic({}, {layer: 'roads'})).rejects.toThrow();
});

test.each([
  ['1.1.1', 'EPSG:4326', '170,-10,180,10'],
  ['1.3.0', 'EPSG:4326', '-10,170,10,180'],
  ['1.1.1', 'CRS:84', '170,-10,180,10'],
  ['1.3.0', 'CRS:84', '170,-10,180,10']
])('WMS %s %s preserves independent dateline regions and service axis order', (version, crs, expectedBounds) => {
  const source = WMSSourceLoader.createDataSource(WMS_SERVICE_URL, {
    wms: {wmsParameters: {version}}
  });
  const east = source.getMapURL({
    layers: ['imagery'],
    crs,
    bbox: [170, -10, 180, 10],
    width: 64,
    height: 64
  });
  const west = source.getMapURL({
    layers: ['imagery'],
    crs,
    bbox: [-180, -10, -170, 10],
    width: 64,
    height: 64
  });
  expect(new URL(east).searchParams.get('BBOX')).toBe(expectedBounds);
  expect(east).not.toBe(west);
});

test('WMS rejects excessive images before fetch and discards canceled image decode', async () => {
  const source = WMSSourceLoader.createDataSource(WMS_SERVICE_URL, {wms: {maxPixels: 4}});
  let transfers = 0;
  source.fetch = async () => {
    transfers++;
    return new Response(new Uint8Array([1]));
  };
  const parameters = {bbox: [0, 0, 1, 1] as [number, number, number, number], width: 3, height: 2};
  await expect(source.getMap(parameters)).rejects.toThrow('budget');
  await expect(
    source.getMap({...parameters, bbox: [170, 0, -170, 1], width: 1, height: 1})
  ).rejects.toThrow('non-wrapped');
  expect(transfers).toBe(0);
  const controller = new AbortController();
  const reason = new DOMException('projection replaced', 'AbortError');
  let closedImages = 0;
  source.coreApi.parse = async () => {
    controller.abort(reason);
    return {
      width: 1,
      height: 1,
      close: () => {
        closedImages++;
      }
    } as never;
  };
  await expect(
    source.getMap({...parameters, width: 1, height: 1}, undefined, controller.signal)
  ).rejects.toBe(reason);
  expect(transfers).toBe(1);
  expect(closedImages).toBe(1);
  source.coreApi.parse = async () =>
    ({
      width: 2,
      height: 1,
      close: () => {
        closedImages++;
      }
    }) as never;
  await expect(source.getMap({...parameters, width: 1, height: 1})).rejects.toThrow('dimensions');
  expect(closedImages).toBe(2);
});
