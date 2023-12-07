// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as WorkerThreads from 'worker_threads';
export * from 'worker_threads';
export const parentPort = WorkerThreads?.parentPort;
export const NodeWorker = WorkerThreads.Worker;
export type NodeWorkerType = WorkerThreads.Worker;
