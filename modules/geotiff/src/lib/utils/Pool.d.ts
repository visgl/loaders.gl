/** eslint-disable */
import type { FileDirectory } from 'geotiff';
/**
 * Pool for workers to decode chunks of the images.
 * This is a line-for-line copy of GeoTIFFs old implementation: https://github.com/geotiffjs/geotiff.js/blob/v1.0.0-beta.6/src/pool.js
 */
export default class Pool {
    workers: Worker[];
    idleWorkers: Worker[];
    waitQueue: any[];
    decoder: null;
    /**
     * @constructor
     * @param {Number} size The size of the pool. Defaults to the number of CPUs
     *                      available. When this parameter is `null` or 0, then the
     *                      decoding will be done in the main thread.
     */
    constructor(size?: number);
    /**
     * Decode the given block of bytes with the set compression method.
     * @param {ArrayBuffer} buffer the array buffer of bytes to decode.
     * @returns {Promise.<ArrayBuffer>} the decoded result as a `Promise`
     */
    decode(fileDirectory: FileDirectory, buffer: ArrayBuffer): Promise<unknown>;
    waitForWorker(): Promise<Worker>;
    finishTask(currentWorker: Worker): Promise<void>;
    destroy(): void;
}
