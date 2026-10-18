// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {BlobFile, HttpFile} from '@loaders.gl/loader-utils';
import type {HttpFileIdentity, ReadableFile} from '@loaders.gl/loader-utils';
import {parseSLPKArchive} from '@loaders.gl/tiles-3d/i3s';
import {parse3DTilesArchive} from '@loaders.gl/tiles-3d/3d-tiles';
import {TileConversionError} from '@loaders.gl/tile-converter/v5/core';
import {createTileConversionResourceFetcher} from './resource-fetcher.js';

/** Cloneable archive input; a remote identity is retained across inspection and conversion. */
export interface TileConversionArchiveInput {
  /** Immutable local Blob or HTTP(S) archive URL, including any query credentials. */
  readonly input: Blob | string;
  /** Explicit archive format, including for URLs without a filename extension. */
  readonly format: 'slpk' | '3tz';
  /** Pinned remote length and validator; local File contents are immutable. */
  readonly identity?: HttpFileIdentity;
}

/** Opens an indexed archive with bounded reads and confines dependency URLs to its virtual root. */
export async function openTileConversionArchive(
  descriptor: TileConversionArchiveInput,
  maxInputBytes: number,
  signal: AbortSignal,
  fetcher: typeof fetch = fetch
) {
  signal.throwIfAborted();
  if (!['slpk', '3tz'].includes(descriptor.format))
    throw new TileConversionError('INVALID_ARCHIVE_SOURCE', 'Select SLPK or 3TZ archive input');
  validateArchiveEntityTag(descriptor.identity?.etag);
  const transport = createTileConversionResourceFetcher({
    maxInputBytes,
    signal,
    fetcher: async (url, options) => {
      const response = await fetcher(url, options);
      if (response.status !== 206) {
        await response.body?.cancel();
        throw new Error('Remote conversion archives require HTTP 206 byte-range responses.');
      }
      try {
        validateArchiveResponseValidator(response.headers);
      } catch (error) {
        await response.body?.cancel(error);
        throw error;
      }
      return response;
    }
  });
  let file: ReadableFile | undefined;
  let closePromise: Promise<void> | undefined;
  /** Shares transport release between initialization failure and the owned archive. */
  async function closeFile(): Promise<void> {
    if (file) {
      closePromise ??= file.close();
      await closePromise;
    }
  }
  try {
    if (typeof descriptor.input === 'string') {
      if (!['http:', 'https:'].includes(new URL(descriptor.input).protocol))
        throw new Error('Use an HTTP(S) archive URL.');
      const remote = new HttpFile(descriptor.input, {
        fetch: (url, options) => transport(url, options),
        consistency: 'strict',
        ...descriptor.identity
      });
      file = remote;
      await remote.open(signal);
    } else file = new BlobFile(descriptor.input);
    const ownedFile = file;
    file = undefined;
    return await createTileConversionArchiveTransport(
      ownedFile,
      descriptor.format,
      maxInputBytes,
      signal,
      descriptor
    );
  } catch (error) {
    await closeFile();
    throw error;
  }
}

