// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {DeflateCompressor} from '@loaders.gl/compression/deflate-compressor';
import {CRC32Hash} from '@loaders.gl/crypto';
import {decodeZipText, validateZipPath} from './lib/zip-entry-metadata';
import {
  encodeZipLocalHeader,
  encodeZipCentralHeader,
  encodeZipDescriptor,
  encodeZipEndRecords,
  encodeZipTimestamp,
  type ZipHeaderEntry
} from './lib/zip-serialization';
import type {
  ZipByteChunk,
  ZipByteSource,
  ZipEncodeEntry,
  ZipEncodeFiles,
  ZipEncodeOptions
} from './zip-encode-types';

/** Captured, validated settings shared by both encoders. */
const DEFAULT_OPTIONS = {
  compression: 'store',
  zip64: 'auto',
  maxArchiveBytes: 1024n ** 4n,
  maxEntryBytes: 1024n ** 4n,
  maxDirectoryBytes: 32 * 1024 * 1024,
  maxEntries: 100000,
  chunkBytes: 64 * 1024
} as const;

/** Immutable metadata captured before any source reads. */
interface PreparedEntry {
  /** Caller-owned source, consumed once. */
  readonly source: ZipByteSource;
  /** Captured byte length for buffers/Blobs; streams have unknown length. */
  readonly size?: bigint;
  /** Header fields before final CRC and compressed size are known. */
  readonly header: ZipHeaderEntry;
}

/**
 * Encodes a deterministic ZIP from named buffers, Blobs, or byte streams.
 * Returns one buffer, so callers needing bounded output storage should use encodeZipInBatches.
 * Source bytes must remain immutable. Cancellation/failure discards this encoder's partial output.
 */
export async function encodeZip(
  files: ZipEncodeFiles,
  options: ZipEncodeOptions = {}
): Promise<ArrayBuffer> {
  const chunks: Uint8Array<ArrayBuffer>[] = [];
  let size = 0;
  for await (const chunk of encodeZipInBatches(files, options)) {
    if (size + chunk.length > 0xffffffff)
      throw new RangeError('ZIP buffer capacity exceeded; use encodeZipInBatches');
    chunks.push(chunk);
    size += chunk.length;
  }
  const output = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.length;
  }
  return output.buffer;
}

/**
 * Streams independent ZIP chunks with backpressure and signed data descriptors.
 * Metadata is retained within maxDirectoryBytes; no complete payload/archive is allocated.
 * Auto ZIP64 reserves 64-bit sizes for streams and DEFLATE, whose encoded size is unknown.
 * Consumers own discarding partial output on cancellation/failure and finalizing storage.
 */
