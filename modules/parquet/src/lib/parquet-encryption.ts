// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Algorithms defined by the Parquet modular-encryption specification. */
export type ParquetEncryptionAlgorithm = 'AES_GCM_V1' | 'AES_GCM_CTR_V1';

/** Identifies one encrypted Parquet module in its authenticated-data suffix. */
export type ParquetEncryptionModule =
  | 'footer'
  | 'column-metadata'
  | 'data-page'
  | 'dictionary-page'
  | 'data-page-header'
  | 'dictionary-page-header'
  | 'column-index'
  | 'offset-index'
  | 'bloom-filter-header'
  | 'bloom-filter-bitset';

/** Supplies a 128-bit, 192-bit, or 256-bit key for a Parquet module. */
export type ParquetKeyRetriever = (
  keyMetadata: Uint8Array | undefined,
  context: {algorithm: ParquetEncryptionAlgorithm; aad: Uint8Array}
) => Promise<ArrayBuffer | ArrayBufferView> | ArrayBuffer | ArrayBufferView;

/** Options used when decrypting one serialized Parquet module. */
export type ParquetDecryptModuleOptions = {
  /** Encryption algorithm selected by the file crypto metadata. */
  algorithm: ParquetEncryptionAlgorithm;
  /** Authentication data constructed from the file AAD prefix and module suffix. */
  aad: Uint8Array;
  /** Optional key metadata passed to the caller's key retriever. */
  keyMetadata?: Uint8Array;
  /** Resolves the key without making key material part of source options. */
  keyRetriever: ParquetKeyRetriever;
  /** True for a page encrypted with AES-CTR under AES_GCM_CTR_V1. */
  page?: boolean;
};

/** Reads one length-prefixed encrypted Parquet module from a serialized range. */
export function readParquetEncryptedModule(
  buffer: Uint8Array,
  offset = 0
): {bytes: Uint8Array; nextOffset: number} {
  if (offset + 4 > buffer.length) {
    throw new Error('Invalid encrypted Parquet module: missing module length');
  }
  const length = new DataView(buffer.buffer, buffer.byteOffset + offset, 4).getUint32(0, true);
  const moduleStart = offset + 4;
  const moduleEnd = moduleStart + length;
  if (length < 12 || moduleEnd > buffer.length) {
    throw new Error('Invalid encrypted Parquet module: truncated module');
  }
  return {bytes: buffer.subarray(moduleStart, moduleEnd), nextOffset: moduleEnd};
}

/** Builds the AAD required by the Parquet modular-encryption specification. */
export function createParquetModuleAad(
  aadPrefix: Uint8Array | undefined,
  fileUnique: Uint8Array,
  module: ParquetEncryptionModule,
  rowGroupOrdinal?: number,
  columnOrdinal?: number,
  pageOrdinal?: number
): Uint8Array {
  const moduleType = [
    'footer',
    'column-metadata',
    'data-page',
    'dictionary-page',
    'data-page-header',
    'dictionary-page-header',
    'column-index',
    'offset-index',
    'bloom-filter-header',
    'bloom-filter-bitset'
  ].indexOf(module);
  if (moduleType < 0) throw new Error(`Unknown Parquet encryption module ${module}`);
  const isPageModule = module === 'data-page' || module === 'data-page-header';
  const suffixLength = fileUnique.length + (module === 'footer' ? 1 : isPageModule ? 7 : 5);
  const suffix = new Uint8Array(suffixLength);
  suffix.set(fileUnique);
  suffix[fileUnique.length] = moduleType;
  if (module !== 'footer') {
    new DataView(suffix.buffer).setInt16(fileUnique.length + 1, rowGroupOrdinal ?? 0, true);
    new DataView(suffix.buffer).setInt16(fileUnique.length + 3, columnOrdinal ?? 0, true);
    if (isPageModule)
      new DataView(suffix.buffer).setInt16(fileUnique.length + 5, pageOrdinal ?? 0, true);
  }
  const prefix = aadPrefix || new Uint8Array(0);
  const aad = new Uint8Array(prefix.length + suffix.length);
  aad.set(prefix);
  aad.set(suffix, prefix.length);
  return aad;
}

