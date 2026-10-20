// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {open, realpath} from 'node:fs/promises';
import {basename, dirname, isAbsolute, relative, resolve, sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import type {ReadableFile} from '@loaders.gl/core/loader-utils';
import {parse3DTilesArchive} from '@loaders.gl/tiles-3d/3d-tiles';
import {
  createBrowserTilesetConversionSource,
  TileConversionError
} from '@loaders.gl/tile-converter/v5/core';
import type {
  BrowserTilesetConversionInspection,
  BrowserTilesetConversionInputResource,
  TileConversionSource
} from '@loaders.gl/tile-converter/v5/core';
import {createTileConversionResourceFetcher} from './resource-fetcher.js';
import {openTileConversionArchive} from './archive-source.js';

/** Maximum budgets for the initial Node source profile; callers may lower them. */
export const NODE_TILESET_LIMITS = {
  /** Aggregate response bytes and, separately, indexed archive read bytes. */
  maxInputBytes: 16 * 1024 * 1024,
  /** Declared content placements in the explicit root document. */
  maxInputResources: 1000,
  /** Maximum root/external document placements inspected or traversed. */
  maxTilesetDocuments: 32
} as const;

/** Platform I/O options for bounded explicit 3D Tiles inspection and raw content reads. */
export interface NodeTilesetConversionSourceOptions {
  /** Local tileset JSON/3TZ path, file URL, or HTTP(S) tileset JSON URL. */
  readonly input: string;
  /** Explicit JSON or indexed archive input format. */
  readonly format?: '3d-tiles' | '3tz';
  /** Positive response/indexed-read budget, at most 16 MiB. */
  readonly maxInputBytes?: number;
  /** Positive content-placement budget, at most 1,000. */
  readonly maxInputResources?: number;
  /** Positive document budget, at most 32; defaults to root-only traversal. */
  readonly maxTilesetDocuments?: number;
  /** Follow declared .json external documents during metadata-only inspection. */
  readonly inspectNestedTilesets?: boolean;
  /** Cancellation for opening, inspection and subsequent reads. */
  readonly signal?: AbortSignal;
  /** HTTP(S) transport; local dependencies never fall back to it. */
  readonly fetcher?: typeof fetch;
}

/** A dedicated Node source whose owner must close it after inspection or conversion. */
export interface NodeTilesetConversionSource
  extends TileConversionSource<
    BrowserTilesetConversionInspection,
    BrowserTilesetConversionInputResource
  > {
  /** Aborts further I/O and releases the indexed archive handle; safe to call repeatedly. */
  close(): Promise<void>;
  /** Confined, lifetime-budgeted transport for content-level buffers and images. */
  readonly fetcher: typeof fetch;
}

/**
 * Opens bounded Node I/O and delegates explicit traversal to the portable source.
 * Local resources stay below the root document's real directory, including symlinks;
 * archive resources stay inside the archive. Inspection reads metadata only. Reading yields
 * raw content for an application codec, without CRS inference or content-format qualification.
 * The source is sequential and owns one lifetime-wide response/read budget. Close it in finally.
 */
export async function createNodeTilesetConversionSource(
  options: NodeTilesetConversionSourceOptions
): Promise<NodeTilesetConversionSource> {
  const maxInputBytes = options.maxInputBytes ?? NODE_TILESET_LIMITS.maxInputBytes;
  const maxInputResources = options.maxInputResources ?? NODE_TILESET_LIMITS.maxInputResources;
  const maxTilesetDocuments = options.maxTilesetDocuments ?? 1;
  if (
    !Number.isSafeInteger(maxInputBytes) ||
    maxInputBytes < 1 ||
    maxInputBytes > NODE_TILESET_LIMITS.maxInputBytes ||
    !Number.isSafeInteger(maxInputResources) ||
    maxInputResources < 1 ||
    maxInputResources > NODE_TILESET_LIMITS.maxInputResources ||
    !Number.isSafeInteger(maxTilesetDocuments) ||
    maxTilesetDocuments < 1 ||
    maxTilesetDocuments > NODE_TILESET_LIMITS.maxTilesetDocuments ||
    !['3d-tiles', '3tz'].includes(options.format ?? '3d-tiles')
  )
    throw new TileConversionError(
      'INVALID_NODE_SOURCE_OPTIONS',
      'Node sources require positive byte/resource budgets within the initial profile limits'
    );
  options.signal?.throwIfAborted();
  const controller = new AbortController();
  const lifetimeSignal = options.signal
    ? AbortSignal.any([controller.signal, options.signal])
    : controller.signal;
  let archiveFile: ReadableFile | undefined;
  let closeArchive: (() => Promise<void>) | undefined;
  let consumedReadBytes = 0;
  /** Reserves physical file bytes before allocation, including repeated indexed reads. */
  const reserveRead = (length: number): void => {
    if (length > maxInputBytes - consumedReadBytes)
      throw new TileConversionError(
        'INPUT_RESOURCE_TOO_LARGE',
        'Local reads exceed the aggregate input budget'
      );
    consumedReadBytes += length;
  };
  try {
    const inputUrl = /^(?:https?|file):/i.test(options.input) ? new URL(options.input) : undefined;
    if (
      !inputUrl &&
      /^[a-z][a-z\d+.-]*:/i.test(options.input) &&
      !/^[a-z]:[\\/]/i.test(options.input)
    )
      throw new TileConversionError(
        'UNSUPPORTED_NODE_SOURCE',
        'Use a local path, file URL or HTTP(S) tileset URL'
      );
    const remote = inputUrl && inputUrl.protocol !== 'file:';
    let rootUrl: string;
    let transport: typeof fetch;
    let virtualRoot: URL | undefined;
    if (remote && options.format === '3tz') {
      const archive = await openTileConversionArchive(
        {input: inputUrl.href, format: '3tz'},
        maxInputBytes,
        lifetimeSignal,
        options.fetcher
      );
      rootUrl = archive.rootUrl;
      transport = archive.fetcher;
      closeArchive = archive.close;
    } else if (remote) {
      rootUrl = inputUrl.href;
      transport = options.fetcher ?? fetch;
    } else {
      const inputPath = await realpath(inputUrl ? fileURLToPath(inputUrl) : resolve(options.input));
      lifetimeSignal.throwIfAborted();
      const directory = dirname(inputPath);
      virtualRoot = new URL('https://conversion.invalid/input/');
      rootUrl = new URL(
        options.format === '3tz' ? 'tileset.json' : encodeURIComponent(basename(inputPath)),
        virtualRoot
      ).href;
      if (options.format === '3tz') {
        archiveFile = await openLocalFile(inputPath, maxInputBytes, lifetimeSignal, reserveRead);
        const archive = await parse3DTilesArchive(archiveFile);
        transport = async (input, requestOptions) => {
          lifetimeSignal.throwIfAborted();
          requestOptions?.signal?.throwIfAborted();
          const path = getLocalResourcePath(input, virtualRoot!);
          const bytes = await archive.getFile(path);
          lifetimeSignal.throwIfAborted();
          requestOptions?.signal?.throwIfAborted();
          return new Response(bytes);
        };
      } else {
        transport = async (input, requestOptions) => {
          const path = getLocalResourcePath(input, virtualRoot!);
          const resolvedPath = await realpath(resolve(directory, path));
          const relativePath = relative(directory, resolvedPath);
          if (
            relativePath === '..' ||
            relativePath.startsWith(`..${sep}`) ||
            isAbsolute(relativePath)
          )
            throw new TileConversionError(
              'EXTERNAL_RESOURCE_UNSUPPORTED',
              'Local dependencies must remain inside the tileset directory'
            );
          const signal = requestOptions?.signal
            ? AbortSignal.any([lifetimeSignal, requestOptions.signal])
            : lifetimeSignal;
          const file = await openLocalFile(resolvedPath, maxInputBytes, signal, reserveRead);
          try {
            return new Response(await file.read());
          } finally {
            await file.close();
          }
        };
      }
    }
    const resourceFetcher = createTileConversionResourceFetcher({
      maxInputBytes,
      signal: lifetimeSignal,
      fetcher: transport
    });
    const source = createBrowserTilesetConversionSource({
      input: rootUrl,
      maxInputBytes,
      maxInputResources,
      maxTilesetDocuments,
      inspectNestedTilesets: options.inspectNestedTilesets,
      fetcher: resourceFetcher
    });
    return {
      fetcher: resourceFetcher,
      /** Inspects declarations without opening tile payloads or decoding coordinates. */
      async inspect(signal) {
        const inspection = await source.inspect(
          signal ? AbortSignal.any([lifetimeSignal, signal]) : lifetimeSignal
        );
        if (virtualRoot)
          for (const resource of inspection.resources)
            getLocalResourcePath(
              new URL(resource.uri, resource.tilesetUrl ?? inspection.rootUrl),
              virtualRoot
            );
        return inspection;
      },
      /** Reads each declared placement with the same lifetime-wide input budget. */
      read: (inspection, signal) =>
        source.read(
          inspection,
          signal ? AbortSignal.any([lifetimeSignal, signal]) : lifetimeSignal
        ),
      /** Cancels future reads and releases the archive handle. */
      async close() {
        controller.abort(new TileConversionError('NODE_SOURCE_CLOSED', 'Node source is closed'));
        const file = archiveFile;
        archiveFile = undefined;
        await closeArchive?.();
        await file?.close();
      }
    };
  } catch (error) {
    await closeArchive?.();
    await archiveFile?.close();
    throw error;
  }
}

/** Resolves a canonical in-source URL and rejects external or encoded escaping paths. */
function getLocalResourcePath(input: RequestInfo | URL, root: URL): string {
  const url = new URL(input instanceof Request ? input.url : String(input));
  if (url.origin !== root.origin || !url.pathname.startsWith(root.pathname))
    throw new TileConversionError(
      'EXTERNAL_RESOURCE_UNSUPPORTED',
      'Dependencies must resolve inside the selected local input'
    );
  const path = decodeURIComponent(url.pathname.slice(root.pathname.length));
  if (
    !path ||
    path.startsWith('/') ||
    path.includes('\\') ||
    path.split('/').some(segment => segment === '..' || segment === '.')
  )
    throw new TileConversionError(
      'EXTERNAL_RESOURCE_UNSUPPORTED',
      'Dependency paths cannot escape the selected input'
    );
  return path;
}

/** Opens a real Node file and provides checked typed-array reads without Node Buffer. */
export async function openLocalFile(
  path: string,
  maxInputBytes: number,
  signal: AbortSignal,
  reserveRead: (length: number) => void
): Promise<ReadableFile> {
  signal.throwIfAborted();
  const handle = await open(path, 'r');
  try {
    signal.throwIfAborted();
    const information = await handle.stat();
    if (
      !information.isFile() ||
      !Number.isSafeInteger(information.size) ||
      information.size > maxInputBytes
    )
      throw new TileConversionError(
        'INPUT_RESOURCE_TOO_LARGE',
        'Local input must be a regular file within the byte budget'
      );
    const size = information.size;
    return {
      handle,
      size,
      bigsize: BigInt(size),
      url: path,
      /** Reads a bounded range, checking cancellation and unexpected EOF between native reads. */
      async read(start = 0, length = size - Number(start), readSignal) {
        const operationSignal = readSignal ? AbortSignal.any([signal, readSignal]) : signal;
        operationSignal.throwIfAborted();
        const offset = Number(start);
        if (
          !Number.isSafeInteger(offset) ||
          offset < 0 ||
          !Number.isSafeInteger(length) ||
          length < 0 ||
          offset > size - length
        )
          throw new TileConversionError(
            'INVALID_INPUT_RANGE',
            'Local file reads require a range inside the file'
          );
        reserveRead(length);
        const bytes = new Uint8Array(length);
        let readBytes = 0;
        while (readBytes < length) {
          operationSignal.throwIfAborted();
          const result = await handle.read(
            bytes,
            readBytes,
            length - readBytes,
            offset + readBytes
          );
          if (result.bytesRead === 0)
            throw new TileConversionError(
              'INPUT_FILE_TRUNCATED',
              'Local input ended before its declared size'
            );
          readBytes += result.bytesRead;
        }
        operationSignal.throwIfAborted();
        return bytes.buffer;
      },
      /** Releases the Node file handle. */
      close: () => handle.close()
    };
  } catch (error) {
    await handle.close();
    throw error;
  }
}
