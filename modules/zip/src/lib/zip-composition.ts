// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  concatenateArrayBuffers,
  path,
  NodeFilesystem,
  NodeFile,
  toArrayBuffer
} from '@loaders.gl/loader-utils';
import {encodeUtf8Text, validateZipPath} from './zip-entry-metadata';
import {CRC32Hash} from '@loaders.gl/crypto';
import type {ZipArchiveOptions} from '../zip-archive-types';
import type {ZipEncodeOptions} from '../zip-encode-types';

import {ZipArchive} from '../zip-archive';
import {
  encodeZipLocalHeader,
  encodeZipCentralHeader,
  encodeZipEndRecords
} from './zip-serialization';

/** Bounds for the retained Node directory-composition API. */
export type ZipCompositionOptions = Pick<
  ZipEncodeOptions,
  'maxArchiveBytes' | 'maxEntries' | 'maxDirectoryBytes' | 'signal'
>;

/** Captured composition limits and the running central-directory byte count. */
interface ZipCompositionState {
  /** Maximum final output bytes. */
  readonly maxArchiveBytes: bigint;
  /** Maximum central-directory bytes. */
  readonly maxDirectoryBytes: number;
  /** Maximum entry records. */
  readonly maxEntries: number;
  /** Cooperative cancellation between file reads and writes. */
  readonly signal?: AbortSignal;
  /** Bytes retained in central headers so far. */
  directoryBytes: number;
}
/** Creates populated STORE headers through the common ZIP32/ZIP64 serializer. */
async function generateFileHeaders(
  fileName: string,
  file: ArrayBuffer,
  offset: bigint
): Promise<[Uint8Array, Uint8Array]> {
  validateZipPath(fileName);
  const header = {
    nameBytes: encodeUtf8Text(fileName),
    date: new Date('1980-01-01T00:00:00Z'),
    flags: 0x800,
    method: 0 as const,
    crc32: Number.parseInt(await new CRC32Hash().hash(file, 'hex'), 16),
    size: BigInt(file.byteLength),
    compressedSize: BigInt(file.byteLength),
    localHeaderOffset: offset,
    zip64: offset >= 0xffffffffn || file.byteLength >= 0xffffffff
  };
  return [
    new Uint8Array(concatenateArrayBuffers(encodeZipLocalHeader(header), file)),
    encodeZipCentralHeader(header)
  ];
}

/** Appends one STORE entry, validating the existing archive before mutation and closing on completion. */
export async function addOneFile(
  zipUrl: string,
  file: ArrayBuffer | ArrayBufferView,
  fileName: string,
  options: ZipArchiveOptions = {}
): Promise<void> {
  await ZipArchive.appendEntry(new NodeFile(zipUrl, 'a+'), fileName, file, options);
}

/**
 * creates zip archive with no compression
 * @note This is a node specific function that works on files
 * @param inputPath path where files for the achive are stored
 * @param outputPath path where zip archive will be placed
 */
export async function createZip(
  inputPath: string,
  outputPath: string,
  createAdditionalData?: (
    fileList: {fileName: string; localHeaderOffset: bigint}[]
  ) => Promise<{path: string; file: ArrayBuffer}>,
  options: ZipCompositionOptions = {}
) {
  const state: ZipCompositionState = {
    maxArchiveBytes: options.maxArchiveBytes ?? 1024n ** 4n,
    maxEntries: options.maxEntries ?? 100000,
    maxDirectoryBytes: options.maxDirectoryBytes ?? 32 * 1024 * 1024,
    signal: options.signal,
    directoryBytes: 0
  };
  if (
    typeof state.maxArchiveBytes !== 'bigint' ||
    state.maxArchiveBytes < 0n ||
    !Number.isSafeInteger(state.maxEntries) ||
    state.maxEntries < 1 ||
    !Number.isSafeInteger(state.maxDirectoryBytes) ||
    state.maxDirectoryBytes < 1
  )
    throw new RangeError('Invalid ZIP composition limits');
  if (state.maxArchiveBytes < 22n) throw new RangeError('ZIP composition archive limit exceeded');
  state.signal?.throwIfAborted();
  const fileIterator = getFileIterator(inputPath);

  const resFile = new NodeFile(outputPath, 'w');
  const fileList: {fileName: string; localHeaderOffset: bigint}[] = [];

  const cdArray: ArrayBuffer[] = [];
  try {
    for await (const file of fileIterator) {
      await addFile(file, resFile, cdArray, state, fileList);
    }
    if (createAdditionalData) {
      const additionaldata = await createAdditionalData(fileList);
      await addFile(additionaldata, resFile, cdArray, state);
    }
    state.signal?.throwIfAborted();
    const cdOffset = (await resFile.stat()).bigsize;
    const cd = concatenateArrayBuffers(...cdArray);
    await resFile.append(new Uint8Array(cd));
    const eoCDStart = (await resFile.stat()).bigsize;
    await resFile.append(
      new Uint8Array(
        encodeZipEndRecords(
          BigInt(cdArray.length),
          BigInt(cd.byteLength),
          cdOffset,
          eoCDStart > 0x7fffffffn || cdArray.length >= 0xffff
        )
      )
    );
  } finally {
    await resFile.close();
  }
}

