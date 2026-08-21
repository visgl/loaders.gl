// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {createProjection} from '../../src/utils/projection-utils';
import {areNumberArraysEqual} from './compareArrays';

test('projection-utils#createProjection', async t => {
  t.equals(createProjection(), null);

  const projection = createProjection(
    '+proj=utm +zone=32 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs'
  );
  t.ok(
    areNumberArraysEqual(
      projection?.project([291750, 5744750]),
      [5.978647065934338, 51.814730970044465]
    )
  );

  t.end();
});
