import {FileHandleFile, concatenateArrayBuffers} from '@loaders.gl/loader-utils';
import {ZipEoCDRecord, parseEoCDRecord, updateEoCD} from './end-of-central-directory';
import {CRC32Hash} from '@loaders.gl/crypto';
import {generateLocalHeader} from './local-file-header';
import {generateCDHeader} from './cd-file-header';

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

  await provider.append(await updateEoCD(eocdBody, oldEoCDinfo, newCDStartOffset, eocdOffset));
}
