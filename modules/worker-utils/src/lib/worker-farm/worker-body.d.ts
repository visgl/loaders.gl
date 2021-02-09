import {WorkerMessageType, WorkerMessagePayload} from '../worker-protocol/protocol';

/**
 *
 */
export default class WorkerBody {
  static set onmessage(onMessage: (type: WorkerMessageType, payload: WorkerMessagePayload) => any);

  /**
   * Send a message from a worker to creating thread (main thread)
   * @param type
   * @param payload
   */
  static postMessage(type: WorkerMessageType, payload: WorkerMessagePayload): void;

  static addEventListener(onMessage: (type: WorkerMessageType, payload: WorkerMessagePayload) => any);
  static removeEventListener(onMessage: (type: WorkerMessageType, payload: WorkerMessagePayload) => any);
}
