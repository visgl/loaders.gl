import type {
  ConversionWorkerAcknowledgement,
  ConversionWorkerMessage
} from './conversion-worker-client';

/** Minimal dedicated-worker boundary, also usable by the hermetic protocol harness. */
export type ConversionWorkerScope = Pick<Worker, 'onmessage' | 'postMessage'>;

/**
 * Transfers one archive byte view, then waits for its acknowledgement before pulling again.
 * The producer may release or detach each transferred backing buffer. Failure closes the iterator;
 * cancellation is implemented by terminating this disposable worker.
 * @returns Total successfully acknowledged archive bytes.
 */
export async function transferArchiveChunks(
  chunks: AsyncIterable<Uint8Array<ArrayBuffer>>,
  scope: ConversionWorkerScope
): Promise<number> {
  let sequence = 0;
  let totalBytes = 0;
  try {
    for await (const chunk of chunks) {
      const byteLength = chunk.byteLength;
      await new Promise<void>((resolve, reject) => {
        scope.onmessage = (event: MessageEvent<ConversionWorkerAcknowledgement>) => {
          scope.onmessage = null;
          if (event.data?.type !== 'continue' || event.data.sequence !== sequence) {
            reject(new Error('Invalid conversion archive acknowledgement.'));
          } else {
            resolve();
          }
        };
        scope.postMessage({type: 'chunk', sequence, chunk} satisfies ConversionWorkerMessage, [
          chunk.buffer
        ]);
      });
      totalBytes += byteLength;
      sequence++;
    }
    return totalBytes;
  } finally {
    scope.onmessage = null;
  }
}
