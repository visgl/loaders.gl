/* eslint-disable max-len */
import test from 'tape-promise/tape';
// import {validateLoader, validateMeshCategoryData} from 'test/common/conformance';
import {validateLoader} from 'test/common/conformance';

import {QuantizedMeshLoader, QuantizedMeshWorkerLoader} from '@loaders.gl/quantized-mesh';
// import {setLoaderOptions, load} from '@loaders.gl/core';
import {setLoaderOptions} from '@loaders.gl/core';

// const TILE_WITH_EXTENSIONS_URL = '@loaders.gl/quantized-mesh/test/data/tile-with-extensions.terrain';

setLoaderOptions({
  quantizedMesh: {
    workerUrl: 'modules/quantized-mesh/dist/quantized-mesh-loader.worker.js'
  }
});

test('QuantizedMeshLoader#loader objects', async t => {
  validateLoader(t, QuantizedMeshLoader, 'QuantizedMeshLoader');
  validateLoader(t, QuantizedMeshWorkerLoader, 'QuantizedMeshWorkerLoader');
  t.end();
});

