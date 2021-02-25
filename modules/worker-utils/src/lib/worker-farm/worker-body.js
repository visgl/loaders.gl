/* eslint-disable no-restricted-globals */
/* global self */
/** @typedef {import('../worker-protocol/protocol').WorkerMessageData} WorkerMessageData */
/** @typedef {import('../worker-protocol/protocol').WorkerMessageType} WorkerMessageType  */
/** @typedef {import('../worker-protocol/protocol').WorkerMessagePayload} WorkerMessagePayload */
import {getTransferList} from '../worker-farm/get-transfer-list';

const onMessageWrapperMap = new Map();

/**
 * Type safe wrapper for worker code
 */
export default class WorkerBody {
  /*
   * (type: WorkerMessageType, payload: WorkerMessagePayload) => any
   */
  static set onmessage(onMessage) {
    self.onmessage = message => {
      if (!isKnownMessage(message)) {
        return;
      }

      // Confusingly the message itself also has a 'type' field which is always set to 'message'
      const {type, payload} = message.data;
      onMessage(type, payload);
    };
  }

  static addEventListener(onMessage) {
    let onMessageWrapper = onMessageWrapperMap.get(onMessage);

    if (!onMessageWrapper) {
      onMessageWrapper = message => {
        if (!isKnownMessage(message)) {
          return;
        }

        // Confusingly the message itself also has a 'type' field which is always set to 'message'
        const {type, payload} = message.data;
        onMessage(type, payload);
      };
    }

    self.addEventListener('message', onMessageWrapper);
  }

  static removeEventListener(onMessage) {
    const onMessageWrapper = onMessageWrapperMap.get(onMessage);
    onMessageWrapperMap.delete(onMessage);
    self.removeEventListener('message', onMessageWrapper);
  }

  /**
   * @param {WorkerMessageType} type;
   * @param {WorkerMessagePayload} payload
   */
  static postMessage(type, payload) {
    if (self) {
      /** @type {WorkerMessageData} */
      const data = {source: 'loaders.gl', type, payload};
      const transferList = getTransferList(payload);
      // @ts-ignore self is WorkerGlobalScope
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
