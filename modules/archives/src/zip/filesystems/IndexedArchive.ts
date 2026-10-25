// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ReadableFile} from '@loaders.gl/core/loader-utils';
import {MD5Hash} from '@loaders.gl/crypto';
import {openZipArchive, type ZipArchive} from '../zip-archive';
import {parseHashTable} from '../hash-file-utility';
import type {ZipArchiveOptions} from '../zip-archive-types';

/** Base transport for formats with a final MD5 path/local-offset index. */
export abstract class IndexedArchive {
  /** Owned random-access archive source. */
  readonly file: ReadableFile;
  /** Optional resource URL prefix. */
  readonly fileName?: string;
  /** Format-provided path hashes, or a directory-derived fallback. */
  protected hashTable?: Record<string, bigint>;
  /** Cancellation for metadata initialization and indexed reads. */
  private readonly controller = new AbortController();
  /** Shared lazy ZIP reader and directory cache. */
  private readerPromise?: Promise<ZipArchive>;
  /** Idempotent release even when no reader has been opened. */
  private closePromise?: Promise<void>;

  /** Captures the source and an optional already-loaded format index. */
  constructor(
    file: ReadableFile,
    hashTable?: Record<string, bigint>,
    fileName?: string,
    /** Independent reader budgets captured for lazy initialization. */
    private readonly options: ZipArchiveOptions = {}
  ) {
    this.file = file;
    this.hashTable = hashTable;
    this.fileName = fileName;
  }

  /** Reads a format resource; adapters retain aliases and content-level decoding. */
  abstract getFile(path: string, mode?: string): Promise<ArrayBuffer>;

  /**
   * Loads a final index when present, otherwise hashes validated directory entries.
   * The format supplies the reserved name and fallback path-case policy. Returns true for an index.
   */
  async initializeIndex(indexPath: string, lowercasePaths = false): Promise<boolean> {
    const reader = await this.getZipArchive();
    const last = await reader.getLastEntry();
    if (last?.path === indexPath) {
      this.hashTable = parseHashTable(await reader.read(last));
      return true;
    }
    const hash = new MD5Hash();
    const table: Record<string, bigint> = Object.create(null);
    for await (const entry of reader.entries()) {
      const path = lowercasePaths ? entry.path.toLowerCase() : entry.path;
      const digest = await hash.hash(new TextEncoder().encode(path).buffer, 'hex');
      if (digest in table) throw new Error('Duplicate ZIP index path hash');
      table[digest] = entry.localHeaderOffset;
    }
    this.hashTable = table;
    return false;
  }

  /** Closes the reader/transport exactly once and rejects subsequent resource reads. */
  async close(): Promise<void> {
    this.controller.abort(new Error('ZIP archive is closed'));
    this.closePromise ||= this.readerPromise
      ? this.readerPromise.then(
          reader => reader.close(),
          () => {}
        )
      : this.file.close();
    await this.closePromise;
  }

  /** Reads and verifies a complete ZIP entry, retaining direct indexed local-header access. */
  protected async readZipEntry(path: string): Promise<ArrayBuffer | undefined> {
    const reader = await this.getZipArchive();
    let entry;
    if (this.hashTable) {
      const digest = await new MD5Hash().hash(new TextEncoder().encode(path).buffer, 'hex');
      const offset = this.hashTable[digest];
      if (offset === undefined) return undefined;
      entry = await reader.getEntryAt(offset);
      if (entry.path.toLowerCase() !== path.toLowerCase())
        throw new Error('ZIP index path mismatch');
    } else entry = await reader.getEntry(path);
    return entry ? await reader.read(entry) : undefined;
  }

  /** Compatibility helper for adapters with no path index. */
  protected async getFileWithoutHash(path: string): Promise<ArrayBuffer> {
    const data = await this.readZipEntry(path);
    if (!data) throw new Error(`No such file in the archive: ${path}`);
    return data;
  }

  /** Initializes container metadata once without reading unrelated payloads. */
  async getZipArchive(): Promise<ZipArchive> {
    if (this.closePromise) throw new Error('ZIP archive is closed');
    this.readerPromise ||= openZipArchive(this.file, {
      ...this.options,
      signal: this.options.signal
        ? AbortSignal.any([this.controller.signal, this.options.signal])
        : this.controller.signal
    });
    return await this.readerPromise;
  }
}
