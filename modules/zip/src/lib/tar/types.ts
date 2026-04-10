// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/**
 * Structure of data
 */
export type TarStructure = {
  [index: string]: number;
};
/**
 * Image of input data
 */
export type TarData = {
  [index: string]: string | any;
};
/**
 * Describes inner content of the blocks in the Tar's constructor
 */
export type TarBlocks = {
  [index: string]: any;
  header?: Uint8Array;
  input?: string | Uint8Array;
  headerLength?: number;
  inputLength?: number;
};
/**
 * Describes additional options for Tar class
 */
export type TarOptions = {
  mode?: number;
  mtime?: number;
  uid?: number;
  gid?: number;
  owner?: any;
  group?: any;
};
/**
 * Array of numbers for TarChunks
 */
export type TarChunk = {
  [index: number]: any;
};
/**
 * Sections of binary data inside the Tar class
 */
export type TarChunks = {
  [index: number]: TarChunk;
  length?: number;
  blocks?: any;
};
