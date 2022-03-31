import {Queue} from './queue';

export type WritingQueueItem = {
  archiveKey?: string;
  writePromise: Promise<string>;
};

export default class WritingQueue<T extends WritingQueueItem> extends Queue<T> {
  private intervalId?: NodeJS.Timeout;
  public writingPromise: Promise<void> | null = null;
  public fileMap: {[key: string]: string} = {};
  public listeningInterval: number;
  public writingConcurrency: number;

  constructor(listeningInterval: number = 2000, writingConcurrency: number = 400) {
    super();
    this.listeningInterval = listeningInterval;
    this.writingConcurrency = writingConcurrency;
  }

  startListening() {
    this.intervalId = setInterval(this.startWriting.bind(this), this.listeningInterval);
  }

  stopListening() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  async startWriting(): Promise<void> {
    if (this.writingPromise) {
      await this.writingPromise;
      this.writingPromise = null;
      return;
    }
    this.writingPromise = this.doWriting();
    await this.writingPromise;
    this.writingPromise = null;
  }

  async finalize(): Promise<void> {
    this.stopListening();
    await this.startWriting();
  }

  private async doWriting(): Promise<void> {
    while (this.length) {
      const promises: Promise<string>[] = [];
      const archiveKeys: (string | undefined)[] = [];
      for (let i = 0; i < this.writingConcurrency; i++) {
        const item = this.dequeue();
        if (!item) {
          break;
        }
        const {archiveKey, writePromise} = item as WritingQueueItem;
        archiveKeys.push(archiveKey);
        promises.push(writePromise);
      }
      const writeResults = await Promise.all(promises);
      this.updateFileMap(archiveKeys, writeResults);
    }
    this.writingPromise = null;
  }

  private updateFileMap(archiveKeys: (string | undefined)[], writeResults: string[]) {
    for (let i = 0; i < archiveKeys.length; i++) {
      const archiveKey = archiveKeys[i];
      if (!archiveKey) {
        continue;
      }
      this.fileMap[archiveKey] = writeResults[i];
    }
  }
}
