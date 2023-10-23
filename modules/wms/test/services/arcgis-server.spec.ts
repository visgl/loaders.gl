// loaders.gl, MIT license

import test from 'tape-promise/tape';
// import {validateLoader} from 'test/common/conformance';

import {_ArcGISImageService as ArcGISImageService} from '@loaders.gl/wms';

test('ArcGISImageService#test cases', async (t) => {
  t.ok(ArcGISImageService);
  t.end();
});
