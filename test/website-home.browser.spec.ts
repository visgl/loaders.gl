// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {COORDINATE_SYSTEM, I3SLoader} from '@loaders.gl/i3s';
import {VERSION} from '../website/src/shims/loadersgl-worker-version';
import corePackage from '../modules/core/package.json';
import {I3SMeshExtension} from '../examples/website/i3s-slpk/src/i3s-mesh-extension';
import {createHomeDemoLayer} from '../website/src/examples/home-demo-layer';

test('website worker version uses the published core package version', () => {
  expect(VERSION).toBe(corePackage.version);
  expect(VERSION).toMatch(/^\d+\.\d+\.\d+/);
});

test('home demo preserves texture decoder hints and uses the shared I3S material fix', () => {
  const properties = createHomeDemoLayer().props;
  expect(properties.loaders).toEqual([I3SLoader]);
  expect(properties.loadOptions.worker).not.toBe(false);
  const workerUrl = new URL(properties.loadOptions['i3s-content'].workerUrl);
  expect(workerUrl.origin).toBe(window.location.origin);
  expect(workerUrl.pathname).toContain('i3s-content-worker.js');
  expect(properties.loadOptions.i3s.coordinateSystem).toBe(COORDINATE_SYSTEM.LNGLAT_OFFSETS);
  const extensions = properties._subLayerProps['tile-3d']._subLayerProps.mesh.extensions;
  expect(extensions).toHaveLength(1);
  expect(extensions[0]).toBeInstanceOf(I3SMeshExtension);
  expect(extensions[0].getShaders().inject['fs:#main-start']).toContain(
    'pbr_filterColor(vec4(1.0))'
  );
  const nextProperties = createHomeDemoLayer().props;
  expect(nextProperties._subLayerProps['tile-3d']._subLayerProps.mesh.extensions[0]).toBe(
    extensions[0]
  );
});
