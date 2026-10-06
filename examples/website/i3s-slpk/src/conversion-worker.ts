import {convertSelectedContents} from './convert-tileset';
import type {ConversionWorkerRequest, ConversionWorkerMessage} from './conversion-worker-client';

const workerScope = globalThis as unknown as Pick<Worker, 'onmessage' | 'postMessage'>;

/** Accepts exactly one conversion in this disposable worker. */
workerScope.onmessage = async (event: MessageEvent<ConversionWorkerRequest>) => {
  workerScope.onmessage = null;
  try {
    const {inspection, resourceIds, format, features} = event.data;
    const result = await convertSelectedContents(
      inspection,
      resourceIds,
      format,
      new AbortController().signal,
      message =>
        workerScope.postMessage({type: 'progress', message} satisfies ConversionWorkerMessage),
      fetch,
      features
    );
    const buffer = await result.file.arrayBuffer();
    workerScope.postMessage(
      {
        type: 'result',
        buffer,
        name: result.file.name,
        mimeType: result.file.type,
        report: result.report
      } satisfies ConversionWorkerMessage,
      [buffer]
    );
  } catch (error) {
    workerScope.postMessage({
      type: 'error',
      message: error instanceof Error ? error.message : String(error)
    } satisfies ConversionWorkerMessage);
  }
};
