// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {TileConversionError} from './conversion-api.js';
import type {TileConversionReport, TileConversionSink} from './conversion-api.js';

const BLOB_SIZE_GETTER = Object.getOwnPropertyDescriptor(Blob.prototype, 'size')?.get;

/** One named browser output resource. */
export interface BrowserTileConversionResource {
  /** Stable relative output path supplied by the target profile. */
  readonly resourceId: string;
  /** Parts combined into a Blob after the total output budget is checked. */
  readonly parts: readonly BlobPart[];
  /** MIME type recorded on the resulting Blob. */
  readonly contentType?: string;
}

/** A named output resource retained by the bounded browser sink. */
export interface BrowserTileConversionFile {
  /** Stable relative output path supplied by the target profile. */
  readonly resourceId: string;
  /** Browser-native data for download or application-provided packaging. */
  readonly blob: Blob;
}

/** Memory limit for a browser conversion sink. */
export interface BoundedMemoryTileConversionSinkOptions {
  /** Maximum combined Blob size retained by this sink, captured at creation, in bytes. */
  readonly maxTotalBytes: number;
}

/** Browser sink with read access to its bounded output resources. */
export interface BoundedMemoryTileConversionSink
  extends TileConversionSink<BrowserTileConversionResource> {
  /** Returns the retained files in stable resource-ID order. */
  getFiles(): readonly BrowserTileConversionFile[];
}

/**
 * Creates a browser-only sink that retains output as Blobs under a total byte limit.
 *
 * The sink does not download or archive files. Applications can use `getFiles()` after
 * `convertTileset` completes and package or download the returned Blobs as needed.
 *
 * @param options - Maximum in-memory output size.
 * @returns A sink that stores browser-native Blobs and clears them on abort.
 */
export function createBoundedMemoryTileConversionSink(
  options: BoundedMemoryTileConversionSinkOptions
): BoundedMemoryTileConversionSink {
  const {maxTotalBytes} = options;
  if (!Number.isSafeInteger(maxTotalBytes) || maxTotalBytes < 0) {
    throw new TileConversionError(
      'INVALID_OUTPUT_MEMORY_LIMIT',
      'The browser output memory limit must be a non-negative safe integer'
    );
  }

  const files = new Map<string, BrowserTileConversionFile>();
  let totalBytes = 0;
  let closed = false;

  return {
    getFiles() {
      return [...files.values()].sort((left, right) =>
        left.resourceId < right.resourceId ? -1 : left.resourceId > right.resourceId ? 1 : 0
      );
    },
    async write(resource, signal) {
      if (signal?.aborted) {
        throw signal.reason ?? new DOMException('The operation was aborted', 'AbortError');
      }
      if (closed) {
        throw new TileConversionError(
          'RESOURCE_SINK_CLOSED',
          'Cannot write after sink finalization'
        );
      }
      if (!resource.resourceId || files.has(resource.resourceId)) {
        throw new TileConversionError(
          'INVALID_BROWSER_RESOURCE_ID',
          'Browser output resource IDs must be non-empty and unique'
        );
      }

      const byteLength = resource.parts.reduce((total, part) => total + measureBlobPart(part), 0);
      if (!Number.isSafeInteger(byteLength) || totalBytes + byteLength > maxTotalBytes) {
        throw new TileConversionError(
          'OUTPUT_MEMORY_LIMIT_EXCEEDED',
          `Browser output exceeds the configured ${maxTotalBytes} byte memory limit`
        );
      }

      const blob = new Blob([...resource.parts], {type: resource.contentType});
      files.set(resource.resourceId, {resourceId: resource.resourceId, blob});
      totalBytes += blob.size;
    },
    async finalize(_report: TileConversionReport) {
      if (closed) {
        throw new TileConversionError('RESOURCE_SINK_CLOSED', 'Sink has already been finalized');
      }
      closed = true;
    },
    async abort() {
      files.clear();
      totalBytes = 0;
      closed = true;
    }
  };
}

/** Measures supported Blob parts without copying them into a Blob first. */
function measureBlobPart(part: BlobPart): number {
  if (typeof part === 'string') {
    return new TextEncoder().encode(part).byteLength;
  }
  if (BLOB_SIZE_GETTER) {
    try {
      return BLOB_SIZE_GETTER.call(part) as number;
    } catch {
      // Keep checking the remaining supported Blob part types.
    }
  }
  if (part instanceof ArrayBuffer || ArrayBuffer.isView(part)) {
    return part.byteLength;
  }
  throw new TileConversionError('UNSUPPORTED_BROWSER_RESOURCE', 'Unsupported browser Blob part');
}
