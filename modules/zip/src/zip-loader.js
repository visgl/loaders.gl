import JSZip from 'jszip';

export const ZipLoader = {
  name: 'Zip Archive',
  extensions: ['zip'],
  mimeType: 'application/zip',
  category: 'archive',
  test: 'PK',
  parse: parseZipAsync
};

// TODO - Could return a map of promises, perhaps as an option...
function parseZipAsync(data, options) {
  const promises = [];
  const fileMap = {};

  const jsZip = new JSZip();
  return (
    jsZip
      .loadAsync(data, options)
      .then(zip => {
        // start to load each file in this zip
        zip.forEach((relativePath, zipEntry) => {
          const subFilename = zipEntry.name;

          const promise = jsZip
            .file(subFilename)
            // jszip supports both arraybuffer and text, the main loaders.gl types
            // https://stuk.github.io/jszip/documentation/api_zipobject/async.html
            .async(options.dataType || 'arraybuffer')
            .then(arrayBuffer => {
              // Store file data in map
              fileMap[relativePath] = arrayBuffer;
            })
            .catch(error => {
              options.log.error(`Unable to read ${subFilename} from zip archive: ${error}`);
              // Store error in place of data in map
              fileMap[relativePath] = error;
            });

          // Ensure Promise.all doesn't ignore rejected promises.
          promises.push(promise.catch(e => e));
        });

        return Promise.all(promises);
      })
      // Return fileMap
      .then(() => fileMap)
      .catch(error => {
        throw new Error(`Unable to read zip archive: ${error}`);
      })
  );
}
