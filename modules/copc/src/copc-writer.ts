// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {WriterOptions, WriterWithEncoder} from '@loaders.gl/loader-utils';
import type {Mesh, MeshArrowTable} from '@loaders.gl/schema';
import {COPCFormat} from './copc-format';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Options for `COPCWriter`. */
export type COPCWriterOptions = WriterOptions & {
  copc?: {
    /** Target maximum number of points per COPC node. */
    nodePointLimit?: number;
  };
};

/** Writer metadata for COPC point cloud output. */
export const COPCWriter = {
  ...COPCFormat,
  dataType: null as unknown as Mesh | MeshArrowTable,
  batchType: null as never,
  version: VERSION,
  extensions: ['copc.laz', 'laz'],
  options: {
    copc: {}
  },
  encode: async () => encodeCOPCSync(),
  encodeSync: encodeCOPCSync
} as const satisfies WriterWithEncoder<Mesh | MeshArrowTable, never, COPCWriterOptions>;

/** Encode a mesh or Arrow table as COPC. */
function encodeCOPCSync(): ArrayBuffer {
  throw new Error('COPCWriter: TypeScript COPC encoding is not implemented yet');
}
