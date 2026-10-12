// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import * as las from '@loaders.gl/las';
import {LASCOPCLoaderWithParser} from '@loaders.gl/las/las-copc-loader';
import {LAZPerfLoaderWithParser} from '@loaders.gl/las/lazperf-loader';
import {LAZRsLoaderWithParser} from '@loaders.gl/las/laz-rs-loader';

test('LAS root exposes the primary metadata loader and compatibility alias', () => {
  expect(las.LASLoader.id).toBe('las');
  expect(las.LASWorkerLoader).toBe(las.LASLoader);
  expect(las.LASLoader).not.toHaveProperty('parse');
  expect(las.LASLoader.preload).toBeTypeOf('function');
});

test.each([
  ['LASCOPCLoader', LASCOPCLoaderWithParser],
  ['LAZPerfLoader', LAZPerfLoaderWithParser],
  ['LAZRsLoader', LAZRsLoaderWithParser]
] as const)('%s is available through its parser subpath only', (loaderName, loader) => {
  expect(las).not.toHaveProperty(loaderName);
  expect(las).not.toHaveProperty(loaderName + 'WithParser');
  expect(loader.parse).toBeTypeOf('function');
  expect(loader.id).toBe(las.LASLoader.id);
});
