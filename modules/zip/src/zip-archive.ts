// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {BlobFile, type ReadableFile} from '@loaders.gl/loader-utils';
import {DeflateDecompressor} from '@loaders.gl/compression/deflate-decompressor';
import {CRC32Hash} from '@loaders.gl/crypto';
import {decodeZipHeader, decodeZipText, type ZipHeaderMetadata} from './lib/zip-entry-metadata';
import type {
  ZipArchiveInput,
  ZipArchiveOptions,
  ZipEntry,
  ZipReadOptions,
  ZipRangeOptions
} from './zip-archive-types';

/** Validated directory location; payload reads cannot extend into it. */
interface ZipDirectory {
  /** Absolute central-directory offset. */
  readonly offset: bigint;
  /** Central-directory byte length. */
  readonly size: bigint;
  /** Declared entry count. */
  readonly count: bigint;
  /** Decoded archive comment. */
  readonly comment: string;
}

/** Default physical and decoded limits, independent of the archive's retained storage. */
const DEFAULT_OPTIONS = {
  maxArchiveBytes: 1024n ** 4n,
  maxDirectoryBytes: 32 * 1024 * 1024,
  maxEntries: 100000,
  maxReadBytes: 1024 * 1024,
  maxCompressedBytes: 64n * 1024n * 1024n,
  maxDecodedBytes: 64n * 1024n * 1024n,
  chunkBytes: 64 * 1024
} as const;

/**
 * Owns one bounded, random-access ZIP32/ZIP64 file and its lazily cached directory.
 * Complete reads verify CRC; partial STORE reads do not. Source bytes must remain immutable.
 * Use openZipArchive to initialize; close releases the supplied file exactly once.
 */
export class ZipArchive {
  /** Archive byte length, without losing ZIP64 precision. */
  readonly size: bigint;
  /** Archive comment, decoded using legacy ZIP CP437. */
  readonly comment: string;
  /** Shared file limits captured at open time. */
  private readonly limits: Required<Omit<ZipArchiveOptions, 'signal'>>;
  /** Owned random-access transport. */
  private readonly file: ReadableFile;
  /** File lifetime, including in-flight operations. */
  private readonly controller = new AbortController();
  /** Initialization/caller cancellation combined with close. */
  private readonly signal: AbortSignal;
  /** Validated directory boundary. */
  private directory!: ZipDirectory;
  /** A single directory-index promise shared by concurrent lookups. */
  private directoryPromise?: Promise<Map<string, ZipHeaderMetadata>>;
  /** Local-header validation shared by repeated path reads. */
  private readonly entriesByOffset = new Map<bigint, Promise<ZipEntry>>();
  /** Central-validated named lookups share their local-header work. */
  private readonly entriesByPath = new Map<string, Promise<ZipEntry>>();
  /** Next local-header boundary for central-validated, nonoverlapping payloads. */
  private readonly nextOffsets = new Map<bigint, bigint>();
  /** Only entries issued by this archive can be used for reads. */
  private readonly issuedEntries = new WeakSet<ZipEntry>();
  /** Idempotent file cleanup, including open failure. */
  private closePromise?: Promise<void>;

  /** Captures the owned transport and validates independent limits. */
  private constructor(file: ReadableFile, size: bigint, options: ZipArchiveOptions) {
    this.file = file;
    this.size = size;
    this.comment = '';
    this.limits = {
      maxArchiveBytes: options.maxArchiveBytes ?? DEFAULT_OPTIONS.maxArchiveBytes,
      maxDirectoryBytes: options.maxDirectoryBytes ?? DEFAULT_OPTIONS.maxDirectoryBytes,
      maxEntries: options.maxEntries ?? DEFAULT_OPTIONS.maxEntries,
      maxReadBytes: options.maxReadBytes ?? DEFAULT_OPTIONS.maxReadBytes,
      maxCompressedBytes: options.maxCompressedBytes ?? DEFAULT_OPTIONS.maxCompressedBytes,
      maxDecodedBytes: options.maxDecodedBytes ?? DEFAULT_OPTIONS.maxDecodedBytes,
      chunkBytes: options.chunkBytes ?? DEFAULT_OPTIONS.chunkBytes
    };
    for (const [name, value] of Object.entries(this.limits)) {
      const bigintLimit = ['maxArchiveBytes', 'maxCompressedBytes', 'maxDecodedBytes'].includes(
        name
      );
      if (
        bigintLimit
          ? typeof value !== 'bigint' || value < 0n
          : typeof value !== 'number' || !Number.isSafeInteger(value) || value < 1
      )
        throw new RangeError(`Invalid ZIP ${name} limit`);
    }
    this.signal = options.signal
      ? AbortSignal.any([this.controller.signal, options.signal])
      : this.controller.signal;
  }

