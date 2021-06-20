import type {Writer} from '@loaders.gl/loader-utils';
import JSZip from 'jszip';

/**
 * Zip exporter
 */
export const ZipWriter: Writer = {
  name: 'Zip Archive',
  extensions: ['zip'],
  category: 'archive',
  mimeTypes: ['application/zip'],
  // @ts-ignore
  encode: encodeZipAsync
};

function encodeZipAsync(fileMap, options) {
  const jsZip = new JSZip();
  // add files to the zip
  for (const subFileName in fileMap) {
    const subFileData = fileMap[subFileName];

    // jszip supports both arraybuffer and string data (the main loaders.gl types)
    // https://stuk.github.io/jszip/documentation/api_zipobject/async.html
    jsZip.file(subFileName, subFileData, options);
  }

  // always generate the full zip as an arraybuffer
  options = Object.assign({}, options, {
    type: 'arraybuffer'
  });
  const {onUpdate = () => {}} = options;

  return jsZip.generateAsync(options, onUpdate).catch((error) => {
    options.log.error(`Unable to write zip archive: ${error}`);
    throw error;
  });
}
