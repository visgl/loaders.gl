import {createGzip} from 'zlib';
import {join} from 'path';
import {promises as fs, createReadStream, createWriteStream} from 'fs';
import archiver from 'archiver';
import {removeFile} from './file-utils';
import {ChildProcessProxy} from '@loaders.gl/worker-utils';
import JSZip from 'jszip';
import {MD5HashTransform} from '@loaders.gl/crypto';
import crypt from 'crypt';

export function compressFileWithGzip(pathFile) {
  const compressedPathFile = `${pathFile}.gz`;
  const gzip = createGzip();
  const input = createReadStream(pathFile);
  const output = createWriteStream(compressedPathFile);

  return new Promise((resolve, reject) => {
    input.on('end', () => {
      console.log(`${compressedPathFile} compressed and saved.`); // eslint-disable-line no-undef,no-console
      resolve(compressedPathFile);
    });
    input.on('error', error => {
      console.log(`${compressedPathFile}: compression error!`); // eslint-disable-line no-undef,no-console
      reject(error);
    });
    input.pipe(gzip).pipe(output);
  });
}

export async function compressFilesWithZip(fileMap, outputFile, level = 0) {
  // Before creating a new file, we need to delete the old file
  try {
    await removeFile(outputFile);
  } catch (e) {
    // Do nothing if old file doesn't exist
  }

  const output = createWriteStream(outputFile);
  const archive = archiver('zip', {
    zlib: {level} // Sets the compression level.
  });

  return new Promise(async (resolve, reject) => {
    // listen for all archive data to be writte
    // 'close' event is fired only when a file descriptor is involved
    output.on('close', function() {
      console.log(`${outputFile} saved.`); // eslint-disable-line no-undef,no-console
      console.log(`${archive.pointer()} total bytes`); // eslint-disable-line no-undef,no-console
      resolve();
    });

    // This event is fired when the data source is drained no matter what was the data source.
    // It is not part of this library but rather from the NodeJS Stream API.
    // @see: https://nodejs.org/api/stream.html#stream_event_end
    output.on('end', function() {
      console.log('Data has been drained'); // eslint-disable-line no-undef,no-console
      resolve();
    });

    // good practice to catch warnings (ie stat failures and other non-blocking errors)
    archive.on('warning', function(err) {
      console.log(err); // eslint-disable-line no-undef,no-console
      reject(err);
    });

    // good practice to catch this error explicitly
    archive.on('error', function(err) {
      reject(err);
    });

    // pipe archive data to the file
    archive.pipe(output);

    for (const subFileName in fileMap) {
      const subFileData = fileMap[subFileName];
      await appendFileToArchive(archive, subFileName, subFileData);
    }

    // finalize the archive (ie we are done appending files but streams have to finish yet)
    archive.finalize();
  });
}

export async function compressWithChildProcess() {
  // eslint-disable-next-line no-undef
  if (process.platform === 'win32') {
    await compressWithChildProcessWindows(...arguments);
  } else {
    await compressWithChildProcessUnix(...arguments);
  }
}

async function compressWithChildProcessUnix(inputFolder, outputFile, level = 0, inputFiles = '.') {
  const fullOutputFile = join(process.cwd(), outputFile); // eslint-disable-line no-undef
  const args = [`-${level}`, '-r', fullOutputFile, inputFiles];
  const childProcess = new ChildProcessProxy();
  await childProcess.start({
    command: 'zip',
    arguments: args,
    spawn: {
      cwd: inputFolder
    },
    wait: 0
  });
}

async function compressWithChildProcessWindows(
  inputFolder,
  outputFile,
  level = 0,
  inputFiles = join('.', '*'),
  sevenZipExe
) {
  // Workaround for @listfile issue. In 7z.exe @-leading files are handled as listfiles
  // https://sevenzip.osdn.jp/chm/cmdline/syntax.htm
  if (inputFiles[0] === '@') {
    inputFiles = `*${inputFiles.substr(1)}`;
  }

  const fullOutputFile = join(process.cwd(), outputFile); // eslint-disable-line no-undef
  const args = ['a', '-tzip', `-mx=${level}`, fullOutputFile, inputFiles];
  const childProcess = new ChildProcessProxy();
  await childProcess.start({
    command: sevenZipExe,
    arguments: args,
    spawn: {
      cwd: `${inputFolder}`
    },
    wait: 0
  });
}

export async function generateHash128FromZip(inputZipFile, outputFile) {
  const input = await fs.readFile(inputZipFile);
  const zip = await JSZip.loadAsync(input);
  const hashTable = [];
  const zipFiles = zip.files;
  for (const relativePath in zipFiles) {
    const zipEntry = zipFiles[relativePath];
    // Had to use a workaround because the correct string is getting the wrong data
    // const content = await zipEntry.async('nodebuffer');
    // _data isn't described in the interface, so lint thought it was wrong
    const _data = '_data';
    const content = zipEntry[_data].compressedContent;
    if (zipEntry.dir) continue; // eslint-disable-line no-continue
    // eslint-disable-next-line no-undef
    const hash = await MD5HashTransform.run(Buffer.from(relativePath.toLowerCase()));
    // eslint-disable-next-line no-undef
    hashTable.push({key: atob(hash), value: content.byteOffset});
  }

  hashTable.sort((prev, next) => {
    if (prev.key === next.key) {
      return prev.value < next.value ? -1 : 1;
    }
    return prev.key < next.key ? -1 : 1;
  });

  const output = createWriteStream(outputFile);
  return new Promise((resolve, reject) => {
    output.on('close', function() {
      console.log(`${outputFile} generated and saved`); // eslint-disable-line
      resolve();
    });
    output.on('error', function(err) {
      console.log(err); // eslint-disable-line
      reject(err);
    });
    for (const key in hashTable) {
      const item = hashTable[key];
      const value = _longToByteArray(item.value);
      // TODO: perhaps you need to wait for the 'drain' event if the write returns 'false'
      // eslint-disable-next-line no-undef
      output.write(Buffer.from(crypt.hexToBytes(item.key).concat(value)));
    }
    output.close();
  });
}

function _longToByteArray(long) {
  const buffer = new ArrayBuffer(8); // JS numbers are 8 bytes long, or 64 bits
  const longNum = new Float64Array(buffer); // so equivalent to Float64
  longNum[0] = long;
  return Array.from(new Uint8Array(buffer)).reverse(); // reverse to get little endian
}

export async function addFileToZip(inputFolder, fileName, zipFile, sevenZipExe) {
  await compressWithChildProcess(inputFolder, zipFile, 0, fileName, sevenZipExe);
  console.log(`${fileName} added to ${zipFile}.`); // eslint-disable-line
}

function appendFileToArchive(archive, subFileName, subFileData) {
  return new Promise(resolve => {
    const fileStream = createReadStream(subFileData);
    console.log(`Compression start: ${subFileName}`); // eslint-disable-line no-undef,no-console
    fileStream.on('close', () => {
      console.log(`Compression finish: ${subFileName}`); // eslint-disable-line no-undef,no-console
      resolve();
    });
    archive.append(fileStream, {name: subFileName});
  });
}