  /** Initializes directory bounds without scanning entries or reading their payloads. */
  static async open(input: ZipArchiveInput, options: ZipArchiveOptions = {}): Promise<ZipArchive> {
    const file = normalizeZipInput(input);
    let archive: ZipArchive | undefined;
    try {
      const advertisedSize = file.bigsize;
      const status =
        advertisedSize === undefined || advertisedSize === 0n ? await file.stat?.() : undefined;
      const reportedBigsize = status?.bigsize ?? file.bigsize;
      const size =
        reportedBigsize !== undefined && reportedBigsize !== 0n
          ? reportedBigsize
          : BigInt(status?.size || file.size);
      archive = new ZipArchive(file, size, options);
      archive.signal.throwIfAborted();
      if (size < 22n || size > archive.limits.maxArchiveBytes)
        throw new RangeError('ZIP archive size limit or minimum header size');
      archive.directory = await archive.readDirectoryLocation();
      Object.defineProperty(archive, 'comment', {value: archive.directory.comment});
      return archive;
    } catch (error) {
      if (archive) await archive.close();
      else await file.close();
      throw error;
    }
  }

  /** Enumerates validated entries in central-directory order; metadata is indexed once. */
  async *entries(): AsyncIterable<ZipEntry> {
    for (const path of (await this.getDirectory()).keys()) yield (await this.getEntry(path))!;
  }

  /** Looks up a canonical path; returns undefined when the entry is absent. */
  async getEntry(path: string): Promise<ZipEntry | undefined> {
    this.signal.throwIfAborted();
    const metadata = (await this.getDirectory()).get(path);
    if (!metadata) return undefined;
    let promise = this.entriesByPath.get(path);
    if (!promise) {
      promise = this.getValidatedEntry(metadata.localHeaderOffset, metadata).catch(error => {
        this.entriesByPath.delete(path);
        throw error;
      });
      this.entriesByPath.set(path, promise);
    }
    return await promise;
  }

  /**
   * Validates a populated local header at an index-provided offset without a directory scan.
   * Descriptor entries fall back to the shared directory because their local sizes may be zero.
   * Direct access validates local layout/bounds; central consistency requires named lookup.
   */
  async getEntryAt(localHeaderOffset: bigint): Promise<ZipEntry> {
    this.signal.throwIfAborted();
    const existing = this.entriesByOffset.get(localHeaderOffset);
    if (existing) return await existing;
    const metadata = await this.readLocalHeader(localHeaderOffset);
    if (metadata.header.flags & 8) {
      for (const header of (await this.getDirectory()).values())
        if (header.localHeaderOffset === localHeaderOffset)
          return (await this.getEntry(header.path))!;
      throw new Error('Invalid ZIP archive: indexed offset missing from directory');
    }
    return await this.getValidatedEntry(localHeaderOffset, undefined, metadata);
  }

