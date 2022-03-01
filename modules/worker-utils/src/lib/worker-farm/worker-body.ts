import type {WorkerMessageData, WorkerMessageType, WorkerMessagePayload} from '../../types';
import {getTransferList} from '../worker-utils/get-transfer-list';

/** Vile hack to defeat over-zealous bundlers from stripping out the require */
function getParentPort() {
  // const isNode = globalThis.process;
  let parentPort;
  try {
    // prettier-ignore
    eval('globalThis.parentPort = require(\'worker_threads\').parentPort'); // eslint-disable-line no-eval
    parentPort = globalThis.parentPort;
    // eslint-disable-next-line no-empty
  } catch {}
  return parentPort;
}

const onMessageWrapperMap = new Map();

/**
 * Type safe wrapper for worker code
 */
export default class WorkerBody {
  /** Check that we are actually in a worker thread */
  static inWorkerThread(): boolean {
    return typeof self !== 'undefined' || Boolean(getParentPort());
  }

  /*
   * (type: WorkerMessageType, payload: WorkerMessagePayload) => any
   */
  static set onmessage(onMessage: (type: WorkerMessageType, payload: WorkerMessagePayload) => any) {
    function handleMessage(message) {
      // Confusingly the message itself also has a 'type' field which is always set to 'message'
      const parentPort = getParentPort();
      const {type, payload} = parentPort ? message : message.data;
      // if (!isKnownMessage(message)) {
      //   return;
      // }
      onMessage(type, payload);
    }

    const parentPort = getParentPort();
    if (parentPort) {
      parentPort.on('message', handleMessage);
      // if (message == 'exit') { parentPort.unref(); }
      // eslint-disable-next-line
      parentPort.on('exit', () => console.debug('Node worker closing'));
    } else {
      // eslint-disable-next-line no-restricted-globals
      globalThis.onmessage = handleMessage;
    }
  }

  static addEventListener(
    onMessage: (type: WorkerMessageType, payload: WorkerMessagePayload) => any
  ) {
    let onMessageWrapper = onMessageWrapperMap.get(onMessage);

    if (!onMessageWrapper) {
      onMessageWrapper = (message: MessageEvent<any>) => {
        if (!isKnownMessage(message)) {
          return;
        }

        // Confusingly in the browser, the message itself also has a 'type' field which is always set to 'message'
        const parentPort = getParentPort();
        const {type, payload} = parentPort ? message : message.data;
        onMessage(type, payload);
      };
    }

    const parentPort = getParentPort();
    if (parentPort) {
      console.error('not implemented'); // eslint-disable-line
    } else {
      globalThis.addEventListener('message', onMessageWrapper);
    }
  }

  static removeEventListener(
    onMessage: (type: WorkerMessageType, payload: WorkerMessagePayload) => any
  ) {
    const onMessageWrapper = onMessageWrapperMap.get(onMessage);
    onMessageWrapperMap.delete(onMessage);
    const parentPort = getParentPort();
    if (parentPort) {
      console.error('not implemented'); // eslint-disable-line
    } else {
      globalThis.removeEventListener('message', onMessageWrapper);
    }
  }

  /**
   * Send a message from a worker to creating thread (main thread)
   * @param type
   * @param payload
   */
  static postMessage(type: WorkerMessageType, payload: WorkerMessagePayload): void {
    const data: WorkerMessageData = {source: 'loaders.gl', type, payload};
    // console.log('posting message', data);
    const transferList = getTransferList(payload);

    const parentPort = getParentPort();
    if (parentPort) {
      parentPort.postMessage(data, transferList);
      // console.log('posted message', data);
    } else {
      // @ts-ignore
      globalThis.postMessage(data, transferList);
    }
  }
}

// Filter out noise messages sent to workers
function isKnownMessage(message: MessageEvent<any>) {
  const {type, data} = message;
  return (
    type === 'message' &&
    data &&
    typeof data.source === 'string' &&
    data.source.startsWith('loaders.gl')
  );
}
