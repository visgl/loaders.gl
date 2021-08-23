const PARQUET_FILES = [
  // Parquet seems to use LZ4 compression without header so we need to find a way to e.g. add a dummy header.
  {supported: true, title: 'lz4_raw_compressed', path: 'good/lz4_raw_compressed.parquet'},
  {supported: true, title: 'lz4_raw_compressed_larger', path: 'good/lz4_raw_compressed_larger.parquet'},
  {supported: true, title: 'non_hadoop_lz4_compressed', path: 'good/non_hadoop_lz4_compressed.parquet'},
  {supported: true, title: 'alltypes_dictionary', path: 'good/alltypes_dictionary.parquet'},
  {supported: true, title: 'alltypes_plain', path: 'good/alltypes_plain.parquet'},
  {supported: true, title: 'alltypes_plain_snappy', path: 'good/alltypes_plain.snappy.parquet'},
  {supported: true, title: 'binary', path: 'good/binary.parquet'},
  // Specialized Dict for very large dictionaries: https://github.com/apache/parquet-format/blob/master/BloomFilter.md
  {supported: false, title: 'bloom_filter', path: 'good/bloom_filter.bin'}, 
  {supported: true, title: 'byte_array_decimal', path: 'good/byte_array_decimal.parquet'},
  {supported: false, title: 'datapage_v2', path: 'good/datapage_v2.snappy.parquet'}, // Doesn't work on parquet-tools
  {supported: true, title: 'dict', path: 'good/dict-page-offset-zero.parquet'},
  {supported: true, title: 'fixed_length_decimal', path: 'good/fixed_length_decimal.parquet'},
  {supported: true, title: 'fixed_length_decimal_legacy', path: 'good/fixed_length_decimal_legacy.parquet'},
  {supported: false, title: 'hadoop_lz4_compressed', path: 'good/hadoop_lz4_compressed.parquet'},
  {supported: false, title: 'hadoop_lz4_compressed_larger', path: 'good/hadoop_lz4_compressed_larger.parquet'},
  {supported: true, title: 'int32_decimal', path: 'good/int32_decimal.parquet'},
  {supported: true, title: 'int64_decimal', path: 'good/int64_decimal.parquet'},
  {supported: true, title: 'list_columns', path: 'good/list_columns.parquet'},
  {supported: true, title: 'nation', path: 'good/nation.dict-malformed.parquet'}, // Partially works, issue with indices for dictionary values.
  {supported: true, title: 'nested_lists', path: 'good/nested_lists.snappy.parquet'},
  {supported: true, title: 'nested_maps', path: 'good/nested_maps.snappy.parquet'},
  {supported: false, title: 'nested_structs', path: 'good/nested_structs.rust.parquet'},
  {supported: true, title: 'nonnullable', path: 'good/nonnullable.impala.parquet'},
  {supported: true, title: 'nullable', path: 'good/nullable.impala.parquet'},
  {supported: true, title: 'nulls', path: 'good/nulls.snappy.parquet'},
  {supported: true, title: 'repeated_no_annotation', path: 'good/repeated_no_annotation.parquet'},
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
