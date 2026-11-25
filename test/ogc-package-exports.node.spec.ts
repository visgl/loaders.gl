// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {existsSync, readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {expect, test} from 'vitest';

const requirePackage = createRequire(import.meta.url);
const packageDirectory = fileURLToPath(new URL('../modules/ogc/', import.meta.url));

test('OGC public exports resolve to emitted files', () => {
  const manifest = JSON.parse(readFileSync(`${packageDirectory}/package.json`, 'utf8'));
  for (const [name, conditions] of Object.entries(manifest.exports)) {
    for (const target of Object.values(conditions as Record<string, string>)) {
      expect(existsSync(`${packageDirectory}/${target}`), `${name}: ${target}`).toBe(true);
    }
  }
});

test('OGC exposes lightweight metadata through CommonJS format subpaths', () => {
  const root = requirePackage('@loaders.gl/ogc');
  const wms = requirePackage('@loaders.gl/ogc/wms');
  const stac = requirePackage('@loaders.gl/ogc/stac');

  expect(Object.keys(root)).toEqual([]);
  expect(wms.WMSCapabilitiesLoader).not.toHaveProperty('parse');
  expect(wms.WMSCapabilitiesLoader.preload).toBeTypeOf('function');
  expect(stac.STACLoader.preload).toBeTypeOf('function');
  expect(requirePackage('@loaders.gl/ogc/gml/bundled').GMLLoaderWithParser).toBeDefined();
  expect(requirePackage('@loaders.gl/ogc/stac-loader').STACLoaderWithParser).toBeDefined();
});
