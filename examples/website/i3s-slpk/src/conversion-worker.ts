import {convertSelectedI3SContentsToResources} from './i3s-conversion-input';
import type {I3SMeshSourceFeatureOptions} from '@loaders.gl/tile-converter/v5/adapters';
import {encodeTileConversionArchiveInBatches} from '@loaders.gl/tile-converter/v5/adapters';
import {
  convertSelectedContentsToResources,
  ARCHIVE_MIME_TYPES,
  CONVERSION_LIMITS
} from './convert-tileset';
import {transferArchiveChunks, type ConversionWorkerScope} from './conversion-worker-stream';
import type {
  ConversionWorkerRequest,
  ConversionWorkerMessage,
  ConversionWorkerFinishRequest
} from './conversion-worker-client';

const workerScope = globalThis as unknown as ConversionWorkerScope;

/** Tracks the one conversion independently of cooperative control messages. */
let started = false;
/** Stops source enumeration after the in-flight mesh has been written. */
let finishRequested = false;

/** Accepts exactly one conversion, then pulls only acknowledged archive chunks. */
workerScope.onmessage = async (
  event: MessageEvent<ConversionWorkerRequest | ConversionWorkerFinishRequest>
) => {
  if ('type' in event.data && event.data.type === 'finish') {
    finishRequested = true;
    return;
  }
  if (started || !('inspection' in event.data)) return;
  started = true;
  try {
    const {inspection, resourceIds, format, features, geometricError} = event.data;
    let phaseMessage = 'Reading mesh source';
    const controls = {
      shouldFinish: () => finishRequested,
      onProgress: (
        progress: import('../../common/conversion-progress').ConversionProgressSnapshot
      ) =>
        workerScope.postMessage({
          type: 'progress',
          message: phaseMessage,
          progress
        } satisfies ConversionWorkerMessage)
    };
    const result =
      'kind' in inspection
        ? await convertSelectedI3SContentsToResources(
            inspection,
            resourceIds,
            format,
            new AbortController().signal,
            message => {
              phaseMessage = message;
            },
            fetch,
            features as I3SMeshSourceFeatureOptions | undefined,
            geometricError,
            controls
          )
        : await convertSelectedContentsToResources(
            inspection,
            resourceIds,
            format,
            new AbortController().signal,
            message => {
              phaseMessage = message;
            },
            fetch,
            features,
            controls
          );
    workerScope.postMessage({
      type: 'progress',
      message: 'Packaging archive'
    } satisfies ConversionWorkerMessage);
    const totalBytes = await transferArchiveChunks(
      encodeTileConversionArchiveInBatches(result.files, {
        format,
        maxArchiveBytes: CONVERSION_LIMITS.maxOutputBytes
      }),
      workerScope
    );
    workerScope.postMessage({
      type: 'result',
      totalBytes,
      name: result.name,
      mimeType: ARCHIVE_MIME_TYPES[format],
      report: result.report,
      ...(result.partial ? {partial: true} : {})
    } satisfies ConversionWorkerMessage);
  } catch (error) {
    workerScope.postMessage({
      type: 'error',
      message: error instanceof Error ? error.message : String(error)
    } satisfies ConversionWorkerMessage);
  }
};
