// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Module-relative browser asset for selective Parquet source decoding. */
export const PARQUET_SOURCE_WORKER_URL = import.meta.url
  ? new URL('./parquet-source-worker.js', import.meta.url).toString()
  : true;
