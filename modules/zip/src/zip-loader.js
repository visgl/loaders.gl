import JSZip from 'jszip';

// components

function parseZipAsync(data, options) {
  const fileMap = {};

  const jsZip = new JSZip(options);
  return jsZip.loadAsync(data).then(
    zip => {
      // start to load each file in this zip
      zip.forEach((relativePath, zipEntry) => {
        const subFilename = zipEntry.name;
        jsZip
          .file(subFilename)
          // jszip supports both arraybuffer and text, the main loaders.gl types
          // https://stuk.github.io/jszip/documentation/api_zipobject/async.html
          .async(options.dataType || 'arraybuffer')
          .then(
            arrayBuffer => {
              fileMap[relativePath] = arrayBuffer;
            })
          .catch(error =>
            options.log.error(`Unable to read ${subFilename} from zip archive: ${error}`)
          );
      });
    })
  .catch(error => {
    options.log.error(`Unable to read zip archive: ${error}`);
    throw error;
  });
}

const ZipLoader = {
  name: 'Zip Archive',
  extension: 'zip',
  category: 'archive',
  parseAsync: parseZipAsync
};

export default ZipLoader;
