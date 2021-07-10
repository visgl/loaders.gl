// Forked from https://github.com/kbajalc/parquets under MIT license (Copyright (c) 2017 ironSource Ltd.)

declare module 'int53' {
  declare function readInt64BE(buffer: Buffer, offset?: number): number;
  declare function readInt64LE(buffer: Buffer, offset?: number): number;
  declare function readUInt64BE(buffer: Buffer, offset?: number): number;
  declare function readUInt64LE(buffer: Buffer, offset?: number): number;
  declare function writeInt64BE(value: number, buffer: Buffer, offset?: number): void;
  declare function writeInt64LE(value: number, buffer: Buffer, offset?: number): void;
  declare function writeUInt64BE(value: number, buffer: Buffer, offset?: number): void;
  declare function writeUInt64LE(value: number, buffer: Buffer, offset?: number): void;
}

// declare module 'snappyjs' {
//   declare function compress(uncompressed: Buffer): Buffer;
//   declare function compress(uncompressed: ArrayBuffer): ArrayBuffer;
//   declare function compress(uncompressed: Uint8Array): Uint8Array;
//   declare function uncompress(compressed: Buffer): Buffer;
//   declare function uncompress(compressed: ArrayBuffer): ArrayBuffer;
//   declare function uncompress(compressed: Uint8Array): Uint8Array;
// }
