// SPDX-License-Identifier: MIT
import {PDBLoader} from './pdb-loader-types';
import {parsePDB} from './pdb/parse-pdb';
const {preload: _preload, ...metadata} = PDBLoader;
/** Parser-bearing molecular structure loader, without inferred bonds or render objects. */
export const PDBLoaderWithParser = {
  ...metadata,
  parseTextSync: parsePDB,
  parseText: async (text: string) => parsePDB(text),
  parseSync: (data: ArrayBuffer) => parsePDB(new TextDecoder().decode(data)),
  parse: async (data: ArrayBuffer) => parsePDB(new TextDecoder().decode(data))
} as const;
