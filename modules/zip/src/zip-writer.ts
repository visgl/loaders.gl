// loaders.gl, MIT license
// Copyright (c) vis.gl contributors

import type {Writer, WriterOptions} from '@loaders.gl/loader-utils';
import JSZip, {JSZipGeneratorOptions} from 'jszip';

export type ZipWriterOptions = WriterOptions & {
  zip?: {
    onUpdate?: (metadata: {percent: number}) => void;
  };
  /** Passthrough options to jszip */
  jszip?: JSZipGeneratorOptions;
};

/**
 * Zip exporter
 */
export const ZipWriter: Writer<FileReaderEventMap, never, ZipWriterOptions> = {
  name: 'Zip Archive',
  extensions: ['zip'],
  category: 'archive',
  mimeTypes: ['application/zip'],
  // @ts-ignore
  encode: encodeZipAsync
};

async function encodeZipAsync(
  fileMap: Record<string, ArrayBuffer>,
  options: ZipWriterOptions = {}
) {
  const jsZip = new JSZip();
  // add files to the zip
  for (const subFileName in fileMap) {
    const subFileData = fileMap[subFileName];

    // jszip supports both arraybuffer and string data (the main loaders.gl types)
    // https://stuk.github.io/jszip/documentation/api_zipobject/async.html
    jsZip.file(subFileName, subFileData, options?.jszip || {});
  }

  // always generate the full zip as an arraybuffer
  const jszipOptions: JSZipGeneratorOptions = {...options?.jszip, type: 'arraybuffer'};
  const {onUpdate = () => {}} = options;

  try {
    return await jsZip.generateAsync(jszipOptions, onUpdate);
  } catch (error) {
    options.log.error(`Unable to write zip archive: ${error}`);
    throw error;
  }
}
