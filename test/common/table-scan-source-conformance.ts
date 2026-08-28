// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';

import type {
  ScanExecutionTelemetry,
  TableScanReadOptions,
  TableScanSource
} from '@loaders.gl/loader-utils';
import type {TableBatch} from '@loaders.gl/schema';
import {convertBatch} from '@loaders.gl/schema-utils';
import {parseSQLPredicate, type SQLPredicate} from '@loaders.gl/sql';

/** One independently disposable source used by the portable scan conformance kit. */
export type TableScanConformanceFixture = Readonly<{
  /** Source under test. */
  source: TableScanSource<TableBatch, SQLPredicate>;
  /** Releases source-owned resources after one case. */
  close?: () => void | Promise<void>;
}>;

/** Options used to register one source implementation with the portable scan conformance kit. */
export type TableScanConformanceOptions = Readonly<{
  /** User-facing implementation name included in every test title. */
  name: string;
  /** Creates a fresh deterministic three-row source for each case. */
  createFixture: () => TableScanConformanceFixture | Promise<TableScanConformanceFixture>;
}>;

/**
 * Registers portable discovery, predicate, projection, limit, cancellation, and telemetry cases.
 *
 * The fixture must expose `name` and `score` columns containing `one/1`, `two/2`, and `three/3` in
 * that order. Format-specific pruning belongs in the owning package rather than this common kit.
 */
export function describeTableScanSourceConformance(options: TableScanConformanceOptions): void {
  describe(`${options.name} table scan conformance`, () => {
    test('discovers a serializable executable schema', async () => {
      await withFixture(options, async ({source}) => {
        const metadata = await source.getQueryMetadata();
        expect(metadata.execution).toEqual({status: 'supported', method: 'read'});
        expect(metadata.columns.map(column => column.name)).toEqual(['name', 'score']);
        expect(() => JSON.stringify(metadata)).not.toThrow();
        expect(source.explain).toBeTypeOf('function');
        const explanation = await source.explain?.({
          predicate: parseSQLPredicate('score >= 2'),
          columns: ['name'],
          limit: 1
        });
        expect(explanation).toMatchObject({
          outputColumns: ['name'],
          predicateColumns: ['score']
        });
        expect(() => JSON.stringify(explanation)).not.toThrow();
      });
    });

    test('filters on a non-output column before projection and limit', async () => {
      await withFixture(options, async ({source}) => {
        const rows = await collectRows(source, {
          predicate: parseSQLPredicate('score >= 2'),
          columns: ['name'],
          limit: 1
        });
        expect(rows).toEqual([{name: 'two'}]);
      });
    });

    test('reports a serializable terminal telemetry snapshot', async () => {
      await withFixture(options, async ({source}) => {
        let telemetry: ScanExecutionTelemetry | undefined;
        expect(
          await collectRows(source, {
            limit: 0,
            onTelemetry: value => {
              telemetry = value;
            }
          })
        ).toEqual([]);
        expect(telemetry).toMatchObject({
          status: 'early-terminated',
          earlyTerminationReason: 'limit',
          sourcesPlanned: 1,
          sourcesRead: 0,
          rowsReturned: 0
        });
        expect(() => JSON.stringify(telemetry)).not.toThrow();
      });
    });

    test('isolates telemetry observer failures from scan results', async () => {
      await withFixture(options, async ({source}) => {
        await expect(
          collectRows(source, {
            onTelemetry: () => {
              throw new Error('telemetry exporter unavailable');
            }
          })
        ).resolves.toEqual([
          {name: 'one', score: 1},
          {name: 'two', score: 2},
          {name: 'three', score: 3}
        ]);
      });
    });

    test('honors cancellation before physical work begins', async () => {
      await withFixture(options, async ({source}) => {
        const abortController = new AbortController();
        abortController.abort(new DOMException('Conformance cancellation', 'AbortError'));
        await expect(collectRows(source, {signal: abortController.signal})).rejects.toThrow();
      });
    });
  });
}

/** Executes one case with a fresh fixture and guaranteed resource cleanup. */
async function withFixture(
  options: TableScanConformanceOptions,
  callback: (fixture: TableScanConformanceFixture) => void | Promise<void>
): Promise<void> {
  const fixture = await options.createFixture();
  try {
    await callback(fixture);
  } finally {
    await fixture.close?.();
  }
}

/** Materializes only the bounded rows produced by one conformance query. */
async function collectRows(
  source: TableScanSource<TableBatch, SQLPredicate>,
  options: TableScanReadOptions<SQLPredicate>
): Promise<Record<string, unknown>[]> {
  const rows: Record<string, unknown>[] = [];
  for await (const batch of source.read(options)) {
    const arrowBatch = convertBatch(batch, 'arrow-table');
    rows.push(...arrowBatch.data.toArray().map(row => row.toJSON()));
  }
  return rows;
}
