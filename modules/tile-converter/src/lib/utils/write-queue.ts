import {Queue} from './queue';
import process from 'process';
import {ConversionDump} from './conversion-dump';

/** Memory limit size is based on testing */
const MEMORY_LIMIT = 4 * 1024 * 1024 * 1024; // 4GB

export type WriteQueueItem = {
  archiveKey?: string;
  sourceId?: string;
  outputId?: number;
  resourceType?: string;
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
  private conversionDump: ConversionDump;
  public writePromise: Promise<void> | null = null;
  public fileMap: {[key: string]: string} = {};
  public listeningInterval: number;
  public writeConcurrency: number;

  constructor(
    conversionDump: ConversionDump,
    listeningInterval: number = 2000,
    writeConcurrency: number = 400
  ) {
    super();
    this.conversionDump = conversionDump;
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
      const changedRecords: {outputId?: number; sourceId?: string; resourceType?: string}[] = [];
      for (let i = 0; i < this.writeConcurrency; i++) {
        const item = this.dequeue();
        if (!item) {
          break;
        }
        const {archiveKey, sourceId, outputId, resourceType, writePromise} = item as WriteQueueItem;
        archiveKeys.push(archiveKey);
        changedRecords.push({sourceId, outputId, resourceType});
        const promise = writePromise();
        promises.push(promise);
      }
      const writeResults = await Promise.allSettled(promises);
      this.updateFileMap(archiveKeys, writeResults);
      this.conversionDump.updateConvertedTilesDump(changedRecords, writeResults);
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
}
