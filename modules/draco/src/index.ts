// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import type {DracoMesh, DracoLoaderData} from './lib/draco-types';
import type {DracoLoaderOptions} from './draco-loader';
import {DracoLoader as DracoWorkerLoader} from './draco-loader';
import DracoParser from './lib/draco-parser';
import {loadDracoDecoderModule} from './lib/draco-module-loader';
import {VERSION} from './lib/utils/version';

// Module constants
export {DRACO_EXTERNAL_LIBRARIES, DRACO_EXTERNAL_LIBRARY_URLS} from './lib/draco-module-loader';

// Draco data types

export type {DracoMesh, DracoLoaderData};

// Draco Writer

export type {DracoWriterOptions} from './draco-writer';
export {DracoWriter} from './draco-writer';

/**
 * Browser worker doesn't work because of issue during "draco_encoder.js" loading.
 * Refused to execute script from 'https://raw.githubusercontent.com/google/draco/1.4.1/javascript/draco_encoder.js' because its MIME type ('') is not executable.
 */
export const DracoWriterWorker = {
  id: 'draco-writer',
  name: 'Draco compressed geometry writer',
  module: 'draco',
  version: VERSION,
  worker: true,
  options: {
    draco: {},
    source: null
  }
};

// Draco Loader

export type {DracoLoaderOptions};
export {DracoWorkerLoader};

/**
 * Loader for Draco3D compressed geometries
 */
export const DracoLoader = {
  ...DracoWorkerLoader,
  parse
} as const satisfies LoaderWithParser<DracoMesh, never, DracoLoaderOptions>;

async function parse(arrayBuffer: ArrayBuffer, options?: DracoLoaderOptions): Promise<DracoMesh> {
  const {draco} = await loadDracoDecoderModule(options);
  const dracoParser = new DracoParser(draco);
  try {
    return dracoParser.parseSync(arrayBuffer, options?.draco);
  } finally {
    dracoParser.destroy();
  }
}