export async function* encodeZipInBatches(
  files: ZipEncodeFiles,
  options: ZipEncodeOptions = {}
): AsyncIterable<Uint8Array<ArrayBuffer>> {
  const settings = {
    compression: options.compression ?? DEFAULT_OPTIONS.compression,
    zip64: options.zip64 ?? DEFAULT_OPTIONS.zip64,
    maxArchiveBytes: options.maxArchiveBytes ?? DEFAULT_OPTIONS.maxArchiveBytes,
    maxEntryBytes: options.maxEntryBytes ?? DEFAULT_OPTIONS.maxEntryBytes,
    maxDirectoryBytes: options.maxDirectoryBytes ?? DEFAULT_OPTIONS.maxDirectoryBytes,
    maxEntries: options.maxEntries ?? DEFAULT_OPTIONS.maxEntries,
    chunkBytes: options.chunkBytes ?? DEFAULT_OPTIONS.chunkBytes
  };
  validateSettings(settings);
  const signal = options.signal;
  signal?.throwIfAborted();
  const comment = encodeArchiveComment(options.comment ?? '');
  const date = options.date ?? new Date('1980-01-01T00:00:00Z');
  encodeZipTimestamp(date);
  const paths = Object.keys(files).sort();
  if (paths.length > settings.maxEntries) throw new RangeError('ZIP entry count limit exceeded');
  if (settings.zip64 === 'never' && paths.length > 0xffff)
    throw new RangeError('ZIP32 entry count capacity exceeded');
  let minimumDirectoryBytes = 0;
  const entries: PreparedEntry[] = paths.map(path => {
    validateZipPath(path);
    const value = files[path];
    const entry: ZipEncodeEntry =
      value && typeof value === 'object' && 'data' in value
        ? (value as ZipEncodeEntry)
        : {data: value as ZipByteSource};
    const size = getSourceSize(entry.data);
    const directory = path.endsWith('/');
    const compression = entry.compression ?? settings.compression;
    if (compression !== 'store' && compression !== 'deflate')
      throw new TypeError('Unsupported ZIP compression');
    if (size !== undefined && (size > settings.maxEntryBytes || (directory && size !== 0n)))
      throw new RangeError('ZIP entry byte limit or nonempty directory');
    if (path.length > 0xffff || (entry.comment?.length ?? 0) > 0xffff)
      throw new RangeError('ZIP name/comment exceeds header capacity');
    if (entry.comment !== undefined && typeof entry.comment !== 'string')
      throw new TypeError('ZIP entry comment must be a string');
    const nameBytes = new TextEncoder().encode(path);
    const commentBytes = new TextEncoder().encode(entry.comment ?? '');
    encodeZipTimestamp(entry.date ?? date);
    const timestamp = new Date((entry.date ?? date).getTime());
    const zip64 =
      settings.zip64 === 'always' ||
      (settings.zip64 === 'auto' &&
        (size === undefined || size >= 0xffffffffn || (!directory && compression === 'deflate')));
    const header: ZipHeaderEntry = {
      nameBytes,
      commentBytes,
      date: timestamp,
      method: directory || compression === 'store' ? 0 : 8,
      flags: 0x808,
      crc32: 0,
      size: size ?? 0n,
      compressedSize: 0n,
      localHeaderOffset: 0n,
      zip64,
      directory
    };
    // Validate name/comment capacities and ZIP32 fields before any source is consumed.
    encodeZipCentralHeader(header);
    minimumDirectoryBytes += 46 + nameBytes.length + commentBytes.length + (zip64 ? 28 : 0);
    if (minimumDirectoryBytes > settings.maxDirectoryBytes)
      throw new RangeError('ZIP directory byte limit exceeded');
    return {source: entry.data, size, header};
  });
  let outputBytes = 0n;
  let directoryBytes = 0;
  let usedZip64 = settings.zip64 === 'always';
  const directory: Uint8Array<ArrayBuffer>[] = [];
  /** Copies bounded independent output chunks; transferred buffers cannot detach retained metadata. */
  function* emit(bytes: Uint8Array): Iterable<Uint8Array<ArrayBuffer>> {
    for (let offset = 0; offset < bytes.length; offset += settings.chunkBytes) {
      signal?.throwIfAborted();
      const chunk = bytes.slice(offset, offset + settings.chunkBytes);
      if (outputBytes + BigInt(chunk.length) > settings.maxArchiveBytes)
        throw new RangeError('ZIP archive output byte limit exceeded');
      outputBytes += BigInt(chunk.length);
      yield chunk;
      signal?.throwIfAborted();
    }
  }
  for (const entry of entries) {
    signal?.throwIfAborted();
    const zip64 = entry.header.zip64 || (settings.zip64 === 'auto' && outputBytes >= 0xffffffffn);
    const header = {...entry.header, localHeaderOffset: outputBytes, zip64};
    usedZip64 ||= zip64;
    yield* emit(encodeZipLocalHeader(header));
    let size = 0n;
    let compressedSize = 0n;
    let checksum = 0;
    /** Applies entry limits to each input block before CRC/compression. */
    async function* measuredInput(): AsyncIterable<ArrayBuffer> {
      for await (const block of readSource(entry.source, settings.chunkBytes, signal)) {
        size += BigInt(block.byteLength);
        if (size > settings.maxEntryBytes || (header.directory && size !== 0n))
          throw new RangeError('ZIP entry byte limit or nonempty directory');
        if (!zip64 && size >= 0xffffffffn) throw new RangeError('ZIP32 entry capacity exceeded');
        yield block;
      }
      if (entry.size !== undefined && size !== entry.size)
        throw new TypeError('ZIP source size changed during encoding');
    }
    const hash = new CRC32Hash({
      crypto: {
        /** Captures the CRC after all decoded input bytes have been consumed. */
        onEnd: (result: {/** Hex-encoded CRC digest. */ hash: string}) => {
          checksum = Number.parseInt(result.hash, 16);
        }
      }
    });
    const input = hash.hashBatches(measuredInput(), 'hex');
    const payload =
      header.method === 8 ? new DeflateCompressor({raw: true}).compressBatches(input) : input;
    for await (const block of payload) {
      signal?.throwIfAborted();
      compressedSize += BigInt(block.byteLength);
      if (!zip64 && compressedSize >= 0xffffffffn)
        throw new RangeError('ZIP32 compressed entry capacity exceeded');
      yield* emit(new Uint8Array(block));
    }
    const finalHeader = {...header, size, compressedSize, crc32: checksum};
    yield* emit(encodeZipDescriptor(finalHeader));
    const centralHeader = encodeZipCentralHeader(finalHeader);
    directoryBytes += centralHeader.length;
    if (directoryBytes > settings.maxDirectoryBytes)
      throw new RangeError('ZIP directory byte limit exceeded');
    directory.push(centralHeader);
  }
  const directoryOffset = outputBytes;
  const zip64 =
    usedZip64 ||
    (settings.zip64 === 'auto' &&
      (paths.length >= 0xffff || directoryBytes >= 0xffffffff || directoryOffset >= 0xffffffffn));
  const footer = encodeZipEndRecords(
    BigInt(paths.length),
    BigInt(directoryBytes),
    directoryOffset,
    zip64,
    comment
  );
  for (const header of directory) yield* emit(header);
  yield* emit(footer);
}

