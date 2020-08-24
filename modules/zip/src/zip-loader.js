import JSZip from 'jszip';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export const ZipLoader = {
  id: 'zip',
  name: 'Zip Archive',
  version: VERSION,
  extensions: ['zip'],
  mimeTypes: ['application/zip'],
  category: 'archive',
  tests: ['PK'],
  parse: parseZipAsync
};

// TODO - Could return a map of promises, perhaps as an option...
async function parseZipAsync(data, options) {
  const promises = [];
  const fileMap = {};

  try {
    const jsZip = new JSZip();

    const zip = await jsZip.loadAsync(data, options);

    // start to load each file in this zip
    zip.forEach((relativePath, zipEntry) => {
      const subFilename = zipEntry.name;

      const promise = loadZipEntry(jsZip, subFilename, options).then(arrayBufferOrError => {
        fileMap[relativePath] = arrayBufferOrError;
      });

      // Ensure Promise.all doesn't ignore rejected promises.
      promises.push(promise);
    });

    await Promise.all(promises);
    return fileMap;
  } catch (error) {
    options.log.error(`Unable to read zip archive: ${error}`);
    throw error;
  }
}

async function loadZipEntry(jsZip, subFilename, options) {
  // jszip supports both arraybuffer and text, the main loaders.gl types
  // https://stuk.github.io/jszip/documentation/api_zipobject/async.html
  try {
    const arrayBuffer = await jsZip.file(subFilename).async(options.dataType || 'arraybuffer');
    return arrayBuffer;
  } catch (error) {
    options.log.error(`Unable to read ${subFilename} from zip archive: ${error}`);
    // Store error in place of data in map
    return error;
  }
}
