// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {beforeAll, describe, expect, test} from 'vitest';

import {encode} from '@loaders.gl/core';
import {ParquetJSWriter} from '@loaders.gl/parquet';
import {
  ParquetDatasetSource,
  type ParquetDatasetFileQuery
} from '@loaders.gl/parquet/parquet-dataset-source';
import type {ObjectRowTable} from '@loaders.gl/schema';

let westernFile: Blob;
let easternFile: Blob;
let incompatibleFile: Blob;

beforeAll(async () => {
  [westernFile, easternFile, incompatibleFile] = await Promise.all([
    createFixture([
      {id: 1, value: 'west-one'},
      {id: 2, value: 'west-two'}
    ]),
    createFixture([
      {id: 3, value: 'east-one'},
      {id: 4, value: 'east-two'}
    ]),
    createFixture([{id: 5, value: 50}], 'int32')
  ]);
});

describe('ParquetDatasetSource', () => {
  test('reads files in provider order with dataset provenance', async () => {
    const source = new ParquetDatasetSource(
      [
        {data: westernFile, id: 'west', partitions: {theme: 'buildings'}},
        {data: easternFile, id: 'east', partitions: {theme: 'places'}}
      ],
      {core: {worker: false}, parquetDataset: {fileConcurrency: 2}}
    );

    const batches = await collectBatches(source.read({batchSize: 1}));

    expect(batches.map(batch => batch.datasetFileId)).toEqual(['west', 'west', 'east', 'east']);
    expect(batches.map(batch => batch.datasetFileIndex)).toEqual([0, 0, 1, 1]);
    expect(batches.map(batch => batch.datasetPartitions?.theme)).toEqual([
      'buildings',
      'buildings',
      'places',
      'places'
    ]);
    expect(batches.flatMap(batch => [...batch.data.getChild('id')!.toArray()])).toEqual([
      1, 2, 3, 4
    ]);
    expect(source.getTelemetry()).toMatchObject({
      filesDiscovered: 2,
      filesSelected: 2,
      filesOpened: 2,
      batchesEmitted: 4,
      rowsEmitted: 4
    });
    expect(source.getTelemetry().parquet.rowsEmitted).toBe(4);
    expect(Object.isFrozen(source.getTelemetry())).toBe(true);
    expect(Object.isFrozen(source.getTelemetry().parquet)).toBe(true);
    await source.close();
  });

  test('emits the first file while lazy discovery of later files is blocked', async () => {
    let releaseDiscovery: (() => void) | undefined;
    const discoveryBlocked = new Promise<void>(resolve => {
      releaseDiscovery = resolve;
    });
    const source = new ParquetDatasetSource(
      async function* () {
        yield {data: westernFile, id: 'first'};
        await discoveryBlocked;
        yield {data: easternFile, id: 'second'};
      },
      {core: {worker: false}, parquetDataset: {fileConcurrency: 2}}
    );
    const iterator = source.read()[Symbol.asyncIterator]();

    const first = await Promise.race([
      iterator.next(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('first batch waited for later discovery')), 1000)
      )
    ]);
    expect(first.value?.datasetFileId).toBe('first');

    releaseDiscovery?.();
    const remaining = await collectBatches({[Symbol.asyncIterator]: () => iterator});
    expect(remaining.map(batch => batch.datasetFileId)).toEqual(['second']);
    await source.close();
  });

  test('passes discovery constraints to providers and conservatively prunes descriptors', async () => {
    let providerQuery: ParquetDatasetFileQuery | undefined;
    const source = new ParquetDatasetSource(
      query => {
        providerQuery = query;
        return [
          {
            data: westernFile,
            id: 'west-buildings',
            bbox: [-125, 30, 0, -100, 50, 100],
            partitions: {theme: 'buildings'}
          },
          {
            data: easternFile,
            id: 'east-buildings',
            bbox: [-90, 30, -60, 50],
            partitions: {theme: 'buildings'}
          },
          {
            data: easternFile,
            id: 'east-places',
            bbox: [-90, 30, -60, 50],
            partitions: {theme: 'places'}
          },
          {data: easternFile, id: 'unknown-extent'}
        ];
      },
      {core: {worker: false}}
    );

    const batches = await collectBatches(
      source.read({bbox: [-80, 35, -70, 45], partitions: {theme: 'buildings'}})
    );

    expect(providerQuery?.bbox).toEqual([-80, 35, -70, 45]);
    expect(batches.map(batch => batch.datasetFileId)).toEqual([
      'east-buildings',
      'unknown-extent'
    ]);
    expect(source.getTelemetry()).toMatchObject({
      filesDiscovered: 4,
      filesSelected: 2,
      filesPrunedByBoundingBox: 1,
      filesPrunedByPartitions: 1,
      filesOpened: 2
    });
    await source.close();
  });

  test('prunes eight-dimensional descriptors across the antimeridian', async () => {
    const source = new ParquetDatasetSource(
      [
        {
          data: westernFile,
          id: 'antimeridian',
          bbox: [170, -20, -10, 0, -170, 20, 10, 100]
        },
        {
          data: easternFile,
          id: 'prime-meridian',
          bbox: [-10, -20, -10, 0, 10, 20, 10, 100]
        }
      ],
      {core: {worker: false}}
    );

    const batches = await collectBatches(
      source.read({bbox: [175, -5, -1, 0, -175, 5, 1, 10]})
    );

    expect(batches.map(batch => batch.datasetFileId)).toEqual(['antimeridian']);
    expect(source.getTelemetry().filesPrunedByBoundingBox).toBe(1);
    await source.close();
  });

  test('forwards Parquet projection and exact predicates to every selected file', async () => {
    const source = new ParquetDatasetSource(
      [{data: westernFile}, {data: easternFile}],
      {core: {worker: false}}
    );

    const batches = await collectBatches(
      source.read({
        columns: ['value'],
        predicate: {op: '>=', args: [{property: 'id'}, 3]}
      })
    );

    expect(batches).toHaveLength(1);
    expect(batches[0].schema?.fields.map(field => field.name)).toEqual(['value']);
    expect([...batches[0].data.getChild('value')!.toArray()]).toEqual(['east-one', 'east-two']);
    await source.close();
  });

  test('rejects incompatible file schemas by default', async () => {
    const source = new ParquetDatasetSource(
      [
        {data: westernFile, id: 'compatible'},
        {data: incompatibleFile, id: 'incompatible'}
      ],
      {core: {worker: false}, parquetDataset: {fileConcurrency: 2}}
    );

    await expect(collectBatches(source.read())).rejects.toThrow('has an incompatible schema');
    await source.close();
  });

  test('returns the first selected schema and supports explicitly heterogeneous files', async () => {
    const strictSource = new ParquetDatasetSource(
      [{data: westernFile, bbox: [-125, 30, -100, 50]}],
      {core: {worker: false}}
    );
    const schema = await strictSource.getSchema({bbox: [-120, 35, -110, 45]});
    expect(schema.fields.map(field => field.name)).toEqual(['id', 'value']);
    expect(strictSource.getTelemetry().filesOpened).toBe(1);
    await strictSource.close();

    const heterogeneousSource = new ParquetDatasetSource(
      [{data: westernFile}, {data: incompatibleFile}],
      {core: {worker: false}, parquetDataset: {validateSchema: false}}
    );
    await expect(collectBatches(heterogeneousSource.read())).resolves.toHaveLength(2);
    await heterogeneousSource.close();
  });

  test('rejects empty selections, invalid descriptors, and invalid concurrency', async () => {
    const emptySource = new ParquetDatasetSource([]);
    await expect(emptySource.getSchema()).rejects.toThrow('selected no files');

    const invalidDescriptorSource = new ParquetDatasetSource([
      {data: 42 as unknown as string}
    ]);
    await expect(collectBatches(invalidDescriptorSource.read())).rejects.toThrow(
      'Invalid Parquet dataset file descriptor'
    );

    const invalidConcurrencySource = new ParquetDatasetSource([{data: westernFile}], {
      parquetDataset: {fileConcurrency: 0}
    });
    await expect(collectBatches(invalidConcurrencySource.read())).rejects.toThrow(
      'fileConcurrency must be a positive integer'
    );

    const oneShotFiles = (function* () {
      yield {data: westernFile};
    })();
    expect(
      () =>
        new ParquetDatasetSource(
          oneShotFiles as unknown as ConstructorParameters<typeof ParquetDatasetSource>[0]
        )
    ).toThrow('reusable descriptor array or a provider function');
  });

  test('aborts active reads when closed and rejects later operations', async () => {
    const abortController = new AbortController();
    const source = new ParquetDatasetSource(async function* (query) {
      await new Promise<void>((resolve, reject) => {
        if (query.signal?.aborted) {
          reject(query.signal.reason);
          return;
        }
        query.signal?.addEventListener('abort', () => reject(query.signal?.reason), {once: true});
      });
      yield {data: westernFile};
    });
    const read = collectBatches(source.read({signal: abortController.signal}));
    await Promise.resolve();
    abortController.abort(new DOMException('cancelled', 'AbortError'));

    await expect(read).rejects.toThrow(/cancelled|abort/i);
    await source.close();
    await expect(source.getSchema()).rejects.toThrow('ParquetDatasetSource is closed');
  });
});

/** Encodes a small deterministic Parquet file for multi-file source tests. */
async function createFixture(
  rows: Array<{id: number; value: string | number}>,
  valueType: 'utf8' | 'int32' = 'utf8'
): Promise<Blob> {
  const arrayBuffer = await encode(
    {
      shape: 'object-row-table',
      schema: {
        fields: [
          {name: 'id', type: 'int32', nullable: false},
          {name: 'value', type: valueType, nullable: false}
        ],
        metadata: {}
      },
      data: rows
    } satisfies ObjectRowTable,
    ParquetJSWriter
  );
  return new Blob([arrayBuffer]);
}

/** Collects all Arrow batches from a dataset read. */
async function collectBatches(
  batches: AsyncIterable<import('@loaders.gl/parquet').ParquetDatasetBatch>
): Promise<import('@loaders.gl/parquet').ParquetDatasetBatch[]> {
  const result: import('@loaders.gl/parquet').ParquetDatasetBatch[] = [];
  for await (const batch of batches) {
    result.push(batch);
  }
  return result;
}
