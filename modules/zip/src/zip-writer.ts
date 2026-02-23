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
    /** When enabled, parent directory entries are created for nested file keys. */
    createDirectoryEntries?: boolean;
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
      onUpdate: () => {},
      createDirectoryEntries: false
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
  const directoryEntries = new Set<string>();
  const zipOptions = {...ZipWriter.options.zip, ...options?.zip};

  // add files to the zip
  for (const subFileName in fileMap) {
    const subFileData = fileMap[subFileName];
    const isDirectoryEntry = subFileName.endsWith('/');

    if (isDirectoryEntry || zipOptions.createDirectoryEntries) {
      addParentDirectoryEntries(jsZip, subFileName, options, directoryEntries);
    }

    // jszip supports both arraybuffer and string data (the main loaders.gl types)
    // https://stuk.github.io/jszip/documentation/api_zipobject/async.html
    if (isDirectoryEntry) {
      jsZip.file(subFileName, null, {...options?.jszip, dir: true});
    } else {
      jsZip.file(subFileName, subFileData, options?.jszip || {});
    }
  }

  const jszipOptions: JSZipGeneratorOptions = {...ZipWriter.options?.jszip, ...options.jszip};

  try {
    return await jsZip.generateAsync(
      {...jszipOptions, type: 'arraybuffer'}, // generate an arraybuffer
      zipOptions.onUpdate
    );
  } catch (error) {
    options.core?.log?.error(`Unable to encode zip archive: ${error}`);
    throw error;
  }
}

function addParentDirectoryEntries(
  jsZip: JSZip,
  subFileName: string,
  options: ZipWriterOptions,
  directoryEntries: Set<string>
): void {
  const subPathParts = subFileName.split('/').filter((part) => part.length > 0);
  const subPathPartCount = subFileName.endsWith('/')
    ? subPathParts.length
    : subPathParts.length - 1;

  let parentDirectoryPath = '';

  for (let index = 0; index < subPathPartCount; index++) {
    parentDirectoryPath = `${parentDirectoryPath}${subPathParts[index]}/`;

    if (directoryEntries.has(parentDirectoryPath)) {
      continue;
    }

    jsZip.file(parentDirectoryPath, null, {...options?.jszip, dir: true});
    directoryEntries.add(parentDirectoryPath);
  }
}
