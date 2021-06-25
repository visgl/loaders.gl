import type {WorkerMessageData, WorkerMessageType, WorkerMessagePayload} from '../../types';
import {getTransferList} from '../worker-utils/get-transfer-list';

const onMessageWrapperMap = new Map();

/**
 * Type safe wrapper for worker code
 */
export default class WorkerBody {
  /*
   * (type: WorkerMessageType, payload: WorkerMessagePayload) => any
   */
  static set onmessage(onMessage: (type: WorkerMessageType, payload: WorkerMessagePayload) => any) {
    // eslint-disable-next-line no-restricted-globals
    self.onmessage = (message) => {
      if (!isKnownMessage(message)) {
        return;
      }

      // Confusingly the message itself also has a 'type' field which is always set to 'message'
      const {type, payload} = message.data;
      onMessage(type, payload);
    };
  }

  static addEventListener(
    onMessage: (type: WorkerMessageType, payload: WorkerMessagePayload) => any
  ) {
    let onMessageWrapper = onMessageWrapperMap.get(onMessage);

    if (!onMessageWrapper) {
      onMessageWrapper = (message) => {
        if (!isKnownMessage(message)) {
          return;
        }

        // Confusingly the message itself also has a 'type' field which is always set to 'message'
        const {type, payload} = message.data;
        onMessage(type, payload);
      };
    }

    // eslint-disable-next-line no-restricted-globals
    self.addEventListener('message', onMessageWrapper);
  }

  static removeEventListener(
    onMessage: (type: WorkerMessageType, payload: WorkerMessagePayload) => any
  ) {
    const onMessageWrapper = onMessageWrapperMap.get(onMessage);
    onMessageWrapperMap.delete(onMessage);
    // eslint-disable-next-line no-restricted-globals
    self.removeEventListener('message', onMessageWrapper);
  }

  /**
   * Send a message from a worker to creating thread (main thread)
   * @param type
   * @param payload
   */
  static postMessage(type: WorkerMessageType, payload: WorkerMessagePayload): void {
    if (self) {
      const data: WorkerMessageData = {source: 'loaders.gl', type, payload};
      const transferList = getTransferList(payload);
      // eslint-disable-next-line no-restricted-globals
      // @ts-ignore
      self.postMessage(data, transferList);
    }
  }
}

// Filter out noise messages sent to workers
function isKnownMessage(message) {
  const {type, data} = message;
  return (
    type === 'message' &&
    data &&
    typeof data.source === 'string' &&
    data.source.startsWith('loaders.gl')
  );
}
