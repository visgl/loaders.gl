// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {normalizeOptions} from '@loaders.gl/core/lib/loader-utils/option-utils';
import {NullLoader} from '@loaders.gl/core';

test('top-level parser options do not configure core options', () => {
  // Untyped callers can still supply the old property names.
  const legacyOptions = {worker: false, batchSize: 7, metadata: true};
  const options = normalizeOptions(legacyOptions as never, NullLoader);

  expect(options.core).toMatchObject({worker: true, batchSize: 'auto', metadata: false});
});
