// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import * as lasModule from '@loaders.gl/pointclouds/las';
import {LASCOPCLoader} from '../../../../website/src/alternate-loaders/las/las-copc-loader-types';
import {LAZPerfLoader} from '../../../../website/src/alternate-loaders/las/lazperf-loader-types';
import {LAZRsLoader} from '../../../../website/src/alternate-loaders/las/laz-rs-loader-types';
import {LASCOPCLoaderWithParser} from '../../../../website/src/alternate-loaders/las/las-copc-loader';
import {LAZPerfLoaderWithParser} from '../../../../website/src/alternate-loaders/las/lazperf-loader';
import {LAZRsLoaderWithParser} from '../../../../website/src/alternate-loaders/las/laz-rs-loader';

test('LAS root exposes the primary metadata loader and compatibility alias', () => {
  expect(lasModule.LASLoader.id).toBe('las');
  expect(lasModule.LASLoader).not.toHaveProperty('parse');
  expect(lasModule.LASLoader.preload).toBeTypeOf('function');
});

test.each([
  ['LASCOPCLoader', LASCOPCLoaderWithParser],
  ['LAZPerfLoader', LAZPerfLoaderWithParser],
  ['LAZRsLoader', LAZRsLoaderWithParser]
] as const)('%s is available only in website comparison support', (loaderName, loader) => {
  expect(lasModule).not.toHaveProperty(loaderName);
  expect(lasModule).not.toHaveProperty(loaderName + 'WithParser');
  expect(loader.parse).toBeTypeOf('function');
  expect(loader.id).toBe(lasModule.LASLoader.id);
});

test.each([
  ['LASCOPCLoader', LASCOPCLoader, LASCOPCLoaderWithParser],
  ['LAZPerfLoader', LAZPerfLoader, LAZPerfLoaderWithParser],
  ['LAZRsLoader', LAZRsLoader, LAZRsLoaderWithParser]
] as const)('%s metadata loader preloads its parser implementation', async (_name, loader, parser) => {
  expect(loader).not.toHaveProperty('parse');
  expect(loader.preload).toBeTypeOf('function');
  await expect(loader.preload?.()).resolves.toBe(parser);
});
