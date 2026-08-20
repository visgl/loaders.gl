// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Minimal Thrift runtime types needed by the generated Parquet metadata classes. */
export namespace Thrift {
  /** Thrift wire types used by the Parquet compact protocol. */
  export enum Type {
    STOP = 0,
    VOID = 1,
    BOOL = 2,
    BYTE = 3,
    DOUBLE = 4,
    I16 = 6,
    I32 = 8,
    I64 = 10,
    STRING = 11,
    STRUCT = 12,
    MAP = 13,
    SET = 14,
    LIST = 15,
    UTF8 = 16,
    UTF16 = 17
  }

  /** Protocol failure categories retained for generated-code compatibility. */
  export enum TProtocolExceptionType {
    UNKNOWN = 0,
    INVALID_DATA = 1,
    NEGATIVE_SIZE = 2,
    SIZE_LIMIT = 3,
    BAD_VERSION = 4,
    NOT_IMPLEMENTED = 5,
    DEPTH_LIMIT = 6
  }

  /** Error raised when generated metadata cannot be encoded or decoded. */
  export class TProtocolException extends Error {
    /** Thrift protocol error category. */
    readonly type: TProtocolExceptionType;

    /** Creates a protocol exception without importing the Node-oriented thrift package. */
    constructor(type: TProtocolExceptionType, message = 'Thrift protocol error') {
      super(message);
      this.name = 'TProtocolException';
      this.type = type;
    }
  }
}

/** Thrift struct descriptor returned by compact-protocol readers. */
export type TStruct = {fname: string};

/** Thrift field descriptor returned by compact-protocol readers. */
export type TField = {fname: string; ftype: Thrift.Type; fid: number};

/** Thrift map descriptor returned by compact-protocol readers. */
export type TMap = {ktype: Thrift.Type; vtype: Thrift.Type; size: number};

/** Thrift list descriptor returned by compact-protocol readers. */
export type TList = {etype: Thrift.Type; size: number};

/** Thrift set descriptor returned by compact-protocol readers. */
export type TSet = TList;

/**
 * Compact-protocol surface consumed by the generated Parquet metadata classes.
 * Binary values use typed-array views and remain browser-native.
 */
export interface TProtocol {
  writeStructBegin(name: string): void;
  writeStructEnd(): void;
  writeFieldBegin(name: string, fieldType: Thrift.Type, fieldId: number): void;
  writeFieldEnd(): void;
  writeFieldStop(): void;
  writeMapBegin(keyType: Thrift.Type, valueType: Thrift.Type, size: number): void;
  writeMapEnd(): void;
  writeListBegin(elementType: Thrift.Type, size: number): void;
  writeListEnd(): void;
  writeSetBegin(elementType: Thrift.Type, size: number): void;
  writeSetEnd(): void;
  writeBool(value: boolean): void;
  writeByte(value: number): void;
  writeI16(value: number): void;
  writeI32(value: number): void;
  writeI64(value: unknown): void;
  writeDouble(value: number): void;
  writeString(value: string): void;
  writeBinary(value: ArrayBuffer | ArrayBufferView): void;
  readStructBegin(): TStruct;
  readStructEnd(): void;
  readFieldBegin(): TField;
  readFieldEnd(): void;
  readMapBegin(): TMap;
  readMapEnd(): void;
  readListBegin(): TList;
  readListEnd(): void;
  readSetBegin(): TSet;
  readSetEnd(): void;
  readBool(): boolean;
  readByte(): number;
  readI16(): number;
  readI32(): number;
  readI64(): any;
  readDouble(): number;
  readString(): string;
  readBinary(): Uint8Array;
  skip(type: Thrift.Type): void;
}
