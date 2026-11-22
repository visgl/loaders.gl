// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {defineConfig} from 'vitest/config';

export default defineConfig({
  test: {include: ['test/bundlers/parquet-rspack.spec.mjs']}
});
