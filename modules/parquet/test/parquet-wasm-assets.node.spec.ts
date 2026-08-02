// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {readFileSync} from 'node:fs';
import test from 'tape-promise/tape';

import {PARQUET_WASM_URL} from '@loaders.gl/parquet/wasm';

type ParquetPackage = {
  exports: Record<string, string | Record<string, string>>;
};

test('Parquet WASM assets#exports a package-local URL', t => {
  t.ok(PARQUET_WASM_URL instanceof URL, 'exports a URL');
  t.ok(
    PARQUET_WASM_URL.pathname.endsWith('/parquet_wasm_bg.wasm'),
    'resolves the packaged WASM filename next to the ESM module'
  );
  t.end();
});

test('Parquet WASM assets#package export map', t => {
  const packageJson = JSON.parse(
    readFileSync(new URL('../package.json', import.meta.url), 'utf8')
  ) as ParquetPackage;
  const wasmModuleExport = packageJson.exports['./wasm'];

  t.deepEqual(
    wasmModuleExport,
    {
      types: './dist/wasm.d.ts',
      import: './dist/wasm.js'
    },
    'exposes the URL helper as an import-only subpath'
  );
  t.equal(
    packageJson.exports['./parquet_wasm_bg.wasm'],
    './dist/parquet_wasm_bg.wasm',
    'exposes the raw packaged WASM asset'
  );
  t.end();
});
