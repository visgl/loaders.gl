// Forked from https://github.com/kbajalc/parquets under MIT license (Copyright (c) 2017 ironSource Ltd.)
/**
 * Parquet File Magic String
 */
export const PARQUET_MAGIC = 'PAR1';
export const PARQUET_MAGIC_ENCRYPTED = 'PARE';

/**
 * Parquet File Format Version
 */
export const PARQUET_VERSION = 1;

/**
 * Internal type used for repetition/definition levels
 */
export const PARQUET_RDLVL_TYPE = 'INT32';
export const PARQUET_RDLVL_ENCODING = 'RLE';
