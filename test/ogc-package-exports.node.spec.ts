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

test('OGC root exposes lightweight metadata and CommonJS format subpaths', () => {
  const root = requirePackage('@loaders.gl/ogc');
  const wms = requirePackage('@loaders.gl/ogc/wms');
  const stac = requirePackage('@loaders.gl/ogc/stac');

  expect(root.WMSCapabilitiesLoader.id).toBe(wms.WMSCapabilitiesLoader.id);
  expect(root.STACSourceLoader.id).toBe(stac.STACSourceLoader.id);
  expect(root.WMSCapabilitiesLoader).not.toHaveProperty('parse');
  expect(root.WMSCapabilitiesLoader.preload).toBeTypeOf('function');
  expect(root.STACSourceLoader.preload).toBeTypeOf('function');
  expect(root).not.toHaveProperty('WMSSourceLoader');
  expect(requirePackage('@loaders.gl/ogc/gml-loader').GMLLoaderWithParser).toBeDefined();
  expect(requirePackage('@loaders.gl/ogc/stac-source').STACSourceLoaderWithParser).toBeDefined();
});
