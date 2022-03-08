const PARQUET_FILES = [
  // Parquet seems to use LZ4 compression without header so we need to find a way to e.g. add a dummy header.
  {supportedJs: true, supportedWasm: false, title: 'lz4_raw_compressed', path: 'good/lz4_raw_compressed.parquet'},
  {supportedJs: true, supportedWasm: false, title: 'lz4_raw_compressed_larger', path: 'good/lz4_raw_compressed_larger.parquet'},
  {supportedJs: true, supportedWasm: false, title: 'non_hadoop_lz4_compressed', path: 'good/non_hadoop_lz4_compressed.parquet'},
  {supportedJs: true, supportedWasm: true, title: 'alltypes_dictionary', path: 'good/alltypes_dictionary.parquet'},
  {supportedJs: true, supportedWasm: true, title: 'alltypes_plain', path: 'good/alltypes_plain.parquet'},
  {supportedJs: true, supportedWasm: true, title: 'alltypes_plain_snappy', path: 'good/alltypes_plain.snappy.parquet'},
  {supportedJs: true, supportedWasm: true, title: 'binary', path: 'good/binary.parquet'},
  // Specialized Dict for very large dictionaries: https://github.com/apache/parquet-format/blob/master/BloomFilter.md
  {supportedJs: false, supportedWasm: false, title: 'bloom_filter', path: 'good/bloom_filter.bin'},
  {supportedJs: true, supportedWasm: true, title: 'byte_array_decimal', path: 'good/byte_array_decimal.parquet'},
  {supportedJs: false, supportedWasm: false, title: 'datapage_v2', path: 'good/datapage_v2.snappy.parquet'}, // Doesn't work on parquet-tools
  {supportedJs: true, supportedWasm: false, title: 'dict', path: 'good/dict-page-offset-zero.parquet'},
  {supportedJs: true, supportedWasm: true, title: 'fixed_length_decimal', path: 'good/fixed_length_decimal.parquet'},
  {supportedJs: true, supportedWasm: true, title: 'fixed_length_decimal_legacy', path: 'good/fixed_length_decimal_legacy.parquet'},
  {supportedJs: false, supportedWasm: false, title: 'hadoop_lz4_compressed', path: 'good/hadoop_lz4_compressed.parquet'},
  {supportedJs: false, supportedWasm: false, title: 'hadoop_lz4_compressed_larger', path: 'good/hadoop_lz4_compressed_larger.parquet'},
  {supportedJs: true, supportedWasm: true, title: 'int32_decimal', path: 'good/int32_decimal.parquet'},
  {supportedJs: true, supportedWasm: true, title: 'int64_decimal', path: 'good/int64_decimal.parquet'},
  {supportedJs: true, supportedWasm: false, title: 'list_columns', path: 'good/list_columns.parquet'},
  {supportedJs: true, supportedWasm: false, title: 'nation', path: 'good/nation.dict-malformed.parquet'}, // Partially works, issue with indices for dictionary values.
  {supportedJs: true, supportedWasm: false, title: 'nested_lists', path: 'good/nested_lists.snappy.parquet'},
  {supportedJs: true, supportedWasm: false, title: 'nested_maps', path: 'good/nested_maps.snappy.parquet'},
  {supportedJs: false, supportedWasm: false, title: 'nested_structs', path: 'good/nested_structs.rust.parquet'},
  {supportedJs: true, supportedWasm: false, title: 'nonnullable', path: 'good/nonnullable.impala.parquet'},
  {supportedJs: true, supportedWasm: false, title: 'nullable', path: 'good/nullable.impala.parquet'},
  {supportedJs: true, supportedWasm: false, title: 'nulls', path: 'good/nulls.snappy.parquet'},
  {supportedJs: true, supportedWasm: false, title: 'repeated_no_annotation', path: 'good/repeated_no_annotation.parquet'},
  {supportedJs: false, supportedWasm: true, title: 'single_nan', path: 'good/single_nan.parquet'},

  {supportedJs: false, supportedWasm: true, title: 'data_index_bloom_encoding_stats', path: 'good/data_index_bloom_encoding_stats.parquet'},
  {supportedJs: false, supportedWasm: false, title: 'delta_binary_packed', path: 'good/delta_binary_packed.parquet'},
  {supportedJs: false, supportedWasm: false, title: 'delta_byte_array', path: 'good/delta_byte_array.parquet'},
  {supportedJs: false, supportedWasm: false, title: 'delta_encoding_optional_column', path: 'good/delta_encoding_optional_column.parquet'},
  {supportedJs: false, supportedWasm: false, title: 'delta_encoding_required_column', path: 'good/delta_encoding_required_column.parquet'},

  // Encrypted
  {supportedJs: false, encrypted: true, supportedWasm: false, title: 'uniform_encryption', path: 'good/uniform_encryption.parquet.encrypted'},
  {supportedJs: false, encrypted: true, supportedWasm: false, title: 'encrypt_columns_and_footer', path: 'encrypted/encrypt_columns_and_footer.parquet.encrypted'},
  {supportedJs: false, encrypted: true, supportedWasm: false, title: 'encrypt_columns_and_footer_aad', path: 'encrypted/encrypt_columns_and_footer_aad.parquet.encrypted'},
  {supportedJs: false, encrypted: true, supportedWasm: false, title: 'encrypt_columns_and_footer_ctr', path: 'encrypted/encrypt_columns_and_footer_ctr.parquet.encrypted'},
  {supportedJs: false, encrypted: true, supportedWasm: false, title: 'encrypt_columns_and_footer_disable_aad_storage', path: 'encrypted/encrypt_columns_and_footer_disable_aad_storage.parquet.encrypted'},
  {supportedJs: false, encrypted: true,  supportedWasm: false, title: 'encrypt_columns_plaintext_footer', path: 'encrypted/encrypt_columns_plaintext_footer.parquet.encrypted'},

  // Illegal
  {supportedJs: false, bad: true, title: 'PARQUET-1481', path: 'illegal/PARQUET-1481.parquet'},
];

export const SUPPORTED_FILES = PARQUET_FILES.filter(file => file.supportedJs);
export const UNSUPPORTED_FILES = PARQUET_FILES.filter(file => !file.supportedJs && !file.encrypted && !file.bad);
export const ENCRYPTED_FILES = PARQUET_FILES.filter(file => !file.supportedJs && file.encrypted);
export const BAD_FILES = PARQUET_FILES.filter(file => file.bad)

export const WASM_SUPPORTED_FILES = PARQUET_FILES.filter(file => file.supportedWasm);
