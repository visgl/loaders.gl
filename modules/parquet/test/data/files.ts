// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** One Apache Parquet compatibility fixture and its expected backend support. */
export type ParquetTestFile = {
  /** Stable fixture name used in test output. */
  title: string;
  /** Fixture path relative to the Apache Parquet test-data directory. */
  path: string;
  /** Whether the loaders.gl TypeScript backend currently reads this fixture. */
  supportedJs: boolean;
  /** Whether the loaders.gl parquet-wasm backend currently reads this fixture. */
  supportedWasm: boolean;
  /** Whether the pinned hyparquet reference currently reads this fixture. */
  supportedHyparquet: boolean;
  /** Whether the fixture uses Parquet modular encryption. */
  encrypted?: boolean;
  /** Whether the fixture is intentionally malformed. */
  bad?: boolean;
  /** Whether the wasm assertion is safe to execute in the shared test process. */
  testWasm?: boolean;
};

/**
 * Executable backend compatibility matrix.
 *
 * Keep classifications aligned with `parquet-compatibility.spec.ts`. A backend
 * improvement intentionally fails that test until this matrix is updated.
 */
export const PARQUET_FILES: ParquetTestFile[] = [
  {
    title: 'lz4_raw_compressed',
    path: 'good/lz4_raw_compressed.parquet',
    supportedJs: true,
    supportedWasm: true,
    supportedHyparquet: true
  },
  {
    title: 'lz4_raw_compressed_larger',
    path: 'good/lz4_raw_compressed_larger.parquet',
    supportedJs: true,
    supportedWasm: true,
    supportedHyparquet: true
  },
  {
    title: 'non_hadoop_lz4_compressed',
    path: 'good/non_hadoop_lz4_compressed.parquet',
    supportedJs: true,
    supportedWasm: true,
    supportedHyparquet: true
  },
  {
    title: 'alltypes_dictionary',
    path: 'good/alltypes_dictionary.parquet',
    supportedJs: true,
    supportedWasm: true,
    supportedHyparquet: true
  },
  {
    title: 'alltypes_plain',
    path: 'good/alltypes_plain.parquet',
    supportedJs: true,
    supportedWasm: true,
    supportedHyparquet: true
  },
  {
    title: 'alltypes_plain_snappy',
    path: 'good/alltypes_plain.snappy.parquet',
    supportedJs: true,
    supportedWasm: true,
    supportedHyparquet: true
  },
  {
    title: 'binary',
    path: 'good/binary.parquet',
    supportedJs: true,
    supportedWasm: true,
    supportedHyparquet: true
  },
  {
    title: 'bloom_filter',
    path: 'good/bloom_filter.bin',
    supportedJs: false,
    supportedWasm: false,
    supportedHyparquet: false
  },
  {
    title: 'byte_array_decimal',
    path: 'good/byte_array_decimal.parquet',
    supportedJs: true,
    supportedWasm: true,
    supportedHyparquet: true
  },
  {
    title: 'datapage_v2',
    path: 'good/datapage_v2.snappy.parquet',
    supportedJs: false,
    supportedWasm: true,
    supportedHyparquet: true
  },
  {
    title: 'dict',
    path: 'good/dict-page-offset-zero.parquet',
    supportedJs: true,
    supportedWasm: false,
    supportedHyparquet: true
  },
  {
    title: 'fixed_length_decimal',
    path: 'good/fixed_length_decimal.parquet',
    supportedJs: true,
    supportedWasm: true,
    supportedHyparquet: true
  },
  {
    title: 'fixed_length_decimal_legacy',
    path: 'good/fixed_length_decimal_legacy.parquet',
    supportedJs: true,
    supportedWasm: true,
    supportedHyparquet: true
  },
  {
    title: 'hadoop_lz4_compressed',
    path: 'good/hadoop_lz4_compressed.parquet',
    supportedJs: false,
    supportedWasm: true,
    supportedHyparquet: true
  },
  {
    title: 'hadoop_lz4_compressed_larger',
    path: 'good/hadoop_lz4_compressed_larger.parquet',
    supportedJs: true,
    supportedWasm: true,
    supportedHyparquet: true
  },
  {
    title: 'int32_decimal',
    path: 'good/int32_decimal.parquet',
    supportedJs: true,
    supportedWasm: true,
    supportedHyparquet: true
  },
  {
    title: 'int64_decimal',
    path: 'good/int64_decimal.parquet',
    supportedJs: true,
    supportedWasm: true,
    supportedHyparquet: true
  },
  {
    title: 'list_columns',
    path: 'good/list_columns.parquet',
    supportedJs: true,
    supportedWasm: true,
    supportedHyparquet: true
  },
  {
    title: 'nation',
    path: 'good/nation.dict-malformed.parquet',
    supportedJs: true,
    supportedWasm: false,
    supportedHyparquet: false,
    testWasm: false
  },
  {
    title: 'nested_lists',
    path: 'good/nested_lists.snappy.parquet',
    supportedJs: true,
    supportedWasm: true,
    supportedHyparquet: true
  },
  {
    title: 'nested_maps',
    path: 'good/nested_maps.snappy.parquet',
    supportedJs: true,
    supportedWasm: true,
    supportedHyparquet: true
  },
  {
    title: 'nested_structs',
    path: 'good/nested_structs.rust.parquet',
    supportedJs: false,
    supportedWasm: true,
    supportedHyparquet: true
  },
  {
    title: 'nonnullable',
    path: 'good/nonnullable.impala.parquet',
    supportedJs: true,
    supportedWasm: true,
    supportedHyparquet: true
  },
  {
    title: 'nullable',
    path: 'good/nullable.impala.parquet',
    supportedJs: true,
    supportedWasm: true,
    supportedHyparquet: true
  },
  {
    title: 'nulls',
    path: 'good/nulls.snappy.parquet',
    supportedJs: true,
    supportedWasm: true,
    supportedHyparquet: true
  },
  {
    title: 'repeated_no_annotation',
    path: 'good/repeated_no_annotation.parquet',
    supportedJs: true,
    supportedWasm: true,
    supportedHyparquet: true
  },
  {
    title: 'single_nan',
    path: 'good/single_nan.parquet',
    supportedJs: true,
    supportedWasm: true,
    supportedHyparquet: true
  },
  {
    title: 'data_index_bloom_encoding_stats',
    path: 'good/data_index_bloom_encoding_stats.parquet',
    supportedJs: true,
    supportedWasm: true,
    supportedHyparquet: true
  },
  {
    title: 'delta_binary_packed',
    path: 'good/delta_binary_packed.parquet',
    supportedJs: false,
    supportedWasm: true,
    supportedHyparquet: true
  },
  {
    title: 'delta_byte_array',
    path: 'good/delta_byte_array.parquet',
    supportedJs: false,
    supportedWasm: true,
    supportedHyparquet: true
  },
  {
    title: 'delta_encoding_optional_column',
    path: 'good/delta_encoding_optional_column.parquet',
    supportedJs: false,
    supportedWasm: true,
    supportedHyparquet: true
  },
  {
    title: 'delta_encoding_required_column',
    path: 'good/delta_encoding_required_column.parquet',
    supportedJs: false,
    supportedWasm: true,
    supportedHyparquet: true
  },
  {
    title: 'uniform_encryption',
    path: 'good/uniform_encryption.parquet.encrypted',
    supportedJs: false,
    supportedWasm: false,
    supportedHyparquet: false,
    encrypted: true
  },
  {
    title: 'encrypt_columns_and_footer',
    path: 'encrypted/encrypt_columns_and_footer.parquet.encrypted',
    supportedJs: false,
    supportedWasm: false,
    supportedHyparquet: false,
    encrypted: true
  },
  {
    title: 'encrypt_columns_and_footer_aad',
    path: 'encrypted/encrypt_columns_and_footer_aad.parquet.encrypted',
    supportedJs: false,
    supportedWasm: false,
    supportedHyparquet: false,
    encrypted: true
  },
  {
    title: 'encrypt_columns_and_footer_ctr',
    path: 'encrypted/encrypt_columns_and_footer_ctr.parquet.encrypted',
    supportedJs: false,
    supportedWasm: false,
    supportedHyparquet: false,
    encrypted: true
  },
  {
    title: 'encrypt_columns_and_footer_disable_aad_storage',
    path: 'encrypted/encrypt_columns_and_footer_disable_aad_storage.parquet.encrypted',
    supportedJs: false,
    supportedWasm: false,
    supportedHyparquet: false,
    encrypted: true
  },
  {
    title: 'encrypt_columns_plaintext_footer',
    path: 'encrypted/encrypt_columns_plaintext_footer.parquet.encrypted',
    supportedJs: false,
    supportedWasm: false,
    supportedHyparquet: false,
    encrypted: true,
    testWasm: false
  },
  {
    title: 'PARQUET-1481',
    path: 'illegal/PARQUET-1481.parquet',
    supportedJs: false,
    supportedWasm: false,
    supportedHyparquet: false,
    bad: true
  }
];

export const SUPPORTED_FILES = PARQUET_FILES.filter(file => file.supportedJs);
export const UNSUPPORTED_FILES = PARQUET_FILES.filter(
  file => !file.supportedJs && !file.encrypted && !file.bad
);
export const ENCRYPTED_FILES = PARQUET_FILES.filter(file => !file.supportedJs && file.encrypted);
export const BAD_FILES = PARQUET_FILES.filter(file => file.bad);
export const WASM_SUPPORTED_FILES = PARQUET_FILES.filter(file => file.supportedWasm);
export const HYPARQUET_SUPPORTED_FILES = PARQUET_FILES.filter(file => file.supportedHyparquet);
