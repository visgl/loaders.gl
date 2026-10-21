// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {createRequire} from 'node:module';
import {expect, test} from 'vitest';

const requirePackage = createRequire(import.meta.url);

const COMMONJS_EXPORTS = [
  ['@loaders.gl/services/wms', 'WMSSourceLoader'],
  ['@loaders.gl/services/wms/unbundled', 'WMSCapabilitiesLoader'],
  ['@loaders.gl/services/wms/bundled', 'WMSCapabilitiesLoader'],
  ['@loaders.gl/services/wms/gml-loader', 'GMLLoaderWithParser'],
  [
    '@loaders.gl/services/wms/wmts-capabilities-loader-with-parser',
    'WMTSCapabilitiesLoaderWithParser'
  ],
  ['@loaders.gl/services/stac', 'STACSourceLoader'],
  ['@loaders.gl/services/stac/stac-source', 'STACSourceLoaderWithParser']
] as const;

test.each(COMMONJS_EXPORTS)('%s supports CommonJS require', (subpath, exportedName) => {
  expect(requirePackage(subpath)).toHaveProperty(exportedName);
});