/** Owns an indexed readable file and confines entry/dependency requests to its virtual root. */
export async function createTileConversionArchiveTransport(
  file: ReadableFile,
  format: 'slpk' | '3tz',
  maxInputBytes: number,
  signal: AbortSignal,
  descriptor?: TileConversionArchiveInput
) {
  const rootUrl = `https://conversion.invalid/input.${format}`;
  let closed = false;
  let releasePromise: Promise<void> | undefined;
  let closePromise: Promise<void> | undefined;
  /** Invalidates cached reads as well as physical reads, and releases the file exactly once. */
  const closeFile = (): Promise<void> => {
    closed = true;
    closePromise ??= file.close();
    return closePromise;
  };
  /** Checks operation cancellation and the owned archive lifetime before cached or physical reads. */
  const checkOpen = (): void => {
    signal.throwIfAborted();
    if (closed)
      throw new TileConversionError('ARCHIVE_SOURCE_CLOSED', 'Conversion archive is closed');
  };
  try {
    checkOpen();
    if (
      !['slpk', '3tz'].includes(format) ||
      !Number.isSafeInteger(maxInputBytes) ||
      maxInputBytes < 1
    )
      throw new TileConversionError(
        'INVALID_ARCHIVE_SOURCE',
        'Archive source requires a supported format and positive safe byte budget'
      );
    if (!Number.isSafeInteger(file.size) || file.size < 0 || file.size > maxInputBytes)
      throw new Error('Conversion archive input must be at most 16 MiB.');
    let readBytes = 0;
    const boundedFile: ReadableFile = {
      handle: file.handle,
      size: file.size,
      bigsize: file.bigsize,
      url: file.url,
      ...(file.stat ? {stat: () => file.stat!()} : {}),
      close: closeFile,
      /** Checks indexed reads before allocation and forwards operation cancellation. */
      read: async (start, length) => {
        checkOpen();
        if (!Number.isSafeInteger(length) || length! < 0 || length! > maxInputBytes - readBytes)
          throw new TileConversionError(
            'INPUT_RESOURCE_TOO_LARGE',
            'Archive indexed reads exceed the input budget'
          );
        readBytes += length!;
        const bytes = await file!.read(start, length, signal);
        checkOpen();
        return bytes;
      }
    };
    const archive =
      format === 'slpk'
        ? await parseSLPKArchive(boundedFile)
        : await parse3DTilesArchive(boundedFile);
    const root = new URL(rootUrl);
    return {
      rootUrl: format === '3tz' ? `${rootUrl}/tileset.json` : rootUrl,
      descriptor: descriptor
        ? {
            ...descriptor,
            ...(file instanceof HttpFile ? {identity: file.getIdentitySnapshot()!} : {})
          }
        : undefined,
      /** Resolves only resources belonging to this archive, without external network fallback. */
      fetcher: (async (input, options) => {
        checkOpen();
        options?.signal?.throwIfAborted();
        const url = new URL(input instanceof Request ? input.url : String(input));
        if (
          url.origin !== root.origin ||
          (url.pathname !== root.pathname && !url.pathname.startsWith(`${root.pathname}/`))
        )
          throw new Error('Conversion dependencies must resolve inside the selected archive.');
        const path = decodeURIComponent(
          url.pathname.slice(root.pathname.length).replace(/^\//, '')
        );
        if (
          path.includes('\\') ||
          path.split('/').some(segment => segment === '..' || segment === '.')
        )
          throw new Error('Archive dependency path cannot escape its root.');
        const bytes =
          format === 'slpk' ? await archive.getFile(path, 'http') : await archive.getFile(path);
        checkOpen();
        options?.signal?.throwIfAborted();
        return new Response(bytes);
      }) satisfies typeof fetch,
      /** Releases the readable file on success, failure or cancellation. */
      close: async () => {
        closed = true;
        releasePromise ??= archive.close();
        await releasePromise;
      }
    };
  } catch (error) {
    await closeFile();
    throw error;
  }
}

/** Rejects weak/malformed entity tags rather than downgrading the archive identity contract. */
function validateArchiveEntityTag(entityTag: string | null | undefined): void {
  if (
    entityTag !== undefined &&
    entityTag !== null &&
    !/^"[\x21\x23-\x7e\x80-\xff]*"$/.test(entityTag)
  )
    throw new TileConversionError(
      'ARCHIVE_VALIDATOR_UNSUPPORTED',
      'Remote archives require a strong quoted ETag, or Last-Modified without an ETag; weak/malformed ETags are unsupported'
    );
}

/** Qualifies Last-Modified fallback conservatively using server dates at least 60 seconds apart. */
function validateArchiveResponseValidator(headers: Headers): void {
  const entityTag = headers.get('etag');
  validateArchiveEntityTag(entityTag);
  if (entityTag !== null) return;
  const lastModified = headers.get('last-modified');
  const responseDate = headers.get('date');
  const modifiedTime = parseArchiveHttpDate(lastModified);
  const responseTime = parseArchiveHttpDate(responseDate);
  if (
    !Number.isFinite(modifiedTime) ||
    !Number.isFinite(responseTime) ||
    responseTime - modifiedTime < 60_000
  )
    throw new TileConversionError(
      'ARCHIVE_VALIDATOR_UNSUPPORTED',
      'Last-Modified archive identity requires a valid Date at least 60 seconds later; otherwise supply a strong ETag'
    );
}

/** Accepts canonical HTTP server dates without Date.parse's permissive non-HTTP extensions. */
function parseArchiveHttpDate(value: string | null): number {
  const milliseconds = value === null ? NaN : Date.parse(value);
  return Number.isFinite(milliseconds) && new Date(milliseconds).toUTCString() === value
    ? milliseconds
    : NaN;
}
