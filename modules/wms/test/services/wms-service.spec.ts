// loaders.gl, MIT license

import test from 'tape-promise/tape';
import {withFetchMock, mockResults, requestInits} from '../test-utils/fetch-spy';

import {WMSService} from '@loaders.gl/wms';

const WMS_SERVICE_URL = 'https:/mock-wms-service';
const WMS_VERSION = '1.3.0';

test('WMSService#', async (t) => {
  const wmsService = new WMSService({url: WMS_SERVICE_URL});
  const getCapabilitiesUrl = wmsService.getCapabilitiesURL();

  t.equal(
    getCapabilitiesUrl,
    `https:/mock-wms-service?SERVICE=WMS&VERSION=${WMS_VERSION}&REQUEST=GetCapabilities`,
    'getCapabilitiesURL'
  );
  t.end();
});

test('WMSService#getMapURL', async (t) => {
  let wmsService = new WMSService({url: WMS_SERVICE_URL});
  let getMapUrl = wmsService.getMapURL({
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

  wmsService = new WMSService({
    url: WMS_SERVICE_URL,
    wmsParameters: {layers: ['oms'], crs: 'EPSG:3857'}
  });
  getMapUrl = wmsService.getMapURL({
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

test('WMSService#getFeatureInfoURL', async (t) => {
  // const wmsService = new WMSService({url: WMS_SERVICE_URL});
  // const getFeatureInfoUrl = wmsService.getFeatureInfoURL({x: 400, y: 300});
  // t.equal(getFeatureInfoUrl, 'https:/mock-wms-service?REQUEST=GetFeatureInfo', 'getFeatureInfoURL');
  t.end();
});

test('WMSService#describeLayerURL', async (t) => {
  const wmsService = new WMSService({url: WMS_SERVICE_URL});
  const describeLayerUrl = wmsService.describeLayerURL({});
  t.equal(
    describeLayerUrl,
    `https:/mock-wms-service?SERVICE=WMS&VERSION=${WMS_VERSION}&REQUEST=DescribeLayer`,
    'describeLayerURL'
  );
  t.end();
});

test('WMSService#getLegendGraphicURL', async (t) => {
  const wmsService = new WMSService({url: WMS_SERVICE_URL});
  const getLegendGraphicUrl = wmsService.getLegendGraphicURL({});
  t.equal(
    getLegendGraphicUrl,
    `https:/mock-wms-service?SERVICE=WMS&VERSION=${WMS_VERSION}&REQUEST=GetLegendGraphic`,
    'getLegendGraphicURL'
  );

  t.end();
});

test('WMSService#WMS versions', async (t) => {
  const wms111Service = new WMSService({
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
  const wms130Service = new WMSService({
    url: WMS_SERVICE_URL,
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
test('WMSService#fetch override', async (t) => {
  const loadOptions = {fetch: {headers: {Authorization: 'Bearer abc'}}};
  const wmsService = new WMSService({url: WMS_SERVICE_URL, loadOptions});
  const generatedUrl = wmsService.getFeatureInfoURL({
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
    await wmsService.getFeatureInfo({
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
