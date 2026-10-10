import type {TileConversionReport} from '@loaders.gl/tile-converter/v5/core';
import type {
  MeshSourceFeatureOptions,
  I3SMeshSourceFeatureOptions
} from '@loaders.gl/tile-converter/v5/adapters';
import type {I3SConversionInspection} from './i3s-conversion-input';

/** Cloneable inspection accepted by the example's conversion worker. */
export type ConversionInspection = Tiles3DConversionInspection | I3SConversionInspection;
/** Explicit feature mapping for the selected source format. */
export type ConversionFeatureOptions = MeshSourceFeatureOptions | I3SMeshSourceFeatureOptions;

import {
  CONVERSION_LIMITS,
  type ConversionFormat,
  type ConversionResult,
  type Tiles3DConversionInspection
} from './convert-tileset';

/** One selected conversion; callbacks, signals and runtime objects stay outside the worker protocol. */
export interface ConversionWorkerRequest {
  /** Bounded explicit source document and content descriptors. */
  readonly inspection: ConversionInspection;
  /** Explicitly selected content placements. */
  readonly resourceIds: readonly string[];
  /** Requested archive format. */
  readonly format: ConversionFormat;
  /** Optional explicit SLPK feature mapping. */
  readonly features?: ConversionFeatureOptions;
  /** Application-declared metric LOD error, required for I3S to 3TZ. */
  readonly geometricError?: number;
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

/** Completed direct save, without retaining a downloadable archive in JavaScript. */
export interface SavedConversionResult {
  /** Complete archive bytes accepted by the destination. */
  readonly size: number;
  /** Conversion diagnostics, published only after the destination closes successfully. */
  readonly report: TileConversionReport;
}

/** Runs conversion in a disposable worker and collects bounded Blob parts for download/preview. */
export async function convertSelectedContentsInWorker(
  inspection: ConversionInspection,
  resourceIds: readonly string[],
  format: ConversionFormat,
  signal: AbortSignal,
  onProgress: (message: string) => void,
  features?: ConversionFeatureOptions,
  geometricError?: number
): Promise<ConversionResult> {
  const archiveParts: Blob[] = [];
  try {
    const result = await runConversionWorker(
      {inspection, resourceIds, format, features, geometricError},
      signal,
      onProgress,
      chunk => {
        archiveParts.push(new Blob([chunk]));
      }
    );
    signal.throwIfAborted();
    return {
      file: new File(archiveParts, result.name, {type: result.mimeType}),
      report: result.report
    };
  } finally {
    archiveParts.length = 0;
  }
}

/**
 * Saves worker output to an application-owned stream without collecting archive Blob parts.
 * Owns the stream writer: awaits every write before acknowledging the next chunk, closes only on
 * successful completion, aborts on failure/cancellation, and releases its lock on every path.
 * Cancellation is accepted until close starts; the final close is a commit boundary.
 * @param destination - Fresh writable stream; native file streams commit changes on close.
 * @returns Completed byte count and diagnostics after successful finalization.
 */
export async function saveSelectedContentsInWorker(
  inspection: ConversionInspection,
  resourceIds: readonly string[],
  format: ConversionFormat,
  signal: AbortSignal,
  onProgress: (message: string) => void,
  destination: WritableStream<Uint8Array<ArrayBuffer>>,
  features?: ConversionFeatureOptions,
  geometricError?: number
): Promise<SavedConversionResult> {
  const writer = destination.getWriter();
  try {
    const result = await runConversionWorker(
      {inspection, resourceIds, format, features, geometricError},
      signal,
      onProgress,
      chunk => writer.write(chunk)
    );
    signal.throwIfAborted();
    onProgress('Saving archive');
    signal.throwIfAborted();
    await writer.close();
    return {size: result.totalBytes, report: result.report};
  } catch (error) {
    // Preserve the conversion/write error even if the destination is already errored or closed.
    try {
      await writer.abort(error);
    } catch {
      /* The original failure remains authoritative. */
    }
    throw error;
  } finally {
    writer.releaseLock();
  }
}

/** Drives one worker, rejecting out-of-order output while a destination write is pending. */
async function runConversionWorker(
  request: ConversionWorkerRequest,
  signal: AbortSignal,
  onProgress: (message: string) => void,
  writeChunk: (chunk: Uint8Array<ArrayBuffer>) => void | Promise<void>
): Promise<Extract<ConversionWorkerMessage, {type: 'result'}>> {
  signal.throwIfAborted();
  const worker = new Worker(new URL('./conversion-worker.ts', import.meta.url), {type: 'module'});
  return new Promise((resolve, reject) => {
    let settled = false;
    let writing = false;
    let receivedBytes = 0;
    let nextSequence = 0;
    /** Releases the worker and signal subscription on every completion path. */
    function finish(
      error?: unknown,
      result?: Extract<ConversionWorkerMessage, {type: 'result'}>
    ): void {
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
    /** Terminates computation immediately; the stream owner awaits destination cleanup. */
    function cancel(): void {
      finish(signal.reason);
    }
    signal.addEventListener('abort', cancel, {once: true});
    worker.onmessage = async (event: MessageEvent<ConversionWorkerMessage>) => {
      if (settled) return;
      try {
        if (writing) throw new Error('Conversion worker sent output before acknowledgement.');
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
            const byteLength = message.chunk.byteLength;
            writing = true;
            await writeChunk(message.chunk);
            if (settled) return;
            receivedBytes += byteLength;
            nextSequence++;
            writing = false;
            worker.postMessage({
              type: 'continue',
              sequence: message.sequence
            } satisfies ConversionWorkerAcknowledgement);
            break;
          case 'result':
            if (!nextSequence || message.totalBytes !== receivedBytes)
              throw new Error('Incomplete conversion archive.');
            finish(undefined, message);
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
      worker.postMessage(request);
    } catch (error) {
      finish(error);
    }
  });
}