  /** Reads one complete entry and verifies its decoded size and CRC-32. */
  async read(entryOrPath: ZipEntry | string, options: ZipReadOptions = {}): Promise<ArrayBuffer> {
    const signal = this.getReadSignal(options);
    signal.throwIfAborted();
    const entry = await this.resolveEntry(entryOrPath);
    signal.throwIfAborted();
    this.checkEntryBudget(entry);
    if (entry.size > BigInt(Number.MAX_SAFE_INTEGER))
      throw new RangeError('ZIP allocation is not safely representable');
    const output = new Uint8Array(Number(entry.size));
    let offset = 0;
    for await (const chunk of this.readInBatches(entry, options)) {
      output.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return output.buffer;
  }

  /** Streams decoded chunks with backpressure; consuming through completion verifies CRC-32. */
  async *readInBatches(
    entryOrPath: ZipEntry | string,
    options: ZipReadOptions = {}
  ): AsyncIterable<Uint8Array<ArrayBuffer>> {
    const signal = this.getReadSignal(options);
    signal.throwIfAborted();
    const entry = await this.resolveEntry(entryOrPath);
    signal.throwIfAborted();
    this.checkEntryBudget(entry);
    let decodedBytes = 0n;
    let checksum = 0;
    const hash = new CRC32Hash({
      crypto: {
        onEnd: (result: {hash: string}) => {
          checksum = Number.parseInt(result.hash, 16);
        }
      }
    });
    const compressed = this.readPayloadChunks(entry, signal);
    const decoded =
      entry.compression === 'store'
        ? compressed
        : new DeflateDecompressor({raw: true}).decompressBatches(compressed);
    for await (const chunk of hash.hashBatches(decoded, 'hex')) {
      signal.throwIfAborted();
      decodedBytes += BigInt(chunk.byteLength);
      if (decodedBytes > entry.size || decodedBytes > this.limits.maxDecodedBytes)
        throw new RangeError('ZIP decoded entry size limit exceeded');
      yield new Uint8Array(chunk);
    }
    signal.throwIfAborted();
    if (decodedBytes !== entry.size) throw new Error('Invalid ZIP archive: decoded size mismatch');
    if (checksum !== entry.crc32) throw new Error('Invalid ZIP archive: CRC-32 mismatch');
  }

  /** Reads only a STORE byte range. Partial reads cannot verify a whole-entry CRC. */
  async readRange(entryOrPath: ZipEntry | string, options: ZipRangeOptions): Promise<ArrayBuffer> {
    const signal = this.getReadSignal(options);
    signal.throwIfAborted();
    const entry = await this.resolveEntry(entryOrPath);
    if (entry.compression !== 'store') throw new Error('ZIP ranges require STORE entries');
    if (
      options.start < 0n ||
      options.end < options.start ||
      options.end > entry.size ||
      options.end - options.start > BigInt(this.limits.maxReadBytes)
    )
      throw new RangeError('ZIP byte-range limit exceeded');
    return await this.readExact(
      entry.dataOffset + options.start,
      Number(options.end - options.start),
      signal
    );
  }

  /** Cancels reads and closes the owned transport exactly once; all subsequent reads reject. */
  close(): Promise<void> {
    this.controller.abort(new Error('ZIP archive is closed'));
    this.closePromise ||= this.file.close();
    return this.closePromise;
  }

  /** Resolves a named entry or rejects metadata not issued by this archive. */
  private async resolveEntry(entryOrPath: ZipEntry | string): Promise<ZipEntry> {
    this.signal.throwIfAborted();
    const entry = typeof entryOrPath === 'string' ? await this.getEntry(entryOrPath) : entryOrPath;
    if (!entry || !this.issuedEntries.has(entry))
      throw new Error('ZIP entry not found or belongs to another archive');
    return entry;
  }

  /** Combines per-read cancellation with the owned lifetime. */
  private getReadSignal(options: ZipReadOptions): AbortSignal {
    return options.signal ? AbortSignal.any([this.signal, options.signal]) : this.signal;
  }

  /** Checks whole-entry consumption before allocation or decompression. */
  private checkEntryBudget(entry: ZipEntry): void {
    if (
      entry.size > this.limits.maxDecodedBytes ||
      entry.compressedSize > this.limits.maxCompressedBytes
    )
      throw new RangeError('ZIP entry compressed/decoded byte limit exceeded');
  }

  /** Yields compressed bytes without retaining a complete entry. */
  private async *readPayloadChunks(
    entry: ZipEntry,
    signal: AbortSignal
  ): AsyncIterable<ArrayBuffer> {
    const chunkBytes = Math.min(this.limits.chunkBytes, this.limits.maxReadBytes);
    for (let offset = 0n; offset < entry.compressedSize; offset += BigInt(chunkBytes)) {
      const length = Number(minimumBigInt(BigInt(chunkBytes), entry.compressedSize - offset));
      yield await this.readExact(entry.dataOffset + offset, length, signal);
    }
  }

  /** Performs exact, bounded physical reads and rejects truncated transports. */
  private async readExact(
    offset: bigint,
    length: number,
    signal = this.signal
  ): Promise<ArrayBuffer> {
    signal.throwIfAborted();
    if (
      offset < 0n ||
      !Number.isSafeInteger(length) ||
      length < 0 ||
      offset + BigInt(length) > this.size
    )
      throw new Error('Invalid ZIP archive: read outside file');
    const output = new Uint8Array(length);
    for (let copied = 0; copied < length; ) {
      const readBytes = Math.min(length - copied, this.limits.maxReadBytes);
      const bytes = await this.file.read(offset + BigInt(copied), readBytes, signal);
      signal.throwIfAborted();
      if (bytes.byteLength !== readBytes)
        throw new Error('Invalid ZIP archive: truncated file read');
      output.set(new Uint8Array(bytes), copied);
      copied += readBytes;
    }
    return output.buffer;
  }

  /** Finds an EOCD whose complete comment ends at EOF, not a signature embedded in the comment. */
  private async readDirectoryLocation(): Promise<ZipDirectory> {
    const magic = new DataView(await this.readExact(0n, 4)).getUint32(0, true);
    if (magic !== 0x04034b50 && magic !== 0x06054b50 && magic !== 0x06064b50)
      throw new Error('Unsupported ZIP prefix or archive format');
    const tailLength = Number(minimumBigInt(this.size, 65557n));
    const tailStart = this.size - BigInt(tailLength);
    const tail = new DataView(await this.readExact(tailStart, tailLength));
    let position = -1;
    for (let candidate = tailLength - 22; candidate >= 0; candidate--) {
      if (
        tail.getUint32(candidate, true) !== 0x06054b50 ||
        candidate + 22 + tail.getUint16(candidate + 20, true) !== tailLength
      )
        continue;
      position = candidate;
      // An empty record inside a real archive comment must not hide its earlier end record.
      // Empty directories with unreferenced local records remain valid candidates.
      if (tail.getUint16(candidate + 10, true) !== 0 || magic === 0x06064b50) break;
    }
    if (position < 0) throw new Error('Invalid ZIP archive: end record not found');
    const disk = tail.getUint16(position + 4, true);
    const directoryDisk = tail.getUint16(position + 6, true);
    if ((disk !== 0 && disk !== 0xffff) || (directoryDisk !== 0 && directoryDisk !== 0xffff))
      throw new Error('Unsupported split ZIP archive');
    const onDisk = BigInt(tail.getUint16(position + 8, true));
    let count = BigInt(tail.getUint16(position + 10, true));
    let size = BigInt(tail.getUint32(position + 12, true));
    let offset = BigInt(tail.getUint32(position + 16, true));
    let footerOffset = tailStart + BigInt(position);
    let zip64 = false;
    if (footerOffset >= 20n) {
      const locator = new DataView(await this.readExact(footerOffset - 20n, 20));
      const locatorInsideDirectory =
        size !== 0xffffffffn && offset !== 0xffffffffn && offset + size > footerOffset - 20n;
      if (locator.getUint32(0, true) === 0x07064b50 && !locatorInsideDirectory) {
        zip64 = true;
        if (locator.getUint32(4, true) || locator.getUint32(16, true) !== 1)
          throw new Error('Unsupported split ZIP64 archive');
        const zip64Offset = locator.getBigUint64(8, true);
        const record = new DataView(await this.readExact(zip64Offset, 56));
        if (
          record.getUint32(0, true) !== 0x06064b50 ||
          record.getBigUint64(4, true) < 44n ||
          zip64Offset + 12n + record.getBigUint64(4, true) !== footerOffset - 20n ||
          record.getUint32(16, true) ||
          record.getUint32(20, true) ||
          record.getBigUint64(24, true) !== record.getBigUint64(32, true)
        )
          throw new Error('Invalid ZIP64 end record');
        const zip64Count = record.getBigUint64(32, true);
        const zip64Size = record.getBigUint64(40, true);
        const zip64DirectoryOffset = record.getBigUint64(48, true);
        if (
          (onDisk !== 0xffffn && onDisk !== zip64Count) ||
          (count !== 0xffffn && count !== zip64Count) ||
          (size !== 0xffffffffn && size !== zip64Size) ||
          (offset !== 0xffffffffn && offset !== zip64DirectoryOffset)
        )
          throw new Error('Invalid ZIP64 legacy end values');
        count = zip64Count;
        size = zip64Size;
        offset = zip64DirectoryOffset;
        footerOffset = zip64Offset;
      } else if (size === 0xffffffffn || offset === 0xffffffffn)
        throw new Error('Invalid ZIP archive: ZIP64 locator missing');
    } else if (size === 0xffffffffn || offset === 0xffffffffn)
      throw new Error('Invalid ZIP archive: ZIP64 locator missing');
    if (!zip64) {
      if (disk === 0xffff || directoryDisk === 0xffff)
        throw new Error('Invalid ZIP archive: ZIP64 locator missing');
      if (onDisk !== count) throw new Error('Invalid ZIP archive: inconsistent entry counts');
    }
    if (count > BigInt(this.limits.maxEntries) || size > BigInt(this.limits.maxDirectoryBytes))
      throw new RangeError('ZIP directory entry/byte limit exceeded');
    if (offset + size > footerOffset || size < count * 46n || (count === 0n) !== (size === 0n))
      throw new Error('Invalid ZIP archive: directory outside bounds');
    if (count && new DataView(await this.readExact(offset, 4)).getUint32(0, true) !== 0x02014b50)
      throw new Error('Invalid ZIP archive: directory signature missing');
    const comment = decodeZipText(new Uint8Array(tail.buffer, position + 22), false);
    return {count, size, offset, comment};
  }

  /** Indexes central metadata once, without eagerly reading every local header. */
  private getDirectory(): Promise<Map<string, ZipHeaderMetadata>> {
    this.signal.throwIfAborted();
    this.directoryPromise ||= this.readDirectory().catch(error => {
      this.directoryPromise = undefined;
      this.nextOffsets.clear();
      throw error;
    });
    return this.directoryPromise;
  }

  /** Parses exact directory records, including comments and Unicode/ZIP64 extras. */
  private async readDirectory(): Promise<Map<string, ZipHeaderMetadata>> {
    const bytes = new Uint8Array(
      await this.readExact(this.directory.offset, Number(this.directory.size))
    );
    const view = new DataView(bytes.buffer);
    const entries = new Map<string, ZipHeaderMetadata>();
    const offsets = new Set<bigint>();
    let position = 0;
    for (let index = 0n; index < this.directory.count; index++) {
      if (position + 46 > bytes.byteLength)
        throw new Error('Invalid ZIP archive: truncated directory');
      const length =
        46 +
        view.getUint16(position + 28, true) +
        view.getUint16(position + 30, true) +
        view.getUint16(position + 32, true);
      const header = decodeZipHeader(bytes.subarray(position, position + length), true);
      if (entries.has(header.path) || offsets.has(header.localHeaderOffset))
        throw new Error('Invalid ZIP archive: duplicate path or local-header offset');
      entries.set(header.path, header);
      offsets.add(header.localHeaderOffset);
      position += length;
    }
    const sortedOffsets = [...offsets].sort((left, right) =>
      left < right ? -1 : left > right ? 1 : 0
    );
    sortedOffsets.forEach((offset, index) =>
      this.nextOffsets.set(offset, sortedOffsets[index + 1] ?? this.directory.offset)
    );
    if (position !== bytes.byteLength)
      throw new Error('Invalid ZIP archive: directory length mismatch');
    return entries;
  }

  /** Reads local metadata without inspecting unrelated payloads. */
  private async readLocalHeader(
    offset: bigint
  ): Promise<{header: ZipHeaderMetadata; dataOffset: bigint}> {
    if (offset < 0n || offset + 30n > this.directory.offset)
      throw new Error('Invalid ZIP archive: local header outside data region');
    const fixed = new DataView(await this.readExact(offset, 30));
    const length = 30 + fixed.getUint16(26, true) + fixed.getUint16(28, true);
    if (offset + BigInt(length) > this.directory.offset)
      throw new Error('Invalid ZIP archive: local metadata overlaps directory');
    const bytes = new Uint8Array(length);
    bytes.set(new Uint8Array(fixed.buffer));
    bytes.set(new Uint8Array(await this.readExact(offset + 30n, length - 30)), 30);
    const header = decodeZipHeader(bytes, false);
    return {header, dataOffset: offset + BigInt(length)};
  }

  /** Shares local validation; a later named lookup additionally verifies central metadata. */
  private async getValidatedEntry(
    offset: bigint,
    central?: ZipHeaderMetadata,
    localMetadata?: {header: ZipHeaderMetadata; dataOffset: bigint}
  ): Promise<ZipEntry> {
    if (central) return await this.validateEntry(offset, central);
    let entry = this.entriesByOffset.get(offset);
    if (!entry) {
      entry = this.validateEntry(offset, undefined, localMetadata).catch(error => {
        this.entriesByOffset.delete(offset);
        throw error;
      });
      this.entriesByOffset.set(offset, entry);
    }
    return await entry;
  }

  /** Validates local/central identity, payload bounds and signed or unsigned descriptors. */
  private async validateEntry(
    offset: bigint,
    central?: ZipHeaderMetadata,
    localMetadata?: {header: ZipHeaderMetadata; dataOffset: bigint}
  ): Promise<ZipEntry> {
    const {header: local, dataOffset} = localMetadata ?? (await this.readLocalHeader(offset));
    const metadata = central || local;
    const descriptor = Boolean(local.flags & 8);
    if (
      central &&
      (central.flags !== local.flags ||
        central.method !== local.method ||
        central.nameBytes.length !== local.nameBytes.length ||
        central.nameBytes.some((value, index) => value !== local.nameBytes[index]) ||
        (!descriptor &&
          (central.crc32 !== local.crc32 ||
            central.size !== local.size ||
            central.compressedSize !== local.compressedSize)))
    )
      throw new Error('Invalid ZIP archive: local/central metadata mismatch');
    if (metadata.method === 0 && metadata.size !== metadata.compressedSize)
      throw new Error('Invalid ZIP archive: STORE sizes mismatch');
    if (
      central &&
      descriptor &&
      ((local.crc32 !== 0 && local.crc32 !== central.crc32) ||
        (local.size !== 0n && local.size !== central.size) ||
        (local.compressedSize !== 0n && local.compressedSize !== central.compressedSize))
    )
      throw new Error('Invalid ZIP archive: descriptor local/central metadata mismatch');
    const payloadEnd = dataOffset + metadata.compressedSize;
    const entryEnd = central ? this.nextOffsets.get(offset)! : this.directory.offset;
    if (payloadEnd > entryEnd) throw new Error('Invalid ZIP archive: payload overlaps directory');
    if (descriptor)
      await this.validateDescriptor(
        payloadEnd,
        metadata,
        local.zip64 || Boolean(central?.zip64),
        entryEnd
      );
    const entry: ZipEntry = Object.freeze({
      path: metadata.path,
      directory: metadata.path.endsWith('/'),
      compression: metadata.method === 0 ? 'store' : 'deflate',
      size: metadata.size,
      compressedSize: metadata.compressedSize,
      crc32: metadata.crc32,
      localHeaderOffset: offset,
      dataOffset,
      comment: central?.comment || ''
    });
    this.issuedEntries.add(entry);
    return entry;
  }

  /** Resolves the optional descriptor signature using the expected CRC and sizes. */
  private async validateDescriptor(
    offset: bigint,
    metadata: ZipHeaderMetadata,
    zip64: boolean,
    entryEnd: bigint
  ): Promise<void> {
    const length = Number(minimumBigInt(24n, entryEnd - offset));
    const bytes = new DataView(await this.readExact(offset, length));
    for (const wide of zip64 ? [true, false] : [false, true]) {
      if (!wide && (metadata.size > 0xffffffffn || metadata.compressedSize > 0xffffffffn)) continue;
      const descriptorLength = wide ? 20 : 12;
      for (const prefix of [4, 0]) {
        if (
          length < prefix + descriptorLength ||
          (prefix && bytes.getUint32(0, true) !== 0x08074b50)
        )
          continue;
        const compressed = wide
          ? bytes.getBigUint64(prefix + 4, true)
          : BigInt(bytes.getUint32(prefix + 4, true));
        const decoded = wide
          ? bytes.getBigUint64(prefix + 12, true)
          : BigInt(bytes.getUint32(prefix + 8, true));
        if (
          bytes.getUint32(prefix, true) === metadata.crc32 &&
          compressed === metadata.compressedSize &&
          decoded === metadata.size
        )
          return;
      }
    }
    throw new Error('Invalid ZIP archive: data descriptor mismatch');
  }
}

/** Opens one owned ZIP archive; close it when entry reads finish. */
export async function openZipArchive(
  input: ZipArchiveInput,
  options: ZipArchiveOptions = {}
): Promise<ZipArchive> {
  return await ZipArchive.open(input, options);
}

/** Preserves typed-array subview boundaries and uses existing Blob/random-access transports. */
function normalizeZipInput(input: ZipArchiveInput): ReadableFile {
  if (input instanceof ArrayBuffer) return new BlobFile(input);
  if (ArrayBuffer.isView(input))
    return new BlobFile(
      new Blob([new Uint8Array(input.buffer, input.byteOffset, input.byteLength).slice()])
    );
  if (input instanceof Blob) return new BlobFile(input);
  return input;
}

/** Compares ZIP64 offsets without coercing them to Number. */
function minimumBigInt(left: bigint, right: bigint): bigint {
  return left < right ? left : right;
}
