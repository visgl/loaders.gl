import {convertSelectedI3SContentsToResources} from './i3s-conversion-input';
import type {I3SMeshSourceFeatureOptions} from '@loaders.gl/tile-converter/v5/adapters';
import {encodeTileConversionArchiveInBatches} from '@loaders.gl/tile-converter/v5/adapters';
import {
  convertSelectedContentsToResources,
  ARCHIVE_MIME_TYPES,
  CONVERSION_LIMITS
} from './convert-tileset';
import {transferArchiveChunks, type ConversionWorkerScope} from './conversion-worker-stream';
import type {ConversionWorkerRequest, ConversionWorkerMessage} from './conversion-worker-client';

const workerScope = globalThis as unknown as ConversionWorkerScope;

/** Accepts exactly one conversion, then pulls only acknowledged archive chunks. */
workerScope.onmessage = async (event: MessageEvent<ConversionWorkerRequest>) => {
  workerScope.onmessage = null;
  try {
    const {inspection, resourceIds, format, features, geometricError} = event.data;
    const result =
      'kind' in inspection
        ? await convertSelectedI3SContentsToResources(
            inspection,
            resourceIds,
            format,
            new AbortController().signal,
            message =>
              workerScope.postMessage({
                type: 'progress',
                message
              } satisfies ConversionWorkerMessage),
            fetch,
            features as I3SMeshSourceFeatureOptions | undefined,
            geometricError
          )
        : await convertSelectedContentsToResources(
            inspection,
            resourceIds,
            format,
            new AbortController().signal,
            message =>
              workerScope.postMessage({
                type: 'progress',
                message
              } satisfies ConversionWorkerMessage),
            fetch,
            features
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
      report: result.report
    } satisfies ConversionWorkerMessage);
  } catch (error) {
    workerScope.postMessage({
      type: 'error',
      message: error instanceof Error ? error.message : String(error)
    } satisfies ConversionWorkerMessage);
  }
};
