// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {isBrowser, BlobFile, NodeFile} from '@loaders.gl/loader-utils';
import type {FileSystem, ReadableFile} from '@loaders.gl/loader-utils';
import {IndexedArchive} from './IndexedArchive';
import {openZipArchive, type ZipArchive} from '../zip-archive';
import type {ZipArchiveInput, ZipArchiveOptions, ZipEntry} from '../zip-archive-types';

/** Validated entry metadata with a FileSystem-compatible numeric size. */
export type ZipFileStat = Omit<ZipEntry, 'size'> & {
  /** Decoded length as a safe integer for FileSystem callers. */
  readonly size: number;
  /** Exact decoded length, including ZIP64 values. */
  readonly uncompressedSize: bigint;
};

/** An owned ZIP filesystem with cached lookup, confined resources and STORE byte ranges. */
export class ZipFileSystem implements FileSystem {
  /** Owned random-access transport. */
  readonly file: ReadableFile;
  /** Optional archive name used in response URLs. */
  readonly fileName?: string;
  /** Optional format adapter retaining resource aliases and content-level decoding. */
  readonly archive: IndexedArchive | null;
  /** Shared reader initialization, performed once when first needed. */
  private readerPromise?: Promise<ZipArchive>;
  /** Cancellation for opening and all reads during the filesystem lifetime. */
  private readonly controller = new AbortController();
  /** Caller cancellation combined with filesystem destruction. */
  private readonly signal: AbortSignal;
  /** Idempotent transport release. */
  private destroyPromise?: Promise<void>;

  /** Opens portable bytes, a random-access file, a format adapter, or a Node file path lazily. */
  constructor(
    file: ZipArchiveInput | IndexedArchive | string,
    /** Shared reader bounds captured for lazy initialization. */
    private readonly options: ZipArchiveOptions = {}
  ) {
    this.signal = options.signal
      ? AbortSignal.any([this.controller.signal, options.signal])
      : this.controller.signal;
    this.archive = file instanceof IndexedArchive ? file : null;
    if (typeof file === 'string') {
      if (isBrowser)
        throw new Error('ZipFileSystem cannot open file paths in browser environments');
      this.fileName = file;
      this.file = new NodeFile(file);
    } else if (file instanceof IndexedArchive) {
      this.file = file.file;
      this.fileName = file.fileName;
    } else if (file instanceof Blob || file instanceof ArrayBuffer) {
      this.file = new BlobFile(file);
    } else if (ArrayBuffer.isView(file)) {
      this.file = new BlobFile(
        Uint8Array.from(new Uint8Array(file.buffer, file.byteOffset, file.byteLength)).buffer
      );
    } else {
      this.file = file;
    }
  }

  /** Cancels pending reads and closes the owned file once; later operations reject. */
  destroy(): Promise<void> {
    this.controller.abort(new Error('ZIP filesystem is closed'));
    this.destroyPromise ||= this.readerPromise
      ? this.readerPromise.then(
          reader => reader.close(),
          () => {}
        )
      : this.file.close();
    return this.destroyPromise;
  }

  /** Lists validated archive paths in central-directory order, including directory entries. */
  async readdir(): Promise<string[]> {
    const reader = await this.getReader();
    const paths: string[] = [];
    for await (const entry of reader.entries()) paths.push(entry.path);
    return paths;
  }

  /** Returns validated metadata; rejects sizes that cannot be represented safely as a number. */
  async stat(filename: string): Promise<ZipFileStat> {
    const entry = await this.getEntry(filename);
    if (entry.size > BigInt(Number.MAX_SAFE_INTEGER))
      throw new RangeError('ZIP FileSystem size is not safely representable');
    return {...entry, size: Number(entry.size), uncompressedSize: entry.size};
  }

