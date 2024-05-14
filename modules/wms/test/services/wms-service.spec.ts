// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {withFetchMock, mockResults, requestInits} from '../test-utils/fetch-spy';

import {WMSSource} from '@loaders.gl/wms';

const WMS_SERVICE_URL = 'https:/mock-wms-service';
const WMS_VERSION = '1.3.0';

test('WMSSource#constructor', async (t) => {
  const wmsImageSource = WMSSource.createDataSource(WMS_SERVICE_URL, {});
  const getCapabilitiesUrl = wmsImageSource.getCapabilitiesURL();

  t.equal(
    getCapabilitiesUrl,
    `https:/mock-wms-service?SERVICE=WMS&VERSION=${WMS_VERSION}&REQUEST=GetCapabilities`,
    'getCapabilitiesURL'
  );
  t.end();
});

test('WMSSource#getMapURL', async (t) => {
  let wmsImageSource = WMSSource.createDataSource(WMS_SERVICE_URL, {});
  let getMapUrl = wmsImageSource.getMapURL({
    width: 800,
    height: 600,
    bbox: [30, 70, 35, 75],
    layers: ['oms'],
    crs: 'EPSG:3857'
  });
  t.equal(
    getMapUrl,
    `https:/mock-wms-service?SERVICE=WMS&VERSION=${WMS_VERSION}&REQUEST=GetMap&FORMAT=image/png&LAYERS=oms&STYLES=&CRS=EPSG:3857&WIDTH=800&HEIGHT=600&BBOX=30,70,35,75`,
    'getMapURL layers in params'
  );

  wmsImageSource = WMSSource.createDataSource(WMS_SERVICE_URL, {
    url: WMS_SERVICE_URL,
    wmsParameters: {layers: ['oms'], crs: 'EPSG:3857'}
  });
  getMapUrl = wmsImageSource.getMapURL({
    width: 800,
    height: 600,
    bbox: [30, 70, 35, 75]
  });
  t.equal(
    getMapUrl,
    `https:/mock-wms-service?SERVICE=WMS&VERSION=${WMS_VERSION}&REQUEST=GetMap&FORMAT=image/png&LAYERS=oms&STYLES=&CRS=EPSG:3857&WIDTH=800&HEIGHT=600&BBOX=30,70,35,75`,
    'getMapURL layers in constructor'
  );
  t.end();
});

test('WMSSource#getFeatureInfoURL', async (t) => {
  // const wmsImageSource = WMSSource.createDataSource({url: WMS_SERVICE_URL});
  // const getFeatureInfoUrl = wmsImageSource.getFeatureInfoURL({x: 400, y: 300});
  // t.equal(getFeatureInfoUrl, 'https:/mock-wms-service?REQUEST=GetFeatureInfo', 'getFeatureInfoURL');
  t.end();
});

test('WMSSource#describeLayerURL', async (t) => {
  const wmsImageSource = WMSSource.createDataSource(WMS_SERVICE_URL, {url: WMS_SERVICE_URL});
  const describeLayerUrl = wmsImageSource.describeLayerURL({});
  t.equal(
    describeLayerUrl,
    `https:/mock-wms-service?SERVICE=WMS&VERSION=${WMS_VERSION}&REQUEST=DescribeLayer`,
    'describeLayerURL'
  );
  t.end();
});

test('WMSSource#getLegendGraphicURL', async (t) => {
  const wmsImageSource = WMSSource.createDataSource(WMS_SERVICE_URL, {url: WMS_SERVICE_URL});
  const getLegendGraphicUrl = wmsImageSource.getLegendGraphicURL({});
  t.equal(
    getLegendGraphicUrl,
    `https:/mock-wms-service?SERVICE=WMS&VERSION=${WMS_VERSION}&REQUEST=GetLegendGraphic`,
    'getLegendGraphicURL'
  );

  t.end();
});

test('WMSSource#WMS versions', async (t) => {
  const wms111Service = WMSSource.createDataSource(WMS_SERVICE_URL, {
    url: WMS_SERVICE_URL,
    wmsParameters: {version: '1.1.1', layers: ['oms']}
  });
  let getMapUrl = wms111Service.getMapURL({
    width: 800,
    height: 600,
    bbox: [30, 70, 35, 75]
  });
  t.equal(
    getMapUrl,
    'https:/mock-wms-service?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&FORMAT=image/png&LAYERS=oms&STYLES=&SRS=EPSG:4326&WIDTH=800&HEIGHT=600&BBOX=30,70,35,75',
    'getMapURL replaces CRS with SRS in WMS 1.1.1'
  );
  const wms130Service = WMSSource.createDataSource(WMS_SERVICE_URL, {
    url: WMS_SERVICE_URL,
    substituteCRS84: true,
    wmsParameters: {version: '1.3.0', layers: ['oms']}
  });
  getMapUrl = wms130Service.getMapURL({
    width: 800,
    height: 600,
    bbox: [30, 70, 35, 75]
  });
  t.equal(
    getMapUrl,
    'https:/mock-wms-service?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&FORMAT=image/png&LAYERS=oms&STYLES=&CRS=CRS:84&WIDTH=800&HEIGHT=600&BBOX=30,70,35,75',
    'getMapURL replaces ESPG:4326 with CRS:84 in WMS 1.3.0'
  );
  t.end();
});

// TODO - move to image-source.spec.ts
test('WMSSource#fetch override', async (t) => {
  const loadOptions = {fetch: {headers: {Authorization: 'Bearer abc'}}};
  const wmsImageSource = WMSSource.createDataSource(WMS_SERVICE_URL, {
    url: WMS_SERVICE_URL,
    loadOptions,
    substituteCRS84: true
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
    t.deepEqual(
      requestInits[generatedUrl]?.headers,
      {Authorization: 'Bearer abc'},
      'authorization header provided in constructor passed to fetch'
    );
    t.end();
  });
});

test('WMSSource#getImage', async (t) => {
  const wmsImageSource = WMSSource.createDataSource(WMS_SERVICE_URL, {url: WMS_SERVICE_URL});
  let getMapParameters;

  // @ts-ignore
  wmsImageSource.getMap = (parameters) => {
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

  t.deepEqual(
    getMapParameters,
    {
      width: 800,
      height: 600,
      bbox: [30, 70, 35, 75],
      layers: ['oms']
    },
    'boundingBox transformed to bbox'
  );
  t.end();
});
