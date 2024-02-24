import {
  FileHandleFile,
  concatenateArrayBuffers,
  path,
  NodeFilesystem,
  NodeFile
} from '@loaders.gl/loader-utils';
import {ZipEoCDRecord, generateEoCD, parseEoCDRecord, updateEoCD} from './end-of-central-directory';
import {CRC32Hash} from '@loaders.gl/crypto';
import {generateLocalHeader} from './local-file-header';
import {generateCDHeader} from './cd-file-header';
import {fetchFile} from '@loaders.gl/core';

/**
 * cut off CD and EoCD records from zip file
 * @param provider zip file
 * @returns tuple with three values: CD, EoCD record, EoCD information
 */
async function cutTheTailOff(
  provider: FileHandleFile
): Promise<[ArrayBuffer, ArrayBuffer, ZipEoCDRecord]> {
  // define where the body ends
  const oldEoCDinfo = await parseEoCDRecord(provider);
  const oldCDStartOffset = oldEoCDinfo.cdStartOffset;

  // define cd length
  const oldCDLength = Number(
    oldEoCDinfo.offsets.zip64EoCDOffset
      ? oldEoCDinfo.offsets.zip64EoCDOffset - oldCDStartOffset
      : oldEoCDinfo.offsets.zipEoCDOffset - oldCDStartOffset
  );

  // cut off everything except of archieve body
  const zipEnding = await provider.slice(oldCDStartOffset, provider.length);
  await provider.truncate(Number(oldCDStartOffset));

  // divide cd body and eocd record
  const oldCDBody = zipEnding.slice(0, oldCDLength);
  const eocdBody = zipEnding.slice(oldCDLength, zipEnding.byteLength);

  return [oldCDBody, eocdBody, oldEoCDinfo];
}

/**
 * generates CD and local headers for the file
 * @param fileName name of the file
 * @param fileToAdd buffer with the file
 * @param localFileHeaderOffset offset of the file local header
 * @returns tuple with two values: local header and file body, cd header
 */
async function generateFileHeaders(
  fileName: string,
  fileToAdd: ArrayBuffer,
  localFileHeaderOffset: bigint
): Promise<[Uint8Array, Uint8Array]> {
  // generating CRC32 of the content
  const newFileCRC322 = parseInt(await new CRC32Hash().hash(fileToAdd, 'hex'), 16);

  // generate local header for the file
  const newFileLocalHeader = generateLocalHeader({
    crc32: newFileCRC322,
    fileName,
    length: fileToAdd.byteLength
  });

  // generate hash file cd header
  const newFileCDHeader = generateCDHeader({
    crc32: newFileCRC322,
    fileName,
    offset: localFileHeaderOffset,
    length: fileToAdd.byteLength
  });
  return [
    new Uint8Array(concatenateArrayBuffers(newFileLocalHeader, fileToAdd)),
    new Uint8Array(newFileCDHeader)
  ];
}

/**
 * adds one file in the end of the archieve
 * @param zipUrl path to the file
 * @param fileToAdd new file body
 * @param fileName new file name
 */
export async function addOneFile(zipUrl: string, fileToAdd: ArrayBuffer, fileName: string) {
  // init file handler
  const provider = new FileHandleFile(zipUrl, true);

  const [oldCDBody, eocdBody, oldEoCDinfo] = await cutTheTailOff(provider);

  // remember the new file local header start offset
  const newFileOffset = provider.length;

  const [localPart, cdHeaderPart] = await generateFileHeaders(fileName, fileToAdd, newFileOffset);

  // write down the file local header
  await provider.append(localPart);

  // add the file CD header to the CD
  const newCDBody = concatenateArrayBuffers(oldCDBody, cdHeaderPart);

  // remember the CD start offset
  const newCDStartOffset = provider.length;

  // write down new CD
  await provider.append(new Uint8Array(newCDBody));

  // remember where eocd starts
  const eocdOffset = provider.length;

  await provider.append(
    updateEoCD(
      eocdBody,
      oldEoCDinfo.offsets,
      newCDStartOffset,
      eocdOffset,
      oldEoCDinfo.cdRecordsNumber + 1n
    )
  );
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
  ) => Promise<{path: string; file: ArrayBuffer}>
) {
  const fileIterator = getFileIterator(inputPath);

  const resFile = new NodeFile(outputPath, 'w');
  const fileList: {fileName: string; localHeaderOffset: bigint}[] = [];

  const cdArray: ArrayBuffer[] = [];
  for await (const file of fileIterator) {
    await addFile(file, resFile, cdArray, fileList);
  }
  if (createAdditionalData) {
    const additionaldata = await createAdditionalData(fileList);
    await addFile(additionaldata, resFile, cdArray);
  }
  const cdOffset = (await resFile.stat()).bigsize;
  const cd = concatenateArrayBuffers(...cdArray);
  await resFile.append(new Uint8Array(cd));
  const eoCDStart = (await resFile.stat()).bigsize;
  await resFile.append(
    new Uint8Array(
      generateEoCD({recordsNumber: cdArray.length, cdSize: cd.byteLength, cdOffset, eoCDStart})
    )
  );
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
  fileList?: {fileName: string; localHeaderOffset: bigint}[]
) {
  const size = (await resFile.stat()).bigsize;
  fileList?.push({fileName: file.path, localHeaderOffset: size});
  const [localPart, cdHeaderPart] = await generateFileHeaders(file.path, file.file, size);
  await resFile.append(localPart);
  cdArray.push(cdHeaderPart);
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
      const file = await (await fetchFile(path.join(inputPath, filePath))).arrayBuffer();
      yield {path: filePath, file};
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
  const resPaths: string[] = paths.filter((val) => val.length);
  return path.join(...resPaths);
}
