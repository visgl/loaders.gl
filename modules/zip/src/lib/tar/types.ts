export type Structure = {
  [index: string]: number;
};
export type Data = {
  [index: string]: string | any;
};
export type Blocks = {
  [index: string]: any;
  header?: Uint8Array;
  input?: string | Uint8Array;
  headerLength?: number;
  inputLength?: number;
};
export type Options = {
  mode?: number;
  mtime?: number;
  uid?: number;
  gid?: number;
  owner?: any;
  group?: any;
};
export type Chunk = {
  [index: number]: any;
};
export type Chunks = {
  [index: number]: Chunk;
  length?: number;
  blocks?: any;
};
