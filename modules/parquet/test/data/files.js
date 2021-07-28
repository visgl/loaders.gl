const PARQUET_FILES = [
  {supported: false, title: 'lz4_raw_compressed', path: 'good/lz4_raw_compressed.parquet'},
  {supported: false, title: 'lz4_raw_compressed_larger', path: 'good/lz4_raw_compressed_larger.parquet'},
  {supported: false, title: 'non_hadoop_lz4_compressed', path: 'good/non_hadoop_lz4_compressed.parquet'},
  {supported: true, title: 'alltypes_dictionary', path: 'good/alltypes_dictionary.parquet'},
  {supported: true, title: 'alltypes_plain', path: 'good/alltypes_plain.parquet'},
  {supported: false, title: 'alltypes_plain', path: 'good/alltypes_plain.snappy.parquet'},
  {supported: true, title: 'binary', path: 'good/binary.parquet'},
  {supported: false, title: 'bloom_filter', path: 'good/bloom_filter.bin'},
  {supported: false, title: 'byte_array_decimal', path: 'good/byte_array_decimal.parquet'},
  {supported: false, title: 'datapage_v2', path: 'good/datapage_v2.snappy.parquet'},
  // TODO fix regression of supporting dict-page-offset-zero.parquet file
  {supported: false, title: 'dict', path: 'good/dict-page-offset-zero.parquet'},
  {supported: false, title: 'fixed_length_decimal', path: 'good/fixed_length_decimal.parquet'},
  {supported: false, title: 'fixed_length_decimal_legacy', path: 'good/fixed_length_decimal_legacy.parquet'},
  {supported: false, title: 'hadoop_lz4_compressed', path: 'good/hadoop_lz4_compressed.parquet'},
  {supported: false, title: 'hadoop_lz4_compressed_larger', path: 'good/hadoop_lz4_compressed_larger.parquet'},
  {supported: false, title: 'int32_decimal', path: 'good/int32_decimal.parquet'},
  {supported: false, title: 'int64_decimal', path: 'good/int64_decimal.parquet'},
  {supported: false, title: 'list_columns', path: 'good/list_columns.parquet'},
  {supported: false, title: 'nation', path: 'good/nation.dict-malformed.parquet'},
  {supported: false, title: 'nested_lists', path: 'good/nested_lists.snappy.parquet'},
  {supported: false, title: 'nested_maps', path: 'good/nested_maps.snappy.parquet'},
  {supported: false, title: 'nested_structs', path: 'good/nested_structs.rust.parquet'},
  {supported: true, title: 'nonnullable', path: 'good/nonnullable.impala.parquet'},
  {supported: false, title: 'nullable', path: 'good/nullable.impala.parquet'},
  {supported: true, title: 'nulls', path: 'good/nulls.snappy.parquet'},
  {supported: false, title: 'repeated_no_annotation', path: 'good/repeated_no_annotation.parquet'},
  {supported: false, title: 'single_nan', path: 'good/single_nan.parquet'},

  // Encrypted
  {supported: false, encrypted: true, title: 'uniform_encryption', path: 'good/uniform_encryption.parquet.encrypted'},
  {supported: false, encrypted: true, title: 'encrypt_columns_and_footer', path: 'encrypted/encrypt_columns_and_footer.parquet.encrypted'},
  {supported: false, encrypted: true, title: 'encrypt_columns_and_footer_aad', path: 'encrypted/encrypt_columns_and_footer_aad.parquet.encrypted'},
  {supported: false, encrypted: true, title: 'encrypt_columns_and_footer_ctr', path: 'encrypted/encrypt_columns_and_footer_ctr.parquet.encrypted'},
  {supported: false, encrypted: true, title: 'encrypt_columns_and_footer_disable_aad_storage', path: 'encrypted/encrypt_columns_and_footer_disable_aad_storage.parquet.encrypted'},
  {supported: false, encrypted: true,  title: 'encrypt_columns_plaintext_footer', path: 'encrypted/encrypt_columns_plaintext_footer.parquet.encrypted'},

  // Illegal
  {supported: false, bad: true, title: 'PARQUET-1481', path: 'illegal/PARQUET-1481.parquet'},
];

export const SUPPORTED_FILES = PARQUET_FILES.filter(file => file.supported);
export const UNSUPPORTED_FILES = PARQUET_FILES.filter(file => !file.supported && !file.encrypted && !file.bad);
export const ENCRYPTED_FILES = PARQUET_FILES.filter(file => !file.supported && file.encrypted);
export const BAD_FILES = PARQUET_FILES.filter(file => file.bad)
