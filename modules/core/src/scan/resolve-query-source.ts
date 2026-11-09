// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {validateTableReference} from '@loaders.gl/core/loader-utils';
import type {
  DataSource,
  DataSourceOptions,
  TableReference,
  TableSourceCollection
} from '@loaders.gl/core/loader-utils';

/** Resolves one literal source/table reference without inspecting unrelated source data. */
export async function resolveQuerySource(
  reference: TableReference,
  sources: readonly DataSource<unknown, DataSourceOptions>[] | undefined,
  signal?: AbortSignal
): Promise<unknown> {
  validateTableReference(reference);
  if (!Array.isArray(sources)) throw new Error('FROM requires a sources array.');
  const registry = new Map<string, DataSource<unknown, DataSourceOptions>>();
  for (const source of sources) {
    if (!source || typeof source.name !== 'string' || !source.name.trim())
      throw new Error('Registered data sources require non-empty names.');
    if (registry.has(source.name)) throw new Error(`Duplicate data source name: ${source.name}`);
    registry.set(source.name, source);
  }
  const name = typeof reference === 'string' ? reference : reference.source;
  const source = registry.get(name);
  if (!source) throw new Error(`Unknown data source: ${name}`);
  signal?.throwIfAborted();
  if (typeof reference === 'string') return source;
  const collection = source as unknown as Partial<TableSourceCollection>;
  if (typeof collection.getTable !== 'function')
    throw new Error(`Data source ${name} does not expose named tables.`);
  const table = await collection.getTable(reference.table, {signal});
  signal?.throwIfAborted();
  return table;
}
