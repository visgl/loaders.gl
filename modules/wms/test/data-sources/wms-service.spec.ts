// loaders.gl, MIT license

import test from 'tape-promise/tape';

import {WMSService} from '@loaders.gl/wms';

const WMS_SERVICE_URL = 'https:/mock-wms-service';

test('WMSService', async (t) => {
  const wmsService = new WMSService({url: WMS_SERVICE_URL});

  const getCapabilitiesUrl = wmsService.getCapabilitiesURL();
  t.equal(
    getCapabilitiesUrl,
    'https:/mock-wms-service?REQUEST=GetCapabilities',
    'getCapabilitiesURL'
  );

  // const getMapUrl = wmsService.getMapURL({width: 800, height: 600, boundingBox: [30, 70, 35, 75]});
  // t.equal(getMapUrl, 'https:/mock-wms-service?REQUEST=GetMap', 'getMapURL');

  // const getFeatureInfoUrl = wmsService.getFeatureInfoURL({x: 400, y: 300});
  // t.equal(getFeatureInfoUrl, 'https:/mock-wms-service?REQUEST=GetFeatureInfo', 'getFeatureInfoURL');

  const describeLayerUrl = wmsService.describeLayerURL({});
  t.equal(describeLayerUrl, 'https:/mock-wms-service?REQUEST=DescribeLayer', 'describeLayerURL');

  const getLegendGraphicUrl = wmsService.getLegendGraphicURL({});
  t.equal(
    getLegendGraphicUrl,
    'https:/mock-wms-service?REQUEST=GetLegendGraphic',
    'getLegendGraphicURL'
  );

  t.end();
});
