// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {TaskRunner, type Task, type TaskWorker} from '@math.gl/tasks';
import type {ArrowTable} from '@loaders.gl/core/schema';
import {
  deserializeArrowWorkerTable,
  serializeArrowWorkerResult,
  serializeArrowWorkerTable
} from '../arrow-worker-transport';
import {queryArrowTable, type ArrowQueryOptions} from './query-arrow-table';

type QueryInput =
  | {
      operation: 'query';
      options: Omit<ArrowQueryOptions, 'signal' | 'tables'>;
      tables?: [string, unknown][];
    }
  | {operation: 'get' | 'take'};

/** Configuration for the worker that runs Arrow table queries. */
export type ArrowQueryWorkerOptions = {
  /** Worker module URL or browser worker factory. */
  worker: Pick<TaskWorker, 'url' | 'create'>;
  /** Copy the source by default. Transfer detaches all referenced buffers, including aliases. */
  inputOwnership?: 'copy' | 'transfer';
  /** Cancels initialization. */
  signal?: AbortSignal;
};

/** A worker that retains one source table across calls. */
export type ArrowQueryWorkerSession = {
  /** Executes a query against the retained table. */
  query(options?: ArrowQueryOptions): Promise<ArrowTable>;
  /** Returns a copy of the retained table. The session remains open. */
  getTable(): Promise<ArrowTable>;
  /** Transfers the retained table back and closes the session. */
  takeTable(): Promise<ArrowTable>;
  /** Drains pending operations and releases the worker. */
  close(): Promise<void>;
};

/** Runs one query in a worker and releases it when the query settles. */
export async function queryArrowTableInWorker(
  source: ArrowTable,
  options: ArrowQueryOptions,
  workerOptions: ArrowQueryWorkerOptions
): Promise<ArrowTable> {
  const session = await createArrowQueryWorker(source, {
    ...workerOptions,
    signal: options.signal ?? workerOptions.signal
  });
  try {
    return await session.query(options);
  } finally {
    await session.close();
  }
}

/** Opens a worker session and sends the source table once. */
export async function createArrowQueryWorker(
  source: ArrowTable,
  {worker, inputOwnership, signal}: ArrowQueryWorkerOptions
): Promise<ArrowQueryWorkerSession> {
  signal?.throwIfAborted();
  const runner = new TaskRunner();
  try {
    const task = await runner.initializeTask(
      createArrowQueryTask({...worker, capabilities: {atomic: true, streaming: false}}),
      {table: serializeArrowWorkerResult(source, {workerTransferBufferCopy: 'none'})},
      {execution: 'worker', inputOwnership, signal}
    );
    let closing = false;
    /** Rejects operations submitted after session shutdown has started. */
    function assertOpen(): void {
      if (closing) throw new Error('Arrow query worker session is closed');
    }
    return {
      async query({signal: querySignal, tables, ...options} = {}) {
        assertOpen();
        querySignal?.throwIfAborted();
        const childTables =
          tables &&
          Object.entries(tables).map(([name, table]): [string, unknown] => [
            name,
            serializeArrowWorkerResult(table, {workerTransferBufferCopy: 'none'})
          ]);
        const result = await task.runTask(
          {operation: 'query', options, tables: childTables},
          {signal: querySignal}
        );
        return deserializeArrowWorkerTable(result.table);
      },
      async getTable() {
        assertOpen();
        const result = await task.runTask({operation: 'get'});
        return deserializeArrowWorkerTable(result.table);
      },
      async takeTable() {
        assertOpen();
        closing = true;
        try {
          const result = await task.runTask({operation: 'take'});
          return deserializeArrowWorkerTable(result.table);
        } finally {
          await runner.close();
        }
      },
      close() {
        closing = true;
        return runner.close();
      }
    };
  } catch (error) {
    await runner.close();
    throw error;
  }
}

/** Defines the shared host and worker task for the Arrow query engine. */
export function createArrowQueryTask(worker?: TaskWorker): Task<{
  initialization: {table: unknown};
  input: QueryInput;
  output: {table: unknown};
  state: ArrowTable;
}> {
  return {
    id: 'loaders.gl-arrow-query',
    worker,
    initialize: ({table}) => deserializeArrowWorkerTable(table),
    process(input, _options, {state, signal}) {
      let result = state;
      if (input.operation === 'query') {
        const tables =
          input.tables &&
          Object.fromEntries(
            input.tables.map(([name, table]) => [name, deserializeArrowWorkerTable(table)])
          );
        result = queryArrowTable(state, {...input.options, tables, signal});
      }
      return {
        // Query results can alias the retained source, including through slices and dictionaries.
        table:
          input.operation === 'take'
            ? serializeArrowWorkerResult(result, {workerTransferBufferCopy: 'none'})
            : serializeArrowWorkerTable(result)
      };
    }
  };
}
