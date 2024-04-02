// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {WriterWithEncoder, WriterOptions} from '@loaders.gl/loader-utils';
import JSZip, {JSZipGeneratorOptions} from 'jszip';

// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

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
export const ZipWriter = {
  name: 'Zip Archive',
  id: 'zip',
  module: 'zip',
  version: VERSION,
  extensions: ['zip'],
  category: 'archive',
  mimeTypes: ['application/zip'],
  options: {
    zip: {
      onUpdate: () => {}
    },
    jszip: {}
  },
  encode: encodeZipAsync
} as const satisfies WriterWithEncoder<Record<string, ArrayBuffer>, never, ZipWriterOptions>;

async function encodeZipAsync(
  fileMap: Record<string, ArrayBuffer>,
  options: ZipWriterOptions = {}
): Promise<ArrayBuffer> {
  const jsZip = new JSZip();
  // add files to the zip
  for (const subFileName in fileMap) {
    const subFileData = fileMap[subFileName];

    // jszip supports both arraybuffer and string data (the main loaders.gl types)
    // https://stuk.github.io/jszip/documentation/api_zipobject/async.html
    jsZip.file(subFileName, subFileData, options?.jszip || {});
  }

  const zipOptions = {...ZipWriter.options.zip, ...options?.zip};
  const jszipOptions: JSZipGeneratorOptions = {...ZipWriter.options?.jszip, ...options.jszip};

  try {
    return await jsZip.generateAsync(
      {...jszipOptions, type: 'arraybuffer'}, // generate an arraybuffer
      zipOptions.onUpdate
    );
  } catch (error) {
    options.log.error(`Unable to encode zip archive: ${error}`);
    throw error;
  }
}
