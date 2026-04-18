// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Merge caller options with default parquet options while preserving top-level option bags. */
export function normalizeParquetOptions<OptionsT extends {parquet?: unknown}>(
  options: OptionsT | undefined,
  parquetDefaults: Record<string, unknown>
): OptionsT {
  return {
    ...options,
    parquet: {...parquetDefaults, ...(options?.parquet as Record<string, unknown> | undefined)}
  } as unknown as OptionsT;
}
