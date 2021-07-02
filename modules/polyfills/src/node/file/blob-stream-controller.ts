/**
 * Forked from @gozala's web-blob under MIT license
 * @see https://github.com/Gozala/web-blob
 */
class BlobStreamController {
  private chunks: Iterator<Uint8Array>;
  private isWorking: boolean = false;
  private isCancelled: boolean = false;

  /**
   * @param chunks
   */
  constructor(chunks: Iterator<Uint8Array>) {
    this.chunks = chunks;
  }

  /**
   * @param controller
   */
  start(controller: ReadableStreamDefaultController) {
    this.work(controller);
  }

  /**
   *
   * @param controller
   */
  async work(controller: ReadableStreamDefaultController) {
    const {chunks} = this;

    this.isWorking = true;
    while (!this.isCancelled && (controller.desiredSize || 0) > 0) {
      let next: {done?: boolean; value?: Uint8Array} | undefined;
      try {
        next = chunks.next();
      } catch (error) {
        controller.error(error);
        break;
      }

      if (next) {
        if (!next.done && !this.isCancelled) {
          controller.enqueue(next.value);
        } else {
          controller.close();
        }
      }
    }

    this.isWorking = false;
  }

  /**
   *
   * @param {ReadableStreamDefaultController} controller
   */
  pull(controller) {
    if (!this.isWorking) {
      this.work(controller);
    }
  }
  cancel() {
    this.isCancelled = true;
  }
}
