// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import { readFileSync } from 'node:fs';
import { expect, test } from "vitest";
import { PARQUET_WASM_URL } from '@loaders.gl/parquet/wasm';
type ParquetPackage = {
    exports: Record<string, string | Record<string, string>>;
};
test('Parquet WASM assets#exports a package-local URL', () => {
    expect(PARQUET_WASM_URL instanceof URL, 'exports a URL').toBeTruthy();
    expect(PARQUET_WASM_URL.pathname.endsWith('/parquet_wasm_bg.wasm'), 'resolves the packaged WASM filename next to the ESM module').toBeTruthy();
});
test('Parquet WASM assets#package export map', () => {
    const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as ParquetPackage;
    const wasmModuleExport = packageJson.exports['./wasm'];
    expect(wasmModuleExport, 'exposes the URL helper as an import-only subpath').toEqual({
        types: './dist/wasm.d.ts',
        import: './dist/wasm.js'
    });
    expect(packageJson.exports['./parquet_wasm_bg.wasm'], 'exposes the raw packaged WASM asset').toBe('./dist/parquet_wasm_bg.wasm');
});
