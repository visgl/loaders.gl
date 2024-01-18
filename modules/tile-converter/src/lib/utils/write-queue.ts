import {isMap} from 'util/types';
import {Queue} from './queue';
import process from 'process';

/** Memory limit size is based on testing */
const MEMORY_LIMIT = 4 * 1024 * 1024 * 1024; // 4GB

export type WriteQueueItem = {
  archiveKey?: string;
  convertedTileDumpMap?: any;
  /**
   * writePromise() returns a Promise that will be awaited in Promise.allSettled(promises);
   * Arguments for this call are specified in writeQueue.enqueue call like this:
   * await writeQueue.enqueue({
   *     archiveKey: `nodePages/xxx.json.gz`,
   *     writePromise: () => writeFileForSlpk(slpkPath, data, `xxx.json`)
   * });
   * Note, a function like writeFileForSlpk should NOT be called when initializing the object for enqueue().
   * If he function is called, the promise will be created
   * and the function will allocate resources (file descriptors) for file writing.
   * It will be done for ALL items in the queue, which is not supposed to happen.
   * That's why the function should be passed as
   *   writePromise: () => writeFileForSlpk(slpkPath, content, `xxx.json`)
   * instead of
   *  writePromise: writeFileForSlpk(slpkPath, content, `xxx.json`) // INCORRECT !
   */
  writePromise: () => Promise<string | null>;
};

export default class WriteQueue<T extends WriteQueueItem> extends Queue<T> {
  private intervalId?: NodeJS.Timeout;
  public writePromise: Promise<void> | null = null;
  public writeDumpFile: (() => void) | undefined;
  public fileMap: {[key: string]: string} = {};
  public listeningInterval: number;
  public writeConcurrency: number;

  constructor(listeningInterval: number = 2000, writeConcurrency: number = 400) {
    super();
    this.listeningInterval = listeningInterval;
    this.writeConcurrency = writeConcurrency;
  }

  async enqueue(val: T, writeImmediately: boolean = false) {
    if (writeImmediately) {
      const {archiveKey, writePromise} = val as WriteQueueItem;
      const result = await writePromise();
      if (archiveKey && result) {
        this.fileMap[archiveKey] = result;
      }
    } else {
      super.enqueue(val);
      /** https://nodejs.org/docs/latest-v14.x/api/process.html#process_process_memoryusage */
      if (process.memoryUsage().rss > MEMORY_LIMIT) {
        await this.startWrite();
      }
    }
  }

  startListening() {
    this.intervalId = setInterval(this.startWrite.bind(this), this.listeningInterval);
  }

  stopListening() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  async startWrite(): Promise<void> {
    if (!this.writePromise) {
      this.writePromise = this.doWrite();
    }
    await this.writePromise;
    this.writePromise = null;
  }

  async finalize(): Promise<void> {
    this.stopListening();
    await this.startWrite();
  }

  private async doWrite(): Promise<void> {
    while (this.length) {
      const promises: Promise<string | null>[] = [];
      const archiveKeys: (string | undefined)[] = [];
      const convertedTileDumpMaps: any[] = [];
      for (let i = 0; i < this.writeConcurrency; i++) {
        const item = this.dequeue();
        if (!item) {
          break;
        }
        const {archiveKey, convertedTileDumpMap, writePromise} = item as WriteQueueItem;
        archiveKeys.push(archiveKey);
        convertedTileDumpMaps.push(convertedTileDumpMap);
        const promise = writePromise();
        promises.push(promise);
      }
      const writeResults = await Promise.allSettled(promises);
      this.updateFileMap(archiveKeys, writeResults);
      this.updateConvertedTilesMap(convertedTileDumpMaps, writeResults);
    }
  }

  private updateFileMap(
    archiveKeys: (string | undefined)[],
    writeResults: PromiseSettledResult<string | null>[]
  ) {
    for (let i = 0; i < archiveKeys.length; i++) {
      const archiveKey = archiveKeys[i];
      if (archiveKey && 'value' in writeResults[i]) {
        this.fileMap[archiveKey] = (writeResults[i] as PromiseFulfilledResult<string>).value;
      }
    }
  }

  private updateConvertedTilesMap(
    convertedTileDumpMaps: any[],
    writeResults: PromiseSettledResult<string | null>[]
  ) {
    for (let i = 0; i < convertedTileDumpMaps.length; i++) {
      if (convertedTileDumpMaps[i] && 'value' in writeResults[i]) {
        const {dumpTileRecord} = convertedTileDumpMaps[i];
        for (const node of dumpTileRecord.nodes) {
          if (node.nodeId === convertedTileDumpMaps[i].nodeId) {
            node.done.set(convertedTileDumpMaps[i].resourceType, true);
          }
          if (isMap(node.done)) {
            let done = false;
            for (const [_, value] of node.done) {
              done = value;
              if (!done) break;
            }
            if (done) {
              delete node.done;
              node.done = true;
            }
          }
        }
      }
    }
    if (this.writeDumpFile) {
      this.writeDumpFile();
    }
  }
}