/** Rejects invalid runtime option values, including JavaScript callers bypassing the types. */
function validateSettings(
  settings: Required<Omit<ZipEncodeOptions, 'date' | 'comment' | 'signal'>>
): void {
  if (settings.compression !== 'store' && settings.compression !== 'deflate')
    throw new TypeError('Unsupported ZIP compression');
  if (!['auto', 'always', 'never'].includes(settings.zip64))
    throw new TypeError('Invalid ZIP64 policy');
  for (const [name, value] of Object.entries(settings)) {
    if (name === 'compression' || name === 'zip64') continue;
    const bigintLimit = name === 'maxArchiveBytes' || name === 'maxEntryBytes';
    if (
      bigintLimit
        ? typeof value !== 'bigint' || value < 0n
        : typeof value !== 'number' || !Number.isSafeInteger(value) || value < 1
    )
      throw new RangeError(`Invalid ZIP ${name} limit`);
  }
}

/** Returns native buffer/Blob sizes; iterator inputs deliberately remain unknown. */
function getSourceSize(source: ZipByteSource): bigint | undefined {
  if (source instanceof ArrayBuffer || ArrayBuffer.isView(source)) return BigInt(source.byteLength);
  if (source instanceof Blob)
    return BigInt(Object.getOwnPropertyDescriptor(Blob.prototype, 'size')!.get!.call(source));
  if (
    !source ||
    typeof source !== 'object' ||
    (!(source instanceof ReadableStream) &&
      !(Symbol.asyncIterator in source) &&
      !(Symbol.iterator in source))
  )
    throw new TypeError('ZIP source must be bytes, a Blob or a byte stream');
  return undefined;
}

