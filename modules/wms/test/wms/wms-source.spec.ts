// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {withFetchMock, mockResults, requestInits} from '../test-utils/fetch-spy';

import {WMSSource} from '@loaders.gl/wms';

const WMS_SERVICE_URL = 'https:/mock-wms-service';
const WMS_VERSION = '1.3.0';

test('WMSSource#constructor', async () => {
  const wmsImageSource = WMSSource.createDataSource(WMS_SERVICE_URL, {});
  const getCapabilitiesUrl = wmsImageSource.getCapabilitiesURL();

  expect(
    getCapabilitiesUrl,
    'getCapabilitiesURL'
  ).toBe(`https:/mock-wms-service?SERVICE=WMS&VERSION=${WMS_VERSION}&REQUEST=GetCapabilities`);
});

test('WMSSource#getMapURL', async () => {
  let wmsImageSource = WMSSource.createDataSource(WMS_SERVICE_URL, {});
  let getMapUrl = wmsImageSource.getMapURL({
    width: 800,
    height: 600,
    bbox: [30, 70, 35, 75],
    layers: ['oms'],
    crs: 'EPSG:3857'
  });
  expect(
    getMapUrl,
    'getMapURL layers in params'
  ).toBe(
    `https:/mock-wms-service?SERVICE=WMS&VERSION=${WMS_VERSION}&REQUEST=GetMap&FORMAT=image/png&LAYERS=oms&STYLES=&CRS=EPSG:3857&WIDTH=800&HEIGHT=600&BBOX=30,70,35,75`
  );

  wmsImageSource = WMSSource.createDataSource(WMS_SERVICE_URL, {
    wmsParameters: {layers: ['oms'], crs: 'EPSG:3857'}
  });
  getMapUrl = wmsImageSource.getMapURL({
    width: 800,
    height: 600,
    bbox: [30, 70, 35, 75]
  });
  expect(
    getMapUrl,
    'getMapURL layers in constructor'
  ).toBe(
    `https:/mock-wms-service?SERVICE=WMS&VERSION=${WMS_VERSION}&REQUEST=GetMap&FORMAT=image/png&LAYERS=oms&STYLES=&CRS=EPSG:3857&WIDTH=800&HEIGHT=600&BBOX=30,70,35,75`
  );
});

test('WMSSource#getFeatureInfoURL', async () => {
  // const wmsImageSource = WMSSource.createDataSource({url: WMS_SERVICE_URL});
  // const getFeatureInfoUrl = wmsImageSource.getFeatureInfoURL({x: 400, y: 300});
  // expect(getFeatureInfoUrl, 'getFeatureInfoURL').toBe('https:/mock-wms-service?REQUEST=GetFeatureInfo');
});

test('WMSSource#describeLayerURL', async () => {
  const wmsImageSource = WMSSource.createDataSource(WMS_SERVICE_URL, {url: WMS_SERVICE_URL});
  const describeLayerUrl = wmsImageSource.describeLayerURL({});
  expect(
    describeLayerUrl,
    'describeLayerURL'
  ).toBe(`https:/mock-wms-service?SERVICE=WMS&VERSION=${WMS_VERSION}&REQUEST=DescribeLayer`);
});

test('WMSSource#getLegendGraphicURL', async () => {
  const wmsImageSource = WMSSource.createDataSource(WMS_SERVICE_URL, {url: WMS_SERVICE_URL});
  const getLegendGraphicUrl = wmsImageSource.getLegendGraphicURL({});
  expect(
    getLegendGraphicUrl,
    'getLegendGraphicURL'
  ).toBe(`https:/mock-wms-service?SERVICE=WMS&VERSION=${WMS_VERSION}&REQUEST=GetLegendGraphic`);
});

test('WMSSource#WMS versions', async () => {
  const wms111Service = WMSSource.createDataSource(WMS_SERVICE_URL, {
    wmsParameters: {version: '1.1.1', layers: ['oms']}
  });
  let getMapUrl = wms111Service.getMapURL({
    width: 800,
    height: 600,
    bbox: [30, 70, 35, 75]
  });
  expect(
    getMapUrl,
    'getMapURL replaces CRS with SRS in WMS 1.1.1'
  ).toBe(
    'https:/mock-wms-service?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&FORMAT=image/png&LAYERS=oms&STYLES=&SRS=EPSG:4326&WIDTH=800&HEIGHT=600&BBOX=30,70,35,75'
  );
  const wms130Service = WMSSource.createDataSource(WMS_SERVICE_URL, {
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
  expect(
    getMapUrl,
    'getMapURL replaces ESPG:4326 with CRS:84 in WMS 1.3.0'
  ).toBe(
    'https:/mock-wms-service?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&FORMAT=image/png&LAYERS=oms&STYLES=&CRS=CRS:84&WIDTH=800&HEIGHT=600&BBOX=30,70,35,75'
  );
});

// TODO - move to image-source.spec.ts
test('WMSSource#fetch override', async () => {
  const loadOptions = {fetch: {headers: {Authorization: 'Bearer abc'}}};
  const wmsImageSource = WMSSource.createDataSource(WMS_SERVICE_URL, {
    core: {
      loadOptions
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
    const headers = new Headers(requestInits[generatedUrl]?.headers);
    expect(
      headers.get('Authorization'),
      'authorization header provided in constructor passed to fetch'
    ).toBe('Bearer abc');
  });
});

test('WMSSource#getImage', async () => {
  const wmsImageSource = WMSSource.createDataSource(WMS_SERVICE_URL, {url: WMS_SERVICE_URL});
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

  expect(
    getMapParameters,
    'boundingBox transformed to bbox'
  ).toEqual({
    width: 800,
    height: 600,
    bbox: [30, 70, 35, 75],
    layers: ['oms']
  });
});
