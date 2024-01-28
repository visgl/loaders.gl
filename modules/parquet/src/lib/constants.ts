// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
export const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';
export const PARQUET_WASM_URL = 'https://unpkg.com/parquet-wasm@0.6.0-beta.1/esm/arrow1_bg.wasm';

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