  /**
   * Fetches a confined resource. Complete streams verify CRC when consumed through completion.
   * Single STORE ranges return 206 or 416; compressed and format-decoded ranges reject.
   */
  async fetch(filename: string, options: RequestInit = {}): Promise<Response> {
    this.signal.throwIfAborted();
    options.signal?.throwIfAborted();
    if (options.method && options.method.toUpperCase() !== 'GET')
      throw new Error('ZIP filesystem only supports GET');
    let path: string;
    const range = new Headers(options.headers).get('range');
    let response: Response;
    if (this.archive) {
      path = this.resolveResourcePath(filename);
      if (range !== null)
        throw new Error('ZIP ranges are unavailable through format resource adapters');
      response = new Response(await this.archive.getFile(path, 'http'));
      this.signal.throwIfAborted();
      options.signal?.throwIfAborted();
    } else {
      const reader = await this.getReader();
      options.signal?.throwIfAborted();
      const entry = await this.getEntry(filename);
      options.signal?.throwIfAborted();
      path = entry.path;
      const headers = new Headers({
        'Accept-Ranges': entry.compression === 'store' ? 'bytes' : 'none',
        'Content-Length': String(entry.size)
      });
      if (range !== null) {
        if (entry.compression !== 'store') throw new Error('ZIP ranges require STORE entries');
        const bounds = parseByteRange(range, entry.size);
        if (!bounds) {
          headers.set('Content-Range', `bytes */${entry.size}`);
          headers.set('Content-Length', '0');
          response = new Response(null, {status: 416, headers});
        } else {
          const bytes = await reader.readRange(entry, {
            ...bounds,
            signal: options.signal || undefined
          });
          headers.set('Content-Range', `bytes ${bounds.start}-${bounds.end - 1n}/${entry.size}`);
          headers.set('Content-Length', String(bounds.end - bounds.start));
          response = new Response(bytes, {status: 206, headers});
        }
      } else {
        const iterator = reader
          .readInBatches(entry, {signal: options.signal || undefined})
          [Symbol.asyncIterator]();
        const stream = new ReadableStream<Uint8Array<ArrayBuffer>>(
          {
            async pull(controller) {
              try {
                const chunk = await iterator.next();
                if (chunk.done) controller.close();
                else controller.enqueue(chunk.value);
              } catch (error) {
                controller.error(error);
              }
            },
            async cancel() {
              await iterator.return?.();
            }
          },
          {highWaterMark: 0}
        );
        response = new Response(stream, {headers});
      }
    }
    Object.defineProperty(response, 'url', {
      value: this.getResourceUrl(path)
    });
    return response;
  }

  /** Resolves resources once, allowing parents inside the archive but rejecting root escapes. */
  private resolveResourcePath(filename: string, decodeUri = false): string {
    const archivePath = filename.startsWith('./') ? filename.slice(2) : filename;
    const archiveName = this.fileName?.replace(/^\.\//, '');
    if (archiveName && (archivePath === archiveName || archivePath.startsWith(`${archiveName}/`))) {
      filename = archivePath.slice(archiveName.length).replace(/^\//, '');
      decodeUri = true;
    }
    decodeUri ||= filename.startsWith('/') || filename.startsWith('./');
    if (/^[a-z][a-z\d+.-]*:/i.test(filename) || filename.startsWith('//'))
      throw new Error('ZIP resource must stay inside the archive');
    const decoded = decodeUri ? decodeURIComponent(filename.split(/[?#]/, 1)[0]) : filename;
    if (
      decoded.includes('\\') ||
      decoded.includes('\0') ||
      decoded.startsWith('//') ||
      /^[a-z][a-z\d+.-]*:/i.test(decoded)
    )
      throw new Error('ZIP resource must stay inside the archive');
    const segments: string[] = [];
    for (const segment of decoded.split('/')) {
      if (!segment || segment === '.') continue;
      if (segment === '..') {
        if (!segments.length) throw new Error('ZIP resource escapes the archive');
        segments.pop();
      } else segments.push(segment);
    }
    return segments.join('/') + (decoded.endsWith('/') && segments.length ? '/' : '');
  }

  /** Creates a qualified URL that cannot be confused with a canonical literal archive path. */
  private getResourceUrl(path: string): string {
    const prefix =
      this.fileName && !/^(?:\/|[a-z][a-z\d+.-]*:)/i.test(this.fileName)
        ? `./${this.fileName.replace(/^\.\//, '')}`
        : this.fileName || '';
    return `${prefix}/${path.split('/').map(encodeURIComponent).join('/')}`;
  }

  /** Shares the directory cache and lifetime with every filesystem lookup. */
  private async getReader(): Promise<ZipArchive> {
    this.signal.throwIfAborted();
    this.readerPromise ||= openZipArchive(this.file, {
      ...this.options,
      signal: this.signal
    });
    return await this.readerPromise;
  }

  /** Resolves one validated entry and reports absent resources explicitly. */
  private async getEntry(path: string): Promise<ZipEntry> {
    const reader = await this.getReader();
    const entry =
      (await reader.getEntry(path)) ||
      (await reader.getEntry(this.resolveResourcePath(path, true)));
    if (!entry) throw new Error(`File has not been found in the zip archive: ${path}`);
    return entry;
  }
}

/** Parses one inclusive HTTP byte range into an exclusive bounded STORE slice. */
function parseByteRange(value: string, size: bigint): {start: bigint; end: bigint} | undefined {
  const match = /^bytes=(\d*)-(\d*)$/i.exec(value.trim());
  if (!match || (!match[1] && !match[2]) || size === 0n) return undefined;
  if (!match[1]) {
    const suffix = BigInt(match[2]);
    if (!suffix) return undefined;
    return {start: suffix < size ? size - suffix : 0n, end: size};
  }
  const start = BigInt(match[1]);
  const last = match[2] ? BigInt(match[2]) : size - 1n;
  if (start >= size || last < start) return undefined;
  return {start, end: last < size ? last + 1n : size};
}
