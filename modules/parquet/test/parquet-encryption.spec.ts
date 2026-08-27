// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {load} from '@loaders.gl/core';
import {
  ParquetJSLoader,
  ParquetSourceLoader,
  createParquetModuleAad,
  verifyParquetFooterSignature
} from '@loaders.gl/parquet';
import type {ParquetSource} from '@loaders.gl/parquet/parquet-source-loader';
import {createWorkerKeyRetriever} from '../src/lib/parquet-source-worker-decoder';
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

test('ParquetJSLoader does not retrieve keys for unprojected encrypted columns', async () => {
  const requestedKeyMetadata: string[] = [];
  const keyRetriever = (keyMetadata: Uint8Array | undefined) => {
    const keyId = keyMetadata ? new TextDecoder().decode(keyMetadata) : '';
    requestedKeyMetadata.push(keyId);
    return ENCRYPTED_KEYS[keyId];
  };
  const url = `${PARQUET_DIR}/encrypted/encrypt_columns_and_footer.parquet.encrypted`;
  const table = await load(url, ParquetJSLoader, {
    core: {worker: false},
    parquet: {
      columns: ['double_field'],
      keyRetriever
    }
  });

  expect(table.data).toHaveLength(50);
  expect(new Set(requestedKeyMetadata)).not.toEqual(new Set(['kf', 'kc1', 'kc2']));
});

test('ParquetSource decrypts encrypted pages in a worker', async () => {
  const url = `${PARQUET_DIR}/encrypted/encrypt_columns_and_footer.parquet.encrypted`;
  const source = (await load(url, ParquetSourceLoader, {
    core: {worker: true, reuseWorkers: false, _workerType: 'test'},
    parquet: {
      columns: ['double_field'],
      keyRetriever: getEncryptedFixtureKey
    }
  })) as ParquetSource;
  const batches = [];
  for await (const batch of source.read({columns: ['double_field']})) {
    batches.push(batch);
  }
  await source.close();

  expect(batches.reduce((count, batch) => count + batch.rowCount, 0)).toBe(50);
  expect(batches[0]?.data.getChild('double_field')?.toArray().length).toBeGreaterThan(0);
});

test('worker key lookup uses the encrypted column ordinal', async () => {
  const firstKey = new Uint8Array([1, 2, 3]).buffer;
  const secondKey = new Uint8Array([4, 5, 6]).buffer;
  const sharedMetadata = new Uint8Array([7, 8]).buffer;
  const keyRetriever = createWorkerKeyRetriever(
    [
      {columnOrdinal: 0, keyMetadata: sharedMetadata, keyMaterial: firstKey},
      {columnOrdinal: 1, keyMetadata: sharedMetadata, keyMaterial: secondKey}
    ],
    0,
    2
  );
  const aad = new Uint8Array(9);
  aad.set([9, 9], 0);
  aad[2] = 2;
  new DataView(aad.buffer).setInt16(3, 0, true);
  new DataView(aad.buffer).setInt16(5, 1, true);

  expect(
    keyRetriever(new Uint8Array(sharedMetadata), {
      algorithm: 'AES_GCM_V1',
      aad
    })
  ).toEqual(new Uint8Array(secondKey));
});

test('verifies plaintext-footer signatures and rejects tampering', async () => {
  const footerBytes = new TextEncoder().encode('serialized parquet footer');
  const fileUnique = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
  const aad = createParquetModuleAad(undefined, fileUnique, 'footer');
  const key = new TextEncoder().encode('0123456789012345');
  const cryptoKey = await globalThis.crypto.subtle.importKey(
    'raw',
    key,
    {name: 'AES-GCM'},
    false,
    ['encrypt', 'decrypt']
  );
  const nonce = new Uint8Array(12);
  nonce.set([9, 8, 7, 6, 5, 4, 3, 2, 1]);
  const encrypted = new Uint8Array(
    await globalThis.crypto.subtle.encrypt(
      {name: 'AES-GCM', iv: nonce, additionalData: aad},
      cryptoKey,
      footerBytes
    )
  );
  const signature = new Uint8Array(28);
  signature.set(nonce);
  signature.set(encrypted.subarray(encrypted.length - 16), 12);
  const keyRetriever = () => key;

  await expect(
    globalThis.crypto.subtle.decrypt(
      {name: 'AES-GCM', iv: nonce, additionalData: aad},
      cryptoKey,
      encrypted
    )
  ).resolves.toEqual(footerBytes.buffer);

  await verifyParquetFooterSignature(footerBytes, signature, {
    algorithm: 'AES_GCM_V1',
    aad,
    keyMetadata: new TextEncoder().encode('footer'),
    keyRetriever
  });

  const tamperedFooter = footerBytes.slice();
  tamperedFooter[0] ^= 1;
  await expect(
    verifyParquetFooterSignature(tamperedFooter, signature, {
      algorithm: 'AES_GCM_V1',
      aad,
      keyMetadata: new TextEncoder().encode('footer'),
      keyRetriever
    })
  ).rejects.toThrow();
});
