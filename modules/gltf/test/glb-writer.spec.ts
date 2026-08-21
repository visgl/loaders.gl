// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {validateWriter} from 'test/common/conformance';

import {GLBWriter} from '@loaders.gl/gltf';

test('GLBWriter#loader conformance', t => {
  validateWriter(t, GLBWriter, 'GLBWriter');
  t.end();
});
