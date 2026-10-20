// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {WorkerMessageData, WorkerMessageType, WorkerMessagePayload} from '../../types';
import {getTransferList} from '../worker-utils/get-transfer-list';
// import type {TransferListItem} from '../node/worker_threads';
import {parentPort} from '../node/worker_threads';

type TransferListItem = any;
type WorkerMessageEvent = MessageEvent<WorkerMessageData> | WorkerMessageData;
type WorkerMessageListener = (type: WorkerMessageType, payload: WorkerMessagePayload) => any;

/** Vile hack to defeat over-zealous bundlers from stripping out the require */
async function getParentPort() {
  // const isNode = globalThis.process;
  // let parentPort;
  // try {
  //   // biome-ignore format: preserve intentional fixture layout
  //   eval('globalThis.parentPort = require(\'worker_threads\').parentPort'); // eslint-disable-line no-eval
  //   parentPort = globalThis.parentPort;
  // } catch {
  //   try {
  //     // biome-ignore format: preserve intentional fixture layout
  //     eval('globalThis.workerThreadsPromise = import(\'worker_threads\')'); // eslint-disable-line no-eval
  //     const workerThreads = await globalThis.workerThreadsPromise;
  //     parentPort = workerThreads.parentPort;
  //   } catch (error) {
  //     console.error((error as Error).message); // eslint-disable-line no-console
  //   }
  // }
  return parentPort;
}

const onMessageWrapperMap = new Map<WorkerMessageListener, (message: WorkerMessageEvent) => void>();

/**
 * Type safe wrapper for worker code
 */
export default class WorkerBody {
  /** Check that we are actually in a worker thread */
  static async inWorkerThread(): Promise<boolean> {
    return typeof self !== 'undefined' || Boolean(await getParentPort());
  }

  /*
   * (type: WorkerMessageType, payload: WorkerMessagePayload) => any
   */
  static set onmessage(onMessage: (type: WorkerMessageType, payload: WorkerMessagePayload) => any) {
    async function handleMessage(message) {
      const parentPort = await getParentPort();
      // Confusingly the message itself also has a 'type' field which is always set to 'message'
      const {type, payload} = parentPort ? message : message.data;
      // if (!isKnownMessage(message)) {
      //   return;
      // }
      onMessage(type, payload);
    }

    getParentPort().then(parentPort => {
      if (parentPort) {
        parentPort.on('message', message => {
          handleMessage(message);
        });
        // if (message == 'exit') { parentPort.unref(); }
        // eslint-disable-next-line
        parentPort.on('exit', () => console.debug('Node worker closing'));
      } else {
        // eslint-disable-next-line no-restricted-globals
        globalThis.onmessage = handleMessage;
      }
    });
  }

  static async addEventListener(onMessage: WorkerMessageListener) {
    let onMessageWrapper = onMessageWrapperMap.get(onMessage);

    if (!onMessageWrapper) {
      onMessageWrapper = (message: WorkerMessageEvent) => {
        const messageData = getWorkerMessageData(message);
        if (!messageData) {
          return;
        }
        onMessage(messageData.type, messageData.payload);
      };
      onMessageWrapperMap.set(onMessage, onMessageWrapper);
    }

    const parentPort = await getParentPort();
    if (parentPort) {
      parentPort.on('message', onMessageWrapper);
    } else {
      globalThis.addEventListener('message', onMessageWrapper);
    }
  }

  static async removeEventListener(onMessage: WorkerMessageListener) {
    const onMessageWrapper = onMessageWrapperMap.get(onMessage);
    onMessageWrapperMap.delete(onMessage);
    if (!onMessageWrapper) {
      return;
    }
    const parentPort = await getParentPort();
    if (parentPort) {
      parentPort.off('message', onMessageWrapper);
    } else {
      globalThis.removeEventListener('message', onMessageWrapper);
    }
  }

  /**
   * Send a message from a worker to creating thread (main thread)
   * @param type
   * @param payload
   */
  static async postMessage(type: WorkerMessageType, payload: WorkerMessagePayload): Promise<void> {
    const data: WorkerMessageData = {source: 'loaders.gl', type, payload};
    // console.log('posting message', data);

    // Cast to Node compatible transfer list
    const transferList = getTransferList(payload) as TransferListItem[];

    const parentPort = await getParentPort();
    if (parentPort) {
      parentPort.postMessage(data, transferList);
      // console.log('posted message', data);
    } else {
      // @ts-expect-error Outside of worker scopes this call has a third parameter
      globalThis.postMessage(data, transferList);
    }
  }
}

// Filter out noise messages sent to workers
function getWorkerMessageData(message: WorkerMessageEvent): WorkerMessageData | null {
  if (!message || typeof message !== 'object') {
    return null;
  }
  const messageData = 'data' in message && message.type === 'message' ? message.data : message;
  return messageData &&
    typeof messageData.source === 'string' &&
    messageData.source.startsWith('loaders.gl')
    ? messageData
    : null;
}
