// loaders.gl, MIT license

import test from 'tape-promise/tape';
import {withFetchMock, mockResults, requestInits} from '../test-utils/fetch-spy';

import {WMSService} from '@loaders.gl/wms';

const WMS_SERVICE_URL = 'https:/mock-wms-service';

test('WMSService#', async (t) => {
  const wmsService = new WMSService({url: WMS_SERVICE_URL});
  const getCapabilitiesUrl = wmsService.getCapabilitiesURL();

  t.equal(
    getCapabilitiesUrl,
    'https:/mock-wms-service?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetCapabilities',
    'getCapabilitiesURL'
  );
  t.end();
});

test('WMSService#getMapURL', async (t) => {
  const wmsService = new WMSService({url: WMS_SERVICE_URL});
  const getMapUrl = wmsService.getMapURL({
    width: 800,
    height: 600,
    bbox: [30, 70, 35, 75],
    layers: ['oms']
  });
  t.equal(
    getMapUrl,
    'https:/mock-wms-service?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&STYLES=&SRS=EPSG:4326&FORMAT=image/png&WIDTH=800&HEIGHT=600&BBOX=30,70,35,75&LAYERS=oms',
    'getMapURL'
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
    'https:/mock-wms-service?SERVICE=WMS&VERSION=1.1.1&REQUEST=DescribeLayer',
    'describeLayerURL'
  );
  t.end();
});

test('WMSService#getLegendGraphicURL', async (t) => {
  const wmsService = new WMSService({url: WMS_SERVICE_URL});
  const getLegendGraphicUrl = wmsService.getLegendGraphicURL({});
  t.equal(
    getLegendGraphicUrl,
    'https:/mock-wms-service?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetLegendGraphic',
    'getLegendGraphicURL'
  );

  t.end();
});

test('WMSService#parameters', async (t) => {
  const wmsService = new WMSService({url: WMS_SERVICE_URL, wmsParameters: {version: '1.3.0'}});
  const getMapUrl = wmsService.getMapURL({
    width: 800,
    height: 600,
    bbox: [30, 70, 35, 75],
    layers: ['oms']
  });
  t.equal(
    getMapUrl,
    'https:/mock-wms-service?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&STYLES=&CRS=EPSG:4326&FORMAT=image/png&WIDTH=800&HEIGHT=600&BBOX=30,70,35,75&LAYERS=oms',
    'getMapURL'
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
