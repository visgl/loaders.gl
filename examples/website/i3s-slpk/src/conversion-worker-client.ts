import type {
  BrowserTilesetConversionInspection,
  TileConversionReport
} from '@loaders.gl/tile-converter/v5/core';
import type {MeshSourceFeatureOptions} from '@loaders.gl/tile-converter/v5/adapters';
import type {ConversionFormat, ConversionResult} from './convert-tileset';

/** One selected conversion; callbacks, signals and runtime objects stay outside the worker protocol. */
export interface ConversionWorkerRequest {
  /** Bounded explicit source document and content descriptors. */
  readonly inspection: BrowserTilesetConversionInspection;
  /** Explicitly selected content placements. */
  readonly resourceIds: readonly string[];
  /** Requested archive format. */
  readonly format: ConversionFormat;
  /** Optional explicit SLPK feature mapping. */
  readonly features?: MeshSourceFeatureOptions;
}

/** Worker replies contain progress, a finalized transferable archive, or a readable failure. */
export type ConversionWorkerMessage =
  | {
      /** Progress discriminator. */
      readonly type: 'progress';
      /** Current conversion phase. */
      readonly message: string;
    }
  | {
      /** Success discriminator. */
      readonly type: 'result';
      /** Final archive bytes, transferred once. */
      readonly buffer: ArrayBuffer;
      /** Download filename. */
      readonly name: string;
      /** Archive MIME type. */
      readonly mimeType: string;
      /** Completed conversion diagnostics. */
      readonly report: TileConversionReport;
    }
  | {
      /** Failure discriminator. */
      readonly type: 'error';
      /** User-readable failure. */
      readonly message: string;
    };

/**
 * Runs decoding, conversion and packaging in a disposable module worker. Cancellation terminates
 * computation immediately; only the successful archive buffer returns to the main thread.
 * Existing byte gates do not bound peak worker memory.
 */
export async function convertSelectedContentsInWorker(
  inspection: BrowserTilesetConversionInspection,
  resourceIds: readonly string[],
  format: ConversionFormat,
  signal: AbortSignal,
  onProgress: (message: string) => void,
  features?: MeshSourceFeatureOptions
): Promise<ConversionResult> {
  signal.throwIfAborted();
  const worker = new Worker(new URL('./conversion-worker.ts', import.meta.url), {type: 'module'});
  return new Promise((resolve, reject) => {
    let settled = false;
    /** Releases the worker and signal subscription on every completion path. */
    function finish(error?: unknown, result?: ConversionResult): void {
      if (settled) return;
      settled = true;
      signal.removeEventListener('abort', cancel);
      worker.onmessage = null;
      worker.onerror = null;
      worker.onmessageerror = null;
      worker.terminate();
      if (result) resolve(result);
      else reject(error);
    }
    /** Terminates pending transport and synchronous decoder/packager work. */
    function cancel(): void {
      finish(signal.reason);
    }
    signal.addEventListener('abort', cancel, {once: true});
    worker.onmessage = (event: MessageEvent<ConversionWorkerMessage>) => {
      if (settled) return;
      try {
        const message = event.data;
        switch (message.type) {
          case 'progress':
            onProgress(message.message);
            break;
          case 'result':
            finish(undefined, {
              file: new File([message.buffer], message.name, {type: message.mimeType}),
              report: message.report
            });
            break;
          case 'error':
            finish(new Error(message.message));
            break;
        }
      } catch (error) {
        finish(error);
      }
    };
    worker.onerror = event => {
      event.preventDefault();
      finish(new Error(event.message || 'Conversion worker failed to start or run.'));
    };
    worker.onmessageerror = () => finish(new Error('Could not read the conversion worker result.'));
    if (signal.aborted) {
      cancel();
      return;
    }
    try {
      worker.postMessage({
        inspection,
        resourceIds,
        format,
        features
      } satisfies ConversionWorkerRequest);
    } catch (error) {
      finish(error);
    }
  });
}
