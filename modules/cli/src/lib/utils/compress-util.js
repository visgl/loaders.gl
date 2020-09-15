import {createGzip} from 'zlib';
import {join} from 'path';
import {createReadStream, createWriteStream} from 'fs';
import archiver from 'archiver';
import {removeFile} from './file-utils';
import {ChildProcessProxy} from '@loaders.gl/loader-utils';

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

async function compressWithChildProcessUnix(inputFolder, outputFile, level = 0) {
  const fullOutputFile = join(process.cwd(), outputFile); // eslint-disable-line no-undef
  const args = [`-${level}`, '-r', fullOutputFile, '.'];
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

async function compressWithChildProcessWindows(inputFolder, outputFile, level = 0, sevenZipExe) {
  const fullOutputFile = join(process.cwd(), outputFile); // eslint-disable-line no-undef
  const inputArgument = join('.', '*');
  const args = ['a', '-tzip', `-mx=${level}`, fullOutputFile, inputArgument];
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
