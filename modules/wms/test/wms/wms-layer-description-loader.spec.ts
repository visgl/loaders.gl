// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// Forked from https://github.com/chrelad/openlayers/blob/master/tests/Format/WMSDescribeLayer.html
// under OpenLayers license (only used for test cases)
// See README.md in `./data` directory for full license text copy.

import {expect, test} from 'vitest';
import {
  _WMSLayerDescriptionLoader as WMSLayerDescriptionLoader
  // _WMSLayerDescription as WMSLayerDescription
} from '@loaders.gl/wms';
import {parse} from '@loaders.gl/core';

test.skip('WMSLayerDescriptionLoader#read_WMSDescribeLayer', async () => {
  const text =
    '<WMS_DescribeLayerResponse version="1.1.1">' +
    '  <LayerDescription name="topp:states" wfs="http://geo.openplans.org:80/geoserver/wfs/WfsDispatcher?">' +
    '    <Query typeName="topp:states"/>' +
    '  </LayerDescription>' +
    '</WMS_DescribeLayerResponse>';

  const description = await parse(text, WMSLayerDescriptionLoader);
  expect(description).toBeTruthy();

  // const res = description.layers;

  // expect(res.length, 'Only one LayerDescription in data, so only one parsed').toBe(1);
  // expect(res[0].owsType, 'Properly parses owsType as WFS').toBe('WFS');

  // t.equal(
  //   res[0].owsURL,
  //   'http://geo.openplans.org:80/geoserver/wfs/WfsDispatcher?',
  //   'Properly parses owsURL'
  // );

  // expect(res[0].typeName, 'Properly parses typeName').toBe('topp:states');

  // expect(res[0].layerName, 'Properly parses name').toBe('topp:states');

  
});
