// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import type {Test} from 'tape';

import {fetchFile, load} from '@loaders.gl/core';
import {ParquetLoader} from '@loaders.gl/parquet';
import type {ObjectRowTable} from '@loaders.gl/schema';
import {parquetReadObjects} from 'hyparquet';
import {compressors} from 'hyparquet-compressors';

import {PARQUET_FILES, type ParquetTestFile} from './data/files';

const PARQUET_DIRECTORY = '@loaders.gl/parquet/test/data/apache';

type CompatibilityResult = {
  supported: boolean;
  error?: string;
  rows?: unknown[];
};

type LoadersGlBackend = 'typescript' | 'wasm';

const TYPESCRIPT_DIFFERENTIAL_FIXTURES = new Set([
  'datapage_v2',
  'hadoop_lz4_compressed',
  'delta_binary_packed',
  'delta_byte_array',
  'delta_encoding_optional_column',
  'delta_encoding_required_column'
]);

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

for (const fixture of PARQUET_FILES.filter(({title}) => TYPESCRIPT_DIFFERENTIAL_FIXTURES.has(title))) {
  test(`Parquet compatibility differential#typescript#${fixture.title}`, async (t) => {
    const url = `${PARQUET_DIRECTORY}/${fixture.path}`;
    const file = await readCompatibilityFixture(url);
    const [loadersGlResult, hyparquetResult] = await Promise.all([
      readWithLoadersGl(file, 'typescript'),
      readWithHyparquet(file)
    ]);

    t.ok(loadersGlResult.supported, 'TypeScript backend reads the fixture');
    t.ok(hyparquetResult.supported, 'hyparquet reads the fixture');
    t.deepEqual(
      normalizeRows(loadersGlResult.rows || []),
      normalizeRows(hyparquetResult.rows || []),
      'decoded rows match the reference implementation'
    );
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
    const table = (await load(file, ParquetLoader, {
      core: {worker: false},
      parquet: {backend}
    })) as ObjectRowTable;
    return {supported: true, rows: table.data};
  } catch (error) {
    return {supported: false, error: getErrorMessage(error)};
  }
}

/** Read one compatibility fixture through the external hyparquet reference implementation. */
async function readWithHyparquet(file: ArrayBuffer): Promise<CompatibilityResult> {
  try {
    const rows = await parquetReadObjects({file, compressors});
    return {supported: true, rows};
  } catch (error) {
    return {supported: false, error: getErrorMessage(error)};
  }
}

/** Normalizes backend-specific scalar representations before differential comparison. */
function normalizeRows(rows: unknown[]): unknown[] {
  return rows.map(row => normalizeValue(row));
}

/** Normalizes bigint, binary, date, array, and object values recursively. */
function normalizeValue(value: unknown): unknown {
  if (typeof value === 'bigint') {
    return Number(value);
  }
  if (typeof value === 'string') {
    return Array.from(new TextEncoder().encode(value));
  }
  if (value instanceof Date) {
    return value.valueOf();
  }
  if (ArrayBuffer.isView(value)) {
    return Array.from(value as ArrayLike<number>);
  }
  if (Array.isArray(value)) {
    return value.map(item => normalizeValue(item));
  }
  if (value && typeof value === 'object') {
    const entries = Object.entries(value);
    if (
      entries.length === 1 &&
      entries[0][0] === 'list' &&
      Array.isArray(entries[0][1])
    ) {
      return entries[0][1].map(item => {
        if (item && typeof item === 'object' && Object.keys(item).length === 1 && 'element' in item) {
          return normalizeValue(item.element);
        }
        return normalizeValue(item);
      });
    }
    return Object.fromEntries(
      entries
        .filter(([, item]) => item !== undefined && item !== null)
        .map(([key, item]) => [key, normalizeValue(item)])
    );
  }
  return value;
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
