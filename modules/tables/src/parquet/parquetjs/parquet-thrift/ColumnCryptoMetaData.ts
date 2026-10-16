// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as thrift from '../utils/thrift-runtime';

/** Marker for a column encrypted with the file footer key. */
export class EncryptionWithFooterKey {
  /** Writes the empty footer-key marker. */
  public write(output: thrift.TProtocol): void {
    output.writeStructBegin('EncryptionWithFooterKey');
    output.writeFieldStop();
    output.writeStructEnd();
  }
  /** Reads the empty footer-key marker. */
  public static read(input: thrift.TProtocol): EncryptionWithFooterKey {
    input.readStructBegin();
    while (true) {
      const field = input.readFieldBegin();
      if (field.ftype === thrift.Thrift.Type.STOP) break;
      input.skip(field.ftype);
      input.readFieldEnd();
    }
    input.readStructEnd();
    return new EncryptionWithFooterKey();
  }
}

/** Metadata needed to retrieve a column-specific encryption key. */
export class EncryptionWithColumnKey {
  public path_in_schema: string[];
  public key_metadata?: Uint8Array;
  constructor(args: {path_in_schema: string[]; key_metadata?: Uint8Array}) {
    this.path_in_schema = args.path_in_schema;
    this.key_metadata = args.key_metadata;
  }

  /** Writes column-key retrieval metadata. */
  public write(output: thrift.TProtocol): void {
    output.writeStructBegin('EncryptionWithColumnKey');
    output.writeFieldBegin('path_in_schema', thrift.Thrift.Type.LIST, 1);
    output.writeListBegin(thrift.Thrift.Type.STRING, this.path_in_schema.length);
    for (const pathPart of this.path_in_schema) output.writeString(pathPart);
    output.writeListEnd();
    output.writeFieldEnd();
    if (this.key_metadata) {
      output.writeFieldBegin('key_metadata', thrift.Thrift.Type.STRING, 2);
      output.writeBinary(this.key_metadata);
      output.writeFieldEnd();
    }
    output.writeFieldStop();
    output.writeStructEnd();
  }

  /** Reads column-key retrieval metadata. */
  public static read(input: thrift.TProtocol): EncryptionWithColumnKey {
    input.readStructBegin();
    let pathInSchema: string[] | undefined;
    let keyMetadata: Uint8Array | undefined;
    while (true) {
      const field = input.readFieldBegin();
      if (field.ftype === thrift.Thrift.Type.STOP) break;
      if (field.fid === 1 && field.ftype === thrift.Thrift.Type.LIST) {
        const list = input.readListBegin();
        pathInSchema = [];
        for (let index = 0; index < list.size; index++) pathInSchema.push(input.readString());
        input.readListEnd();
      } else if (field.fid === 2 && field.ftype === thrift.Thrift.Type.STRING) {
        keyMetadata = input.readBinary();
      } else {
        input.skip(field.ftype);
      }
      input.readFieldEnd();
    }
    input.readStructEnd();
    if (!pathInSchema) throw new Error('EncryptionWithColumnKey path_in_schema is required');
    return new EncryptionWithColumnKey({path_in_schema: pathInSchema, key_metadata: keyMetadata});
  }
}

/** Column encryption metadata union. */
export class ColumnCryptoMetaData {
  public ENCRYPTION_WITH_FOOTER_KEY?: EncryptionWithFooterKey;
  public ENCRYPTION_WITH_COLUMN_KEY?: EncryptionWithColumnKey;
  constructor(args: {
    ENCRYPTION_WITH_FOOTER_KEY?: EncryptionWithFooterKey;
    ENCRYPTION_WITH_COLUMN_KEY?: EncryptionWithColumnKey;
  }) {
    if (
      (args.ENCRYPTION_WITH_FOOTER_KEY ? 1 : 0) + (args.ENCRYPTION_WITH_COLUMN_KEY ? 1 : 0) !==
      1
    ) {
      throw new thrift.Thrift.TProtocolException(
        thrift.Thrift.TProtocolExceptionType.INVALID_DATA,
        'ColumnCryptoMetaData must contain exactly one key reference'
      );
    }
    Object.assign(this, args);
  }

  /** Writes the selected column encryption key reference. */
  public write(output: thrift.TProtocol): void {
    output.writeStructBegin('ColumnCryptoMetaData');
    if (this.ENCRYPTION_WITH_FOOTER_KEY) {
      output.writeFieldBegin('ENCRYPTION_WITH_FOOTER_KEY', thrift.Thrift.Type.STRUCT, 1);
      this.ENCRYPTION_WITH_FOOTER_KEY.write(output);
      output.writeFieldEnd();
    } else if (this.ENCRYPTION_WITH_COLUMN_KEY) {
      output.writeFieldBegin('ENCRYPTION_WITH_COLUMN_KEY', thrift.Thrift.Type.STRUCT, 2);
      this.ENCRYPTION_WITH_COLUMN_KEY.write(output);
      output.writeFieldEnd();
    }
    output.writeFieldStop();
    output.writeStructEnd();
  }

  /** Reads column encryption metadata. */
  public static read(input: thrift.TProtocol): ColumnCryptoMetaData {
    input.readStructBegin();
    let footerKey: EncryptionWithFooterKey | undefined;
    let columnKey: EncryptionWithColumnKey | undefined;
    while (true) {
      const field = input.readFieldBegin();
      if (field.ftype === thrift.Thrift.Type.STOP) break;
      if (field.fid === 1 && field.ftype === thrift.Thrift.Type.STRUCT) {
        footerKey = EncryptionWithFooterKey.read(input);
      } else if (field.fid === 2 && field.ftype === thrift.Thrift.Type.STRUCT) {
        columnKey = EncryptionWithColumnKey.read(input);
      } else {
        input.skip(field.ftype);
      }
      input.readFieldEnd();
    }
    input.readStructEnd();
    return footerKey
      ? new ColumnCryptoMetaData({ENCRYPTION_WITH_FOOTER_KEY: footerKey})
      : new ColumnCryptoMetaData({ENCRYPTION_WITH_COLUMN_KEY: columnKey!});
  }
}
