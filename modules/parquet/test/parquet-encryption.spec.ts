// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {load} from '@loaders.gl/core';
import {ParquetJSLoader} from '@loaders.gl/parquet';
import {expect, test} from 'vitest';

const PARQUET_DIR = '@loaders.gl/parquet/test/data/apache';

const ENCRYPTED_KEYS: Record<string, Uint8Array> = {
  kf: new TextEncoder().encode('0123456789012345'),
  kc1: new TextEncoder().encode('1234567890123450'),
  kc2: new TextEncoder().encode('1234567890123451')
};

/** Resolves the keys used by the Apache modular-encryption fixtures. */
function getEncryptedFixtureKey(keyMetadata: Uint8Array | ArrayBuffer | undefined): Uint8Array {
  const keyBytes =
    keyMetadata instanceof Uint8Array
      ? keyMetadata
      : keyMetadata
        ? new Uint8Array(keyMetadata)
        : new Uint8Array();
  const key = ENCRYPTED_KEYS[new TextDecoder().decode(keyBytes)];
  if (!key) throw new Error(`Unknown key metadata ${new TextDecoder().decode(keyBytes)}`);
  return key;
}

/** Returns deterministic loader options for the encrypted fixture tests. */
function getEncryptedLoaderOptions() {
  return {
    core: {worker: false},
    parquet: {
      columns: ['double_field', 'float_field'],
      keyRetriever: getEncryptedFixtureKey
    }
  };
}

test('ParquetJSLoader decrypts modular encrypted columns into object rows', async () => {
  const url = `${PARQUET_DIR}/encrypted/encrypt_columns_and_footer.parquet.encrypted`;
  const table = await load(url, ParquetJSLoader, getEncryptedLoaderOptions());

  expect(table.shape).toBe('object-row-table');
  if (table.shape === 'object-row-table') {
    expect(table.data).toHaveLength(50);
    expect(typeof table.data[0].double_field).toBe('number');
    expect(typeof table.data[0].float_field).toBe('number');
  }
});

test('ParquetJSLoader decrypts AES-CTR encrypted page modules', async () => {
  const url = `${PARQUET_DIR}/encrypted/encrypt_columns_and_footer_ctr.parquet.encrypted`;
  const table = await load(url, ParquetJSLoader, getEncryptedLoaderOptions());

  expect(table.shape).toBe('object-row-table');
  if (table.shape === 'object-row-table') {
    expect(table.data).toHaveLength(50);
    expect(typeof table.data[0].double_field).toBe('number');
  }
});

test('ParquetJSLoader decrypts encrypted columns with a plaintext footer', async () => {
  const url = `${PARQUET_DIR}/encrypted/encrypt_columns_plaintext_footer.parquet.encrypted`;
  const table = await load(url, ParquetJSLoader, getEncryptedLoaderOptions());

  expect(table.shape).toBe('object-row-table');
  if (table.shape === 'object-row-table') {
    expect(table.data).toHaveLength(50);
  }
});

test('ParquetJSLoader decrypts encrypted columns into an Arrow table', async () => {
  const url = `${PARQUET_DIR}/encrypted/encrypt_columns_and_footer.parquet.encrypted`;
  const table = await load(url, ParquetJSLoader, {
    ...getEncryptedLoaderOptions(),
    parquet: {...getEncryptedLoaderOptions().parquet, shape: 'arrow-table'}
  });

  expect(table.shape).toBe('arrow-table');
  if (table.shape === 'arrow-table') {
    expect(table.data.numRows).toBe(50);
    expect(table.data.schema.fields.map(field => field.name).sort()).toEqual([
      'double_field',
      'float_field'
    ]);
  }
});
