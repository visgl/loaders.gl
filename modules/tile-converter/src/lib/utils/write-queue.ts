import {Queue} from './queue';

export type WriteQueueItem = {
  archiveKey?: string;
  writePromise: Promise<string>;
};

export default class WriteQueue<T extends WriteQueueItem> extends Queue<T> {
  private intervalId?: NodeJS.Timeout;
  public writePromise: Promise<void> | null = null;
  public fileMap: {[key: string]: string} = {};
  public listeningInterval: number;
  public writeConcurrency: number;

  constructor(listeningInterval: number = 2000, writeConcurrency: number = 400) {
    super();
    this.listeningInterval = listeningInterval;
    this.writeConcurrency = writeConcurrency;
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
    if (this.writePromise) {
      await this.writePromise;
      this.writePromise = null;
      return;
    }
    this.writePromise = this.doWrite();
    await this.writePromise;
    this.writePromise = null;
  }

  async finalize(): Promise<void> {
    this.stopListening();
    await this.startWrite();
  }

  private async doWrite(): Promise<void> {
    while (this.length) {
      const promises: Promise<string>[] = [];
      const archiveKeys: (string | undefined)[] = [];
      for (let i = 0; i < this.writeConcurrency; i++) {
        const item = this.dequeue();
        if (!item) {
          break;
        }
        const {archiveKey, writePromise} = item as WriteQueueItem;
        archiveKeys.push(archiveKey);
        promises.push(writePromise);
      }
      const writeResults = await Promise.allSettled(promises);
      this.updateFileMap(archiveKeys, writeResults);
    }
    this.writePromise = null;
  }

  private updateFileMap(
    archiveKeys: (string | undefined)[],
    writeResults: PromiseSettledResult<string>[]
  ) {
    for (let i = 0; i < archiveKeys.length; i++) {
      const archiveKey = archiveKeys[i];
      if (archiveKey && 'value' in writeResults[i]) {
        this.fileMap[archiveKey] = (<PromiseFulfilledResult<string>>writeResults[i]).value;
      }
    }
  }
}
