// loaders.gl, MIT license

import test from 'tape-promise/tape';
// import {validateLoader} from 'test/common/conformance';

import {CSWCapabilitiesLoader, CSWCapabilities} from '@loaders.gl/wms';
import {load} from '@loaders.gl/core';

const CSW_CAPABILITIES_URL = '@loaders.gl/wms/test/data/csw/get-capabilities.xml';

test('CSWCapabilitiesLoader#forecasts.xml', async (t) => {
  const capabilities = (await load(CSW_CAPABILITIES_URL, CSWCapabilitiesLoader));
  // t.comment(JSON.stringify(capabilities));

  t.equal(typeof capabilities, 'object', 'parsed');
  // t.equal(capabilities.layer.layers[2]?.name, 'world_rivers', 'contents');

  t.end();
});