/**
 * Adds file to zip parts
 * @param file file to add
 * @param resFile zip file body
 * @param cdArray zip file central directory
 * @param fileList list of file offsets
 */
async function addFile(
  file: {path: string; file: ArrayBuffer},
  resFile: NodeFile,
  cdArray: ArrayBuffer[],
  state: ZipCompositionState,
  fileList?: {fileName: string; localHeaderOffset: bigint}[]
) {
  state.signal?.throwIfAborted();
  const size = (await resFile.stat()).bigsize;
  fileList?.push({fileName: file.path, localHeaderOffset: size});
  const [localPart, cdHeaderPart] = await generateFileHeaders(file.path, file.file, size);
  const directoryBytes = state.directoryBytes + cdHeaderPart.byteLength;
  const directoryOffset = size + BigInt(localPart.byteLength);
  const count = cdArray.length + 1;
  const footer = encodeZipEndRecords(
    BigInt(count),
    BigInt(directoryBytes),
    directoryOffset,
    directoryOffset + BigInt(directoryBytes) > 0x7fffffffn || count >= 0xffff
  );
  if (
    count > state.maxEntries ||
    directoryBytes > state.maxDirectoryBytes ||
    directoryOffset + BigInt(directoryBytes + footer.length) > state.maxArchiveBytes
  )
    throw new RangeError('ZIP composition metadata/archive limit exceeded');
  state.signal?.throwIfAborted();
  await resFile.append(localPart);
  state.directoryBytes = directoryBytes;
  cdArray.push(toArrayBuffer(cdHeaderPart));
}

/**
 * creates iterator providing buffer with file content and path to every file in the input folder
 * @param inputPath path to the input folder
 * @returns iterator
 */
export function getFileIterator(
  inputPath: string
): AsyncIterable<{path: string; file: ArrayBuffer}> {
  async function* iterable() {
    const fileList = await getAllFiles(inputPath);
    for (const filePath of fileList) {
      const provider = new NodeFile(path.join(inputPath, filePath), 'r');
      try {
        const {bigsize} = await provider.stat();
        const file = await provider.read(0, Number(bigsize));
        yield {path: filePath, file};
      } finally {
        await provider.close();
      }
    }
  }
  return iterable();
}

/**
 * creates a list of relative paths to all files in the provided folder
 * @param basePath path of the root folder
 * @param subfolder relative path from the root folder.
 * @returns list of paths
 */
export async function getAllFiles(
  basePath: string,
  subfolder: string = '',
  fsPassed?: NodeFilesystem
): Promise<string[]> {
  const fs = fsPassed ? fsPassed : new NodeFilesystem({});
  const files = await fs.readdir(pathJoin(basePath, subfolder));

  const arrayOfFiles: string[] = [];

  for (const file of files) {
    const fullPath = pathJoin(basePath, subfolder, file);
    if ((await fs.stat(fullPath)).isDirectory) {
      const files = await getAllFiles(basePath, pathJoin(subfolder, file));
      arrayOfFiles.push(...files);
    } else {
      arrayOfFiles.push(pathJoin(subfolder, file));
    }
  }

  return arrayOfFiles;
}

/**
 * removes empty parts from path array and joins it
 * @param paths paths to join
 * @returns joined path
 */
function pathJoin(...paths: string[]): string {
  const resPaths: string[] = paths.filter(val => val.length);
  return path.join(...resPaths);
}
