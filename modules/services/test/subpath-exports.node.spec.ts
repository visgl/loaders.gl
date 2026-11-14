// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {createRequire} from 'node:module';
import {expect, test} from 'vitest';

const requirePackage = createRequire(import.meta.url);

const COMMONJS_EXPORTS = [
  ['@loaders.gl/ogc/wms', 'WMSLoader'],
  ['@loaders.gl/ogc/wms/unbundled', 'WMSCapabilitiesLoader'],
  ['@loaders.gl/ogc/wms/bundled', 'WMSCapabilitiesLoader'],
  ['@loaders.gl/ogc/gml-loader', 'GMLLoaderWithParser'],
  ['@loaders.gl/ogc/wmts-capabilities-loader-with-parser', 'WMTSCapabilitiesLoaderWithParser'],
  ['@loaders.gl/ogc/stac', 'STACLoader'],
  ['@loaders.gl/ogc/stac-loader', 'STACLoaderWithParser']
] as const;

test.each(COMMONJS_EXPORTS)('%s supports CommonJS require', (subpath, exportedName) => {
  expect(requirePackage(subpath)).toHaveProperty(exportedName);
});
