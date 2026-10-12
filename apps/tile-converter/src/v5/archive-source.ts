// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {BlobFile, HttpFile} from '@loaders.gl/loader-utils';
import type {HttpFileIdentity, ReadableFile} from '@loaders.gl/loader-utils';
import {parseSLPKArchive} from '@loaders.gl/i3s';
import {parse3DTilesArchive} from '@loaders.gl/3d-tiles';
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
  const transport = createTileConversionResourceFetcher({
    maxInputBytes,
    signal,
    fetcher: async (url, options) => {
      const response = await fetcher(url, options);
      if (response.status !== 206) {
        await response.body?.cancel();
        throw new Error('Remote conversion archives require HTTP 206 byte-range responses.');
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
