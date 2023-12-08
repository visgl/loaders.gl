// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {setLoaderOptions, getLoaderOptions} from '@loaders.gl/core';

test('setLoaderOptions', (t) => {
  setLoaderOptions({});
  t.end();
});

test('getLoaderOptions', (t) => {
  const options1 = getLoaderOptions();
  t.notOk(options1.customOption);
  setLoaderOptions({
    customOption: 'customValue'
  });
  const options2 = getLoaderOptions();
  t.equals(options2.customOption, 'customValue');
  t.end();
});