/** Decrypts a Parquet module serialized as `[length][nonce][ciphertext][tag]`. */
export async function decryptParquetModule(
  encryptedModule: ArrayBuffer | ArrayBufferView,
  options: ParquetDecryptModuleOptions
): Promise<Uint8Array> {
  const bytes = toUint8Array(encryptedModule);
  const buffer = hasLengthPrefix(bytes) ? bytes.subarray(4) : bytes;
  const nonceLength = 12;
  if (buffer.length < nonceLength + (options.page ? 0 : 16)) {
    throw new Error('Invalid Parquet encrypted module: truncated nonce or authentication tag');
  }
  const nonce = buffer.subarray(0, nonceLength);
  const ciphertext = buffer.subarray(nonceLength);
  const keyMaterial = await options.keyRetriever(options.keyMetadata, {
    algorithm: options.algorithm,
    aad: options.aad
  });
  const cryptoKey = await getCryptoKey(keyMaterial, options.algorithm, options.page);
  const cryptoProvider = getCryptoProvider();
  const plaintext =
    options.page && options.algorithm === 'AES_GCM_CTR_V1'
      ? await cryptoProvider.decrypt(
          {name: 'AES-CTR', counter: makeCounter(nonce) as unknown as BufferSource, length: 32},
          cryptoKey,
          ciphertext as unknown as BufferSource
        )
      : await cryptoProvider.decrypt(
          {
            name: 'AES-GCM',
            iv: nonce as unknown as BufferSource,
            additionalData: options.aad as unknown as BufferSource
          },
          cryptoKey,
          ciphertext as unknown as BufferSource
        );
  return new Uint8Array(plaintext);
}

/** Verifies a plaintext-footer signature by authenticating the serialized footer bytes. */
export async function verifyParquetFooterSignature(
  footerBytes: Uint8Array,
  signature: Uint8Array,
  options: {
    algorithm: ParquetEncryptionAlgorithm;
    aad: Uint8Array;
    keyMetadata?: Uint8Array;
    keyRetriever: ParquetKeyRetriever;
  }
): Promise<void> {
  if (signature.byteLength !== 28) {
    throw new Error(
      `Invalid Parquet plaintext-footer signature length ${signature.byteLength}; expected 28`
    );
  }
  const keyMaterial = await options.keyRetriever(options.keyMetadata, {
    algorithm: options.algorithm,
    aad: options.aad
  });
  const cryptoKey = await getCryptoKey(keyMaterial, options.algorithm, false, ['encrypt']);
  const encryptedFooter = new Uint8Array(
    await getCryptoProvider().encrypt(
      {
        name: 'AES-GCM',
        iv: signature.subarray(0, 12) as unknown as BufferSource,
        additionalData: options.aad as unknown as BufferSource
      },
      cryptoKey,
      footerBytes as unknown as BufferSource
    )
  );
  const calculatedTag = encryptedFooter.subarray(encryptedFooter.byteLength - 16);
  for (let index = 0; index < 16; index++) {
    if (calculatedTag[index] !== signature[12 + index]) {
      throw new Error('Parquet plaintext-footer signature verification failed');
    }
  }
}

function hasLengthPrefix(bytes: Uint8Array): boolean {
  if (bytes.length < 4) return false;
  const length = new DataView(bytes.buffer, bytes.byteOffset, 4).getUint32(0, true);
  return length === bytes.length - 4;
}

function makeCounter(nonce: Uint8Array): Uint8Array {
  const counter = new Uint8Array(16);
  counter.set(nonce);
  counter[15] = 1;
  return counter;
}

async function getCryptoKey(
  keyMaterial: ArrayBuffer | ArrayBufferView,
  algorithm: ParquetEncryptionAlgorithm,
  page?: boolean,
  usages: KeyUsage[] = ['decrypt']
): Promise<CryptoKey> {
  const keyBytes = toUint8Array(keyMaterial);
  if (keyBytes.byteLength !== 16 && keyBytes.byteLength !== 24 && keyBytes.byteLength !== 32) {
    throw new Error(`Invalid Parquet encryption key length ${keyBytes.byteLength}`);
  }
  return await getCryptoProvider().importKey(
    'raw',
    keyBytes as unknown as BufferSource,
    page && algorithm === 'AES_GCM_CTR_V1' ? {name: 'AES-CTR'} : {name: 'AES-GCM'},
    false,
    usages
  );
}

function getCryptoProvider(): SubtleCrypto {
  const cryptoProvider = globalThis.crypto?.subtle;
  if (!cryptoProvider) throw new Error('Parquet encryption requires Web Crypto support');
  return cryptoProvider;
}

function toUint8Array(value: ArrayBuffer | ArrayBufferView): Uint8Array {
  return value instanceof ArrayBuffer
    ? new Uint8Array(value)
    : new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
}
