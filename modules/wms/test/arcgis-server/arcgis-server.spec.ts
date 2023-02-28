// loaders.gl, MIT license

import test from 'tape-promise/tape';
// import {validateLoader} from 'test/common/conformance';

import {_ArcGISImageServer as ArcGISImageServer} from '@loaders.gl/wms';

test('ArcGISImageService#test cases', async (t) => {
  t.ok(ArcGISImageServer);
  t.end();
});
