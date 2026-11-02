// loaders.gl
// SPDX-License-Identifier: MIT
import type {MaterialXDocument} from './materialx/parse-materialx';

/** Loads the parser-bearing MaterialX implementation. */
async function preload() {
  const {MaterialXLoaderWithParser} = await import('@loaders.gl/scene/materialx-loader');
  return MaterialXLoaderWithParser;
}

/** Metadata-only loader for MaterialX XML documents. */
export const MaterialXLoader = {
  name: 'MaterialX',
  id: 'materialx',
  module: 'scene',
  version: 'latest',
  extensions: ['mtlx'],
  mimeTypes: ['application/xml'],
  text: true,
  dataType: null as unknown as MaterialXDocument,
  batchType: null as never,
  options: {},
  preload
} as const;
