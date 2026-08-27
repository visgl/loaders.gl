// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

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
});
