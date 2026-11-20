// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {parse} from '@loaders.gl/core';
import {Tiles3DLoader} from '@loaders.gl/tiles-3d/3d-tiles';
import type {Tiles3DTileContent} from '@loaders.gl/tiles-3d/3d-tiles';
import {TileConversionError} from '@loaders.gl/tile-converter/v5/core';
import type {BrowserTilesetConversionInspection} from './browser-tileset-source.js';
import type {NodeTilesetConversionSource} from './node-source.js';

/** Evidence accumulated for one batch-table column across the inspected contents. */
type Column = {
  /** Number of tables containing the column. */
  tableCount: number;
  /** Whether any value is null. */
  nullable: boolean;
  /** Observed homogeneous scalar type or unsupported representation. */
  type?: 'utf8' | 'int32' | 'float64' | 'unsupported';
};

/** Reads legacy batch tables under the source budgets and drafts a reviewable feature mapping. */
export async function draftLegacyFeatureSchema(
  source: NodeTilesetConversionSource,
  inspection: BrowserTilesetConversionInspection,
  signal?: AbortSignal
) {
  const columns = new Map<string, Column>();
  let tableCount = 0;
  let skippedContents = 0;
  for await (const resource of source.read(inspection, signal)) {
    signal?.throwIfAborted();
    if (new TextDecoder().decode(resource.data.subarray(0, 4)) !== 'b3dm') {
      skippedContents++;
      continue;
    }
    const tile = (await parse(resource.data, Tiles3DLoader, {
      core: {worker: false},
      '3d-tiles': {loadGLTF: false}
    })) as Tiles3DTileContent;
    const rows = tile.header?.batchLength ?? Number(tile.featureTableJson?.BATCH_LENGTH);
    if (!Number.isSafeInteger(rows) || rows < 1) {
      skippedContents++;
      continue;
    }
    tableCount++;
    for (const [name, values] of Object.entries(tile.batchTableJson ?? {})) {
      if (columns.size >= 255 && !columns.has(name))
        throw new TileConversionError(
          'SCHEMA_DRAFT_LIMIT',
          'Schema drafts support up to 255 source properties'
        );
      const column = columns.get(name) ?? {tableCount: 0, nullable: false};
      columns.set(name, column);
      column.tableCount++;
      if (!Array.isArray(values) || values.length !== rows) {
        column.type = 'unsupported';
        continue;
      }
      for (const value of values) {
        if (value === null) column.nullable = true;
        else column.type = mergeColumnType(column.type, value);
      }
    }
  }
  if (!tableCount)
    throw new TileConversionError('SCHEMA_DRAFT_EMPTY', 'No legacy B3DM feature tables found');

  const fields: {name: string; type: 'utf8' | 'int32' | 'float64'; nullable: boolean}[] = [
    {name: 'feature_id', type: 'int32', nullable: false}
  ];
  const omittedProperties: string[] = [];
  const numericNullProperties: string[] = [];
  for (const [name, column] of columns) {
    if (name === 'feature_id' || !name.trim() || !column.type || column.type === 'unsupported') {
      omittedProperties.push(name);
      continue;
    }
    const nullable = column.nullable || column.tableCount < tableCount;
    fields.push({name, type: column.type, nullable});
    if (nullable && column.type !== 'utf8') numericNullProperties.push(name);
  }
  const usedNames = new Set(['feature_id', 'objectid']);
  const fieldNames = fields.slice(1).flatMap(({name}) => {
    const stem = name.replace(/[^A-Za-z0-9_]/g, '_').replace(/^[0-9]/, digit => `_${digit}`);
    let outputName = stem || '_field';
    let suffix = 2;
    while (usedNames.has(outputName.toLowerCase())) outputName = `${stem}_${suffix++}`;
    usedNames.add(outputName.toLowerCase());
    return outputName === name ? [] : [[name, outputName] as const];
  });
  return {
    featureSchema: {
      metadataClass: 'features',
      schema: {fields},
      ...(omittedProperties.length ? {omitSourceProperties: omittedProperties} : {}),
      ...(fieldNames.length ? {i3sFieldNames: Object.fromEntries(fieldNames)} : {})
    },
    schemaDraft: {
      sampledTables: tableCount,
      skippedContents,
      omittedProperties,
      numericNullProperties
    }
  };
}

/** Combines compatible numeric observations and rejects mixed or non-scalar values. */
function mergeColumnType(type: Column['type'], value: unknown): NonNullable<Column['type']> {
  const observed =
    typeof value === 'string'
      ? 'utf8'
      : typeof value !== 'number' || !Number.isFinite(value)
        ? 'unsupported'
        : Number.isInteger(value) && value >= -2147483648 && value <= 2147483647
          ? 'int32'
          : 'float64';
  if (!type || type === observed) return observed;
  if ([type, observed].every(kind => kind === 'int32' || kind === 'float64')) return 'float64';
  return 'unsupported';
}
