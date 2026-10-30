// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {mergeOptions} from '@loaders.gl/core/loader-utils';
import type {XMLLoaderOptions} from '@loaders.gl/documents';
// NOTE: addAliases is not a public export, already used by test setup
// import {_addAliases} from '@loaders.gl/core/loader-utils';
test('mergeOptions', () => {
  const originalOptions: XMLLoaderOptions = {xml: {strict: true, removeNSPrefix: true}};
  const mergedOptions = mergeOptions(originalOptions, {xml: {strict: false, htmlEntities: true}});
  expect(mergedOptions).toEqual({xml: {strict: false, removeNSPrefix: true, htmlEntities: true}});
});
