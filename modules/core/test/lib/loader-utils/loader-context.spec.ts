// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {coreApi, parse} from '@loaders.gl/core';
import {getLoaderContext} from '../../../src/lib/loader-utils/loader-context';

test('partial parent contexts receive the core API and nested parser', () => {
  const context = getLoaderContext({url: 'child', _parse: parse}, {}, {url: 'worker'} as any);
  expect(context.url).toBe('worker');
  expect(context.coreApi).toBe(coreApi);
  expect(context._parse).toBe(parse);
  expect(context.fetch).toBeTypeOf('function');
});

test('parent parser and core API bindings take priority over initialization defaults', () => {
  const providedCoreApi = {...coreApi};
  const parentCoreApi = {...coreApi};
  const parentParse = async () => 'parent';
  const defaults = {coreApi: providedCoreApi, _parse: parse};
  expect(getLoaderContext(defaults, {}, {} as any).coreApi).toBe(providedCoreApi);
  const context = getLoaderContext(defaults, {}, {
    coreApi: parentCoreApi,
    _parse: parentParse,
    fetch
  } as any);
  expect(context.coreApi).toBe(parentCoreApi);
  expect(context._parse).toBe(parentParse);
  expect(context.fetch).toBe(fetch);
});
