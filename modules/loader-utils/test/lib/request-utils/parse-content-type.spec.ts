// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {parseContentType} from '@loaders.gl/loader-utils';
import {expect, test} from 'vitest';

test('parseContentType', () => {
  expect(parseContentType(null)).toBeNull();
  expect(parseContentType('')).toBeNull();
  expect(parseContentType('   ')).toBeNull();
  expect(parseContentType('; charset=utf-8')).toBeNull();
  expect(parseContentType('text/html; charset=utf-8')).toBe('text/html');
  expect(parseContentType(' Application/JSON ')).toBe('application/json');
});
