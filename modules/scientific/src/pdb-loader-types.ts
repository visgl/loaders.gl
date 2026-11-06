/** Package version injected by the build. */
// @ts-ignore __VERSION__ is injected during compilation.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';
// SPDX-License-Identifier: MIT
import type {PDBStructure} from './pdb/parse-pdb';
/** Loads the PDB parser on demand. */
async function preload() {
  const {PDBLoaderWithParser} = await import('@loaders.gl/scientific/pdb-loader');
  return PDBLoaderWithParser;
}
/** Metadata-only PDB molecular structure loader. */
export const PDBLoader = {
  name: 'PDB',
  id: 'pdb',
  module: 'scientific',
  version: VERSION,
  extensions: ['pdb', 'ent'],
  mimeTypes: ['chemical/x-pdb'],
  text: true,
  dataType: null as unknown as PDBStructure,
  batchType: null as never,
  options: {},
  preload
} as const;