/** Copies input slices in bounded blocks, respecting byte offsets and closing interrupted streams. */
async function* readSource(
  source: ZipByteSource,
  chunkBytes: number,
  signal?: AbortSignal
): AsyncIterable<ArrayBuffer> {
  if (source instanceof Blob) {
    const size = Number(getSourceSize(source)!);
    for (let offset = 0; offset < size; offset += chunkBytes) {
      signal?.throwIfAborted();
      const blob = Blob.prototype.slice.call(source, offset, Math.min(size, offset + chunkBytes));
      const block = await awaitWithSignal(Blob.prototype.arrayBuffer.call(blob), signal);
      signal?.throwIfAborted();
      if (block.byteLength !== Math.min(chunkBytes, size - offset))
        throw new TypeError('ZIP Blob returned a truncated block');
      yield block;
    }
    return;
  }
  if (source instanceof ArrayBuffer || ArrayBuffer.isView(source)) {
    yield* splitByteChunk(source, chunkBytes, signal);
    return;
  }
  const reader = source instanceof ReadableStream ? source.getReader() : undefined;
  const iterator = reader
    ? undefined
    : Symbol.asyncIterator in source
      ? source[Symbol.asyncIterator]()
      : (source as Iterable<ZipByteChunk>)[Symbol.iterator]();
  let done = false;
  try {
    while (!done) {
      signal?.throwIfAborted();
      const result = await awaitWithSignal(
        reader ? reader.read() : Promise.resolve(iterator!.next()),
        signal
      );
      done = Boolean(result.done);
      if (!done) yield* splitByteChunk(result.value!, chunkBytes, signal);
    }
  } finally {
    if (reader) {
      if (!done) void reader.cancel(signal?.reason).catch(() => {});
      reader.releaseLock();
    } else if (!done && iterator?.return) {
      void Promise.resolve()
        .then(() => iterator.return!())
        .catch(() => {});
    }
  }
}

/** Validates binary chunks and copies views before the source or consumer can reuse them. */
function* splitByteChunk(
  chunk: ZipByteChunk,
  chunkBytes: number,
  signal?: AbortSignal
): Iterable<ArrayBuffer> {
  if (!(chunk instanceof ArrayBuffer) && !ArrayBuffer.isView(chunk))
    throw new TypeError('ZIP stream chunks must be binary');
  const bytes =
    chunk instanceof ArrayBuffer
      ? new Uint8Array(chunk)
      : new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength);
  const length = bytes.length;
  for (let offset = 0; offset < length; offset += chunkBytes) {
    signal?.throwIfAborted();
    if (bytes.byteLength !== length) throw new TypeError('ZIP source size changed during encoding');
    yield bytes.slice(offset, offset + chunkBytes).buffer;
  }
}

/** Observes cancellation while an asynchronous source pull is pending, without starting another pull. */
function awaitWithSignal<T>(promise: Promise<T>, signal?: AbortSignal): Promise<T> {
  if (!signal) return promise;
  return new Promise((resolve, reject) => {
    /** Removes the listener and settles this one source operation. */
    const finish = (settle: () => void) => {
      signal.removeEventListener('abort', abort);
      settle();
    };
    /** Rejects immediately; source cleanup is owned by readSource. */
    const abort = () => finish(() => reject(signal.reason));
    signal.addEventListener('abort', abort, {once: true});
    promise.then(
      value => finish(() => resolve(value)),
      error => finish(() => reject(error))
    );
    if (signal.aborted) abort();
  });
}

/** Encodes archive comments in CP437, which has no archive-level UTF-8 flag. */
function encodeArchiveComment(comment: string): Uint8Array<ArrayBuffer> {
  if (typeof comment !== 'string') throw new TypeError('ZIP archive comment must be a string');
  const codepoints = [...comment];
  if (codepoints.length > 0xffff) throw new RangeError('ZIP archive comment exceeds 65535 bytes');
  const alphabet = decodeZipText(
    Uint8Array.from({length: 256}, (_, index) => index),
    false
  );
  const bytes = new Uint8Array(codepoints.length);
  codepoints.forEach((character, index) => {
    const position = alphabet.indexOf(character);
    if (position < 0) throw new TypeError('ZIP archive comment is not representable in CP437');
    bytes[index] = position;
  });
  return bytes;
}
