// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Merge caller options with default parquet options while preserving top-level option bags. */
export function normalizeParquetOptions<OptionsT extends {parquet?: unknown}>(
  options: OptionsT | undefined,
  parquetDefaults: Record<string, unknown>
): OptionsT {
  const scanOptions = (
    options as {_scan?: {columns?: readonly string[]; limit?: number}} | undefined
  )?._scan;
  const parquetOptions = (options?.parquet as Record<string, unknown> | undefined) || {};
  return {
    ...options,
    parquet: {
      ...parquetDefaults,
      ...parquetOptions,
      ...(scanOptions?.columns !== undefined ? {columns: [...scanOptions.columns]} : {}),
      ...(scanOptions?.limit !== undefined ? {limit: scanOptions.limit} : {})
    }
  } as unknown as OptionsT;
}
