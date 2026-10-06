import type {
  BrowserTilesetConversionInspection,
  TileConversionReport
} from '@loaders.gl/tile-converter/v5/core';
import type {MeshSourceFeatureOptions} from '@loaders.gl/tile-converter/v5/adapters';
import {CONVERSION_LIMITS, type ConversionFormat, type ConversionResult} from './convert-tileset';

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

/** Worker replies transfer one acknowledged archive chunk at a time, then completion metadata. */
export type ConversionWorkerMessage =
  | {
      /** Progress discriminator. */
      readonly type: 'progress';
      /** Current conversion phase. */
      readonly message: string;
    }
  | {
      /** Archive chunk discriminator. */
      readonly type: 'chunk';
      /** Monotonically increasing chunk identifier, starting at zero. */
      readonly sequence: number;
      /** Transferable byte view; only its byte range belongs to the archive. */
      readonly chunk: Uint8Array<ArrayBuffer>;
    }
  | {
      /** Success discriminator. */
      readonly type: 'result';
      /** Complete archive byte count, checked against the accepted chunks. */
      readonly totalBytes: number;
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

/** Acknowledges one copied archive chunk, allowing the worker to encode the next entry. */
export interface ConversionWorkerAcknowledgement {
  /** Pull the next archive chunk. */
  readonly type: 'continue';
  /** Exact chunk identifier being acknowledged. */
  readonly sequence: number;
}

/**
 * Runs conversion in a disposable worker and copies transferred chunks into bounded Blob parts.
 * Acknowledges each accepted chunk before pulling more output; exposes a File only on completion.
 * Cancellation terminates computation and releases partial parts. Byte gates do not cap total heap.
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
    let receivedBytes = 0;
    let nextSequence = 0;
    const archiveParts: Blob[] = [];
    /** Releases the worker and signal subscription on every completion path. */
    function finish(error?: unknown, result?: ConversionResult): void {
      if (settled) return;
      settled = true;
      signal.removeEventListener('abort', cancel);
      worker.onmessage = null;
      worker.onerror = null;
      worker.onmessageerror = null;
      worker.terminate();
      archiveParts.length = 0;
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
          case 'chunk':
            if (
              message.sequence !== nextSequence ||
              !(message.chunk instanceof Uint8Array) ||
              receivedBytes + message.chunk.byteLength > CONVERSION_LIMITS.maxOutputBytes
            )
              throw new Error('Invalid or over-budget conversion archive chunk.');
            archiveParts.push(new Blob([message.chunk]));
            receivedBytes += message.chunk.byteLength;
            nextSequence++;
            worker.postMessage({
              type: 'continue',
              sequence: message.sequence
            } satisfies ConversionWorkerAcknowledgement);
            break;
          case 'result':
            if (!nextSequence || message.totalBytes !== receivedBytes)
              throw new Error('Incomplete conversion archive.');
            finish(undefined, {
              file: new File(archiveParts, message.name, {type: message.mimeType}),
              report: message.report
            });
            break;
          case 'error':
            finish(new Error(message.message));
            break;
          default:
            throw new Error('Unknown conversion worker message.');
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
