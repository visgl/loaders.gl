// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import {readHDF5ObjectHeader} from './hdf5-object-header';
import {getHDF5CompactLinks} from './hdf5-links';
import {parseHDF5ChunkLayout, resolveHDF5ChunkIndex} from './hdf5-chunk-index';
import {readHDF5ChunkSelection, type HDF5ChunkSelection} from './hdf5-chunk-reader';
import {parseHDF5FilterPipeline} from './hdf5-filters';
import {parseHDF5FillValue} from './hdf5-fill-value';
import {
  parseHDF5Dataspace,
  parseHDF5PrimitiveType,
  parseHDF5ContiguousLayout,
  decodeHDF5Primitive
} from './hdf5-dataset-messages';
import {HTTPRangeReader} from './http-range-reader';
import {
  HDF5MemorySource,
  readHDF5Superblock,
  type HDF5ByteSource,
  type HDF5Superblock
} from './hdf5-binary';

/** Experimental pure TypeScript reader for supported HDF5 numeric datasets. */
export class HDF5TypeScriptFile {
  /** Create a reader from a byte source and parsed superblock. */
  private constructor(
    /** Source of HDF5 bytes. */
    readonly bytes: HDF5ByteSource,
    /** Parsed HDF5 superblock. */
    readonly superblock: HDF5Superblock
  ) {}
  /** Open an HDF5 byte source and read its superblock. */
  static async open(source: HDF5ByteSource, signal?: AbortSignal): Promise<HDF5TypeScriptFile> {
    return new HDF5TypeScriptFile(source, await readHDF5Superblock(source, signal));
  }
  /** Read a chunked numeric dataset by compact hard-link path and optional hyperslab. */
  async readChunkedDataset(path: string, selection?: HDF5ChunkSelection, signal?: AbortSignal) {
    const address = await this.resolvePath(path, signal);
    const header = await readHDF5ObjectHeader(this.bytes, this.superblock, address, signal);
    const get = (type: number) => {
      const matches = header.messages.filter(message => message.type === type);
      if (matches.length !== 1) throw new Error('HDF5: expected one message of type ' + type);
      return matches[0].payload;
    };
    const space = parseHDF5Dataspace(get(1), this.superblock.lengthSize);
    const type = parseHDF5PrimitiveType(get(3));
    const layout = parseHDF5ChunkLayout(
      get(8),
      space.shape.length,
      this.superblock.offsetSize,
      this.superblock.lengthSize
    );
    if (layout.elementSize !== type.size) throw new Error('HDF5: chunk element size mismatch');
    const filters = header.messages.some(message => message.type === 11)
      ? parseHDF5FilterPipeline(get(11))
      : [];
    const chunks = await resolveHDF5ChunkIndex(
      this.bytes,
      this.superblock,
      layout,
      space.shape,
      signal
    );
    const fillMessage = header.messages.find(message => message.type === 5);
    const fillValue = fillMessage ? parseHDF5FillValue(fillMessage.payload, type) : undefined;
    return readHDF5ChunkSelection(
      this.bytes,
      {
        shape: space.shape,
        chunkShape: layout.chunkShape,
        type,
        filters,
        chunks,
        fillValue
      },
      selection ?? space.shape.map(length => [0, length]),
      {signal}
    );
  }
  /** Resolve compact hard-link paths, rejecting dense groups and soft/external links. */
  async resolvePath(path: string, signal?: AbortSignal): Promise<bigint> {
    if (!path.startsWith('/')) throw new Error('HDF5: expected absolute dataset path');
    const parts = path.split('/').slice(1).filter(Boolean);
    if (parts.some(part => part === '.' || part === '..')) throw new Error('HDF5: invalid path');
    let address = this.superblock.rootObjectHeaderAddress;
    for (const part of parts) {
      const header = await readHDF5ObjectHeader(this.bytes, this.superblock, address, signal);
      const link = getHDF5CompactLinks(header.messages, this.superblock.offsetSize).find(
        item => item.name === part
      );
      if (!link) throw new Error('HDF5: dataset/group not found: ' + path);
      address = link.address;
    }
    return address;
  }
  /** Read a contiguous numeric dataset by compact hard-link path. */
  async readDataset(
    path: string,
    signal?: AbortSignal
  ): Promise<{
    shape: number[];
    data: ArrayBufferView;
  }> {
    return this.readContiguousDataset(await this.resolvePath(path, signal), signal);
  }
  /**
   * Read a numeric contiguous dataset by known object-header address.
   * Addresses are relative to the HDF5 base.
   */
  async readContiguousDataset(
    objectAddress: bigint,
    signal?: AbortSignal
  ): Promise<{
    shape: number[];
    data: ArrayBufferView;
  }> {
    const header = await readHDF5ObjectHeader(this.bytes, this.superblock, objectAddress, signal);
    const get = (type: number) => {
      const matches = header.messages.filter(message => message.type === type);
      if (matches.length !== 1) throw new Error('HDF5: expected one message of type ' + type);
      return matches[0].payload;
    };
    const space = parseHDF5Dataspace(get(1), this.superblock.lengthSize);
    const type = parseHDF5PrimitiveType(get(3));
    const layout = parseHDF5ContiguousLayout(
      get(8),
      this.superblock.offsetSize,
      this.superblock.lengthSize
    );
    if (
      layout.byteLength !== space.elementCount * type.size ||
      layout.byteLength > 512 * 1024 * 1024
    ) {
      throw new Error('HDF5: contiguous dataset size mismatch or limit exceeded');
    }
    const address = this.superblock.baseAddress + layout.address;
    if (address > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error('HDF5: unsafe data address');
    const bytes = await this.bytes.read(Number(address), layout.byteLength, signal);
    if (bytes.length !== layout.byteLength) throw new Error('HDF5: truncated dataset');
    return {shape: space.shape, data: decodeHDF5Primitive(bytes, type)};
  }
  /** Open an in-memory HDF5 file. */
  static fromBytes(
    data: ArrayBuffer | Uint8Array,
    signal?: AbortSignal
  ): Promise<HDF5TypeScriptFile> {
    return HDF5TypeScriptFile.open(new HDF5MemorySource(data), signal);
  }
  /** Open an HDF5 file through HTTP range requests. */
  static fromURL(url: string, signal?: AbortSignal): Promise<HDF5TypeScriptFile> {
    return HDF5TypeScriptFile.open(new HTTPRangeReader(url), signal);
  }
}
