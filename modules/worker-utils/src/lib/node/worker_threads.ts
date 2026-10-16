// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as WorkerThreads from 'worker_threads';
export {
  markAsUntransferable,
  isMarkedAsUntransferable,
  markAsUncloneable,
  moveMessagePortToContext,
  receiveMessageOnPort,
  getEnvironmentData,
  setEnvironmentData,
  postMessageToThread,
  isMainThread,
  resourceLimits,
  SHARE_ENV,
  threadId,
  workerData,
  Worker,
  BroadcastChannel,
  MessageChannel,
  MessagePort
} from 'worker_threads';
export type {
  WorkerPerformance,
  TransferListItem,
  WorkerOptions,
  ResourceLimits,
  WorkerEventMap,
  Serializable,
  LockMode,
  Transferable,
  LockGrantedCallback,
  LockInfo,
  LockManagerSnapshot,
  LockOptions,
  StructuredSerializeOptions,
  BroadcastChannelEventMap,
  Lock,
  LockManager,
  MessagePortEventMap
} from 'worker_threads';
export const parentPort = WorkerThreads?.parentPort;
export const NodeWorker = WorkerThreads.Worker;
export type NodeWorkerType = WorkerThreads.Worker;

/** Optional Node.js worker API, available on runtimes that provide it. */
export const isInternalThread = WorkerThreads.isInternalThread;

/** Optional Node.js worker API, available on runtimes that provide it. */
export const threadName = WorkerThreads.threadName;

/** Optional Node.js worker API, available on runtimes that provide it. */
export const locks = WorkerThreads.locks;

/** Optional Node.js worker API, available on runtimes that provide it. */
export const structuredClone = WorkerThreads.structuredClone;
