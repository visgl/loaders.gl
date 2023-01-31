// loaders.gl, MIT license

import test from 'tape-promise/tape';

import {WMSService} from '@loaders.gl/wms';

const WMS_SERVICE_URL = 'https:/mock-wms-service';

test('WMSService', async (t) => {
  const wmsService = new WMSService({url: WMS_SERVICE_URL});

  const getCapabilitiesUrl = wmsService.getCapabilitiesURL();
  t.equal(
    getCapabilitiesUrl,
    'https:/mock-wms-service?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetCapabilities',
    'getCapabilitiesURL'
  );

  const getMapUrl = wmsService.getMapURL({
    width: 800,
    height: 600,
    bbox: [30, 70, 35, 75],
    layers: ['oms']
  });
  t.equal(
    getMapUrl,
    'https:/mock-wms-service?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&LAYERS=oms&STYLES=&BBOX=30,70,35,75&WIDTH=800&HEIGHT=600&SRS=EPSG:4326&FORMAT=image/png',
    'getMapURL'
  );

  // const getFeatureInfoUrl = wmsService.getFeatureInfoURL({x: 400, y: 300});
  // t.equal(getFeatureInfoUrl, 'https:/mock-wms-service?REQUEST=GetFeatureInfo', 'getFeatureInfoURL');

  const describeLayerUrl = wmsService.describeLayerURL({});
  t.equal(
    describeLayerUrl,
    'https:/mock-wms-service?SERVICE=WMS&VERSION=1.1.1&REQUEST=DescribeLayer',
    'describeLayerURL'
  );

  const getLegendGraphicUrl = wmsService.getLegendGraphicURL({});
  t.equal(
    getLegendGraphicUrl,
    'https:/mock-wms-service?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetLegendGraphic',
    'getLegendGraphicURL'
  );

  t.end();
});
