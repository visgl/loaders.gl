// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ReadableFile} from '@loaders.gl/loader-utils';

const CD_HEADER_SIGNATURE = 0x02014b50;
const LOCAL_FILE_HEADER_SIGNATURE = 0x04034b50;
const EOCD_MIN_SIZE = 22;
const EOCD_SEARCH_WINDOW = 22 + 65535;

type ZipEntry = {
  compressionMethod: number;
  compressedSize: number;
  localHeaderOffset: number;
};

/**
 * Minimal random-access ZIP reader used by archive-backed tileset sources.
 */
export class ZipArchive {
  private file: ReadableFile;
  private entries: Map<string, ZipEntry>;

  constructor(file: ReadableFile, entries: Map<string, ZipEntry>) {
    this.file = file;
    this.entries = entries;
  }

  /**
   * Returns the raw entry metadata for a file.
   * @param fileName ZIP entry name.
   * @returns Entry metadata, if present.
   */
  getEntry(fileName: string): ZipEntry | undefined {
    return this.entries.get(fileName);
  }

  /**
   * Reads and inflates a ZIP entry.
   * @param fileName ZIP entry name.
   * @returns File contents.
   */
  async getFile(fileName: string): Promise<ArrayBuffer> {
    const entry = this.entries.get(fileName);
    if (!entry) {
      throw new Error(`No such file in the archive: ${fileName}`);
    }

    const localHeader = await readLocalFileHeader(this.file, entry.localHeaderOffset);
    const compressedFile = await this.file.read(localHeader.fileDataOffset, entry.compressedSize);
    return await decompressZipEntry(compressedFile, entry.compressionMethod);
  }
}

/**
 * Opens a ZIP archive index from a readable file.
 * @param file Random-access file handle.
 * @returns ZIP archive reader.
 */
export async function parseZipArchive(file: ReadableFile): Promise<ZipArchive> {
  const eocdOffset = await findEndOfCentralDirectory(file);
  const eocd = await readRangeAsDataView(file, eocdOffset, EOCD_MIN_SIZE);
  const centralDirectorySize = eocd.getUint32(12, true);
  const centralDirectoryOffset = eocd.getUint32(16, true);
  const centralDirectory = await readRangeAsDataView(
    file,
    centralDirectoryOffset,
    centralDirectorySize
  );
  const entries = new Map<string, ZipEntry>();

  let byteOffset = 0;
  while (byteOffset < centralDirectory.byteLength) {
    if (centralDirectory.getUint32(byteOffset, true) !== CD_HEADER_SIGNATURE) {
      throw new Error('Invalid ZIP central directory header');
    }

    const compressionMethod = centralDirectory.getUint16(byteOffset + 10, true);
    let compressedSize = centralDirectory.getUint32(byteOffset + 20, true);
    const fileNameLength = centralDirectory.getUint16(byteOffset + 28, true);
    const extraFieldLength = centralDirectory.getUint16(byteOffset + 30, true);
    const fileCommentLength = centralDirectory.getUint16(byteOffset + 32, true);
    let localHeaderOffset = centralDirectory.getUint32(byteOffset + 42, true);
    const fileName = decodeText(
      centralDirectory.buffer.slice(
        centralDirectory.byteOffset + byteOffset + 46,
        centralDirectory.byteOffset + byteOffset + 46 + fileNameLength
      ) as ArrayBuffer
    );
    const extraFieldOffset = byteOffset + 46 + fileNameLength;
    if (compressedSize === 0xffffffff || localHeaderOffset === 0xffffffff) {
      const zip64Values = readZip64ExtraField(
        centralDirectory,
        extraFieldOffset,
        extraFieldLength,
        compressedSize === 0xffffffff,
        localHeaderOffset === 0xffffffff
      );
      compressedSize = zip64Values.compressedSize ?? compressedSize;
      localHeaderOffset = zip64Values.localHeaderOffset ?? localHeaderOffset;
    }

    entries.set(fileName, {
      compressionMethod,
      compressedSize,
      localHeaderOffset
    });

    byteOffset += 46 + fileNameLength + extraFieldLength + fileCommentLength;
  }

  return new ZipArchive(file, entries);
}

