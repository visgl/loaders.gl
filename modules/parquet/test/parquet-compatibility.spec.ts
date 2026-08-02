// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import type {Test} from 'tape';

import {fetchFile, load} from '@loaders.gl/core';
import {ParquetLoader} from '@loaders.gl/parquet';
import {parquetReadObjects} from 'hyparquet';
import {compressors} from 'hyparquet-compressors';

import {PARQUET_FILES, type ParquetTestFile} from './data/files';

const PARQUET_DIRECTORY = '@loaders.gl/parquet/test/data/apache';

type CompatibilityResult = {
  supported: boolean;
  error?: string;
};

type LoadersGlBackend = 'typescript' | 'wasm';

for (const backend of ['typescript', 'wasm'] as const) {
  const supportProperty = backend === 'typescript' ? 'supportedJs' : 'supportedWasm';
  for (const fixture of PARQUET_FILES) {
    if (backend === 'wasm' && fixture.testWasm === false) {
      continue;
    }
    test(`Parquet compatibility matrix#${backend}#${fixture.title}`, async (t) => {
      const url = `${PARQUET_DIRECTORY}/${fixture.path}`;
      const file = await readCompatibilityFixture(url);
      const result = await readWithLoadersGl(file, backend);
      assertCompatibilityResult(t, fixture, backend, fixture[supportProperty], result);
      t.end();
    });
  }
}

for (const fixture of PARQUET_FILES) {
  test(`Parquet compatibility matrix#hyparquet#${fixture.title}`, async (t) => {
    const url = `${PARQUET_DIRECTORY}/${fixture.path}`;
    const file = await readCompatibilityFixture(url);
    const result = await readWithHyparquet(file);
    assertCompatibilityResult(t, fixture, 'hyparquet', fixture.supportedHyparquet, result);
    t.end();
  });
}

/** Fetch and validate one fixture independently of the backend compatibility result. */
async function readCompatibilityFixture(url: string): Promise<ArrayBuffer> {
  const response = await fetchFile(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch Parquet compatibility fixture ${url}: ${response.status}`);
  }
  return await response.arrayBuffer();
}

/** Read one compatibility fixture through a loaders.gl backend. */
async function readWithLoadersGl(
  file: ArrayBuffer,
  backend: LoadersGlBackend
): Promise<CompatibilityResult> {
  try {
    await load(file, ParquetLoader, {
      core: {worker: false},
      parquet: {backend}
    });
    return {supported: true};
  } catch (error) {
    return {supported: false, error: getErrorMessage(error)};
  }
}

/** Read one compatibility fixture through the external hyparquet reference implementation. */
async function readWithHyparquet(file: ArrayBuffer): Promise<CompatibilityResult> {
  try {
    await parquetReadObjects({file, compressors});
    return {supported: true};
  } catch (error) {
    return {supported: false, error: getErrorMessage(error)};
  }
}

/** Assert one observed backend result against the executable matrix. */
function assertCompatibilityResult(
  t: Test,
  fixture: ParquetTestFile,
  backend: LoadersGlBackend | 'hyparquet',
  expectedSupport: boolean,
  result: CompatibilityResult
): void {
  const errorSuffix = result.error ? ` (${result.error})` : '';
  t.equal(
    result.supported,
    expectedSupport,
    `${backend} ${fixture.title}: support classification matches${errorSuffix}`
  );
}

/** Convert an unknown thrown value into a stable diagnostic string. */
function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
