// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {createRequire} from 'node:module';
import {expect, test} from 'vitest';

const requirePackage = createRequire(import.meta.url);

test('table-format sources resolve from independent CommonJS subpaths', () => {
  expect(requirePackage('@loaders.gl/tables/iceberg').IcebergTableSource).toBeDefined();
  expect(requirePackage('@loaders.gl/tables/iceberg').IcebergRestCatalog).toBeDefined();
  expect(requirePackage('@loaders.gl/tables/delta').DeltaTableSource).toBeDefined();
  expect(requirePackage('@loaders.gl/tables/hudi').HudiTableSource).toBeDefined();
});
