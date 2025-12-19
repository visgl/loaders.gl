// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
// import {validateLoader} from 'test/common/conformance';

import {_ArcGISImageServerSource as ArcGISImageServerSource} from '@loaders.gl/wms';

test('ArcGISImageService#test cases', async (t) => {
  t.ok(ArcGISImageServerSource);
  t.end();
});