function readZip64ExtraField(
  centralDirectory: DataView,
  extraFieldOffset: number,
  extraFieldLength: number,
  readCompressedSize: boolean,
  readLocalHeaderOffset: boolean
) {
  let compressedSize: number | undefined;
  let localHeaderOffset: number | undefined;
  let byteOffset = extraFieldOffset;
  const endOffset = extraFieldOffset + extraFieldLength;

  while (byteOffset + 4 <= endOffset) {
    const headerId = centralDirectory.getUint16(byteOffset, true);
    const dataSize = centralDirectory.getUint16(byteOffset + 2, true);
    byteOffset += 4;

    if (headerId === 0x0001) {
      let zip64Offset = byteOffset;
      if (readCompressedSize) {
        compressedSize = Number(centralDirectory.getBigUint64(zip64Offset, true));
        zip64Offset += 8;
      }
      if (readLocalHeaderOffset) {
        localHeaderOffset = Number(centralDirectory.getBigUint64(zip64Offset, true));
      }
      break;
    }

    byteOffset += dataSize;
  }

  return {compressedSize, localHeaderOffset};
}

async function findEndOfCentralDirectory(file: ReadableFile): Promise<number> {
  const size = file.size || Number(file.bigsize) || (await file.stat?.())?.size || 0;
  const searchLength = Math.min(size, EOCD_SEARCH_WINDOW);
  const startOffset = size - searchLength;
  const data = new Uint8Array(await file.read(startOffset, searchLength));

  for (let index = data.length - EOCD_MIN_SIZE; index >= 0; index--) {
    if (
      data[index] === 0x50 &&
      data[index + 1] === 0x4b &&
      data[index + 2] === 0x05 &&
      data[index + 3] === 0x06
    ) {
      return startOffset + index;
    }
  }

  throw new Error('Invalid ZIP archive: missing End Of Central Directory record');
}

async function readLocalFileHeader(file: ReadableFile, offset: number) {
  const header = await readRangeAsDataView(file, offset, 30);
  if (header.getUint32(0, true) !== LOCAL_FILE_HEADER_SIGNATURE) {
    throw new Error('Invalid ZIP local file header');
  }

  const fileNameLength = header.getUint16(26, true);
  const extraFieldLength = header.getUint16(28, true);
  return {
    fileDataOffset: offset + 30 + fileNameLength + extraFieldLength
  };
}

async function readRangeAsDataView(
  file: ReadableFile,
  offset: number,
  length: number
): Promise<DataView> {
  const arrayBuffer = await file.read(offset, length);
  return new DataView(arrayBuffer);
}

async function decompressZipEntry(
  compressedFile: ArrayBuffer,
  compressionMethod: number
): Promise<ArrayBuffer> {
  switch (compressionMethod) {
    case 0:
      return compressedFile;
    case 8:
      return await inflateBuffer(compressedFile, 'deflate-raw');
    default:
      throw new Error(`Unsupported ZIP compression method: ${compressionMethod}`);
  }
}

/**
 * Inflates a compressed buffer using browser streams when available or Node zlib as fallback.
 * @param compressedFile Compressed bytes.
 * @param format Compression format.
 * @returns Decompressed bytes.
 */
export async function inflateBuffer(
  compressedFile: ArrayBuffer,
  format: 'deflate-raw' | 'gzip'
): Promise<ArrayBuffer> {
  if (typeof DecompressionStream !== 'undefined') {
    const decompressionStream = new DecompressionStream(format);
    const response = new Response(
      new Blob([compressedFile]).stream().pipeThrough(decompressionStream)
    );
    return await response.arrayBuffer();
  }

  const zlib = await import('node:zlib');
  const nodeBuffer = Buffer.from(compressedFile);
  const decompressedBuffer =
    format === 'gzip' ? zlib.gunzipSync(nodeBuffer) : zlib.inflateRawSync(nodeBuffer);
  return decompressedBuffer.buffer.slice(
    decompressedBuffer.byteOffset,
    decompressedBuffer.byteOffset + decompressedBuffer.byteLength
  );
}

function decodeText(arrayBuffer: ArrayBuffer): string {
  return new TextDecoder().decode(arrayBuffer);
}
