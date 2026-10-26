// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import * as lasModule from '@loaders.gl/pointclouds/las';
import {LASCOPCLoaderWithParser} from '@loaders.gl/pointclouds/las/las-copc-loader';
import {LAZPerfLoaderWithParser} from '@loaders.gl/pointclouds/las/lazperf-loader';
import {LAZRsLoaderWithParser} from '@loaders.gl/pointclouds/las/laz-rs-loader';

test('LAS root exposes the primary metadata loader and compatibility alias', () => {
  expect(lasModule.LASLoader.id).toBe('las');
  expect(lasModule.LASWorkerLoader).toBe(lasModule.LASLoader);
  expect(lasModule.LASLoader).not.toHaveProperty('parse');
  expect(lasModule.LASLoader.preload).toBeTypeOf('function');
});

test.each([
  ['LASCOPCLoader', LASCOPCLoaderWithParser],
  ['LAZPerfLoader', LAZPerfLoaderWithParser],
  ['LAZRsLoader', LAZRsLoaderWithParser]
] as const)('%s is available through its parser subpath only', (loaderName, loader) => {
  expect(lasModule).not.toHaveProperty(loaderName);
  expect(lasModule).not.toHaveProperty(loaderName + 'WithParser');
  expect(loader.parse).toBeTypeOf('function');
  expect(loader.id).toBe(lasModule.LASLoader.id);
});
