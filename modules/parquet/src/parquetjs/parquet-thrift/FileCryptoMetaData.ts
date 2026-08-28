// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as thrift from '../utils/thrift-runtime';
import * as EncryptionAlgorithm from './EncryptionAlgorithm';

/** File-level crypto metadata stored before an encrypted Parquet footer. */
export class FileCryptoMetaData {
  public encryption_algorithm: EncryptionAlgorithm.EncryptionAlgorithm;
  public key_metadata?: Uint8Array;
  constructor(args: {
    encryption_algorithm: EncryptionAlgorithm.EncryptionAlgorithm;
    key_metadata?: Uint8Array;
  }) {
    this.encryption_algorithm = args.encryption_algorithm;
    this.key_metadata = args.key_metadata;
  }

  /** Writes file-level encryption metadata. */
  public write(output: thrift.TProtocol): void {
    output.writeStructBegin('FileCryptoMetaData');
    output.writeFieldBegin('encryption_algorithm', thrift.Thrift.Type.STRUCT, 1);
    this.encryption_algorithm.write(output);
    output.writeFieldEnd();
    if (this.key_metadata) {
      output.writeFieldBegin('key_metadata', thrift.Thrift.Type.STRING, 2);
      output.writeBinary(this.key_metadata);
      output.writeFieldEnd();
    }
    output.writeFieldStop();
    output.writeStructEnd();
  }

  /** Reads file-level encryption metadata. */
  public static read(input: thrift.TProtocol): FileCryptoMetaData {
    input.readStructBegin();
    let encryptionAlgorithm: EncryptionAlgorithm.EncryptionAlgorithm | undefined;
    let keyMetadata: Uint8Array | undefined;
    while (true) {
      const field = input.readFieldBegin();
      if (field.ftype === thrift.Thrift.Type.STOP) break;
      if (field.fid === 1 && field.ftype === thrift.Thrift.Type.STRUCT) {
        encryptionAlgorithm = EncryptionAlgorithm.EncryptionAlgorithm.read(input);
      } else if (field.fid === 2 && field.ftype === thrift.Thrift.Type.STRING) {
        keyMetadata = input.readBinary();
      } else {
        input.skip(field.ftype);
      }
      input.readFieldEnd();
    }
    input.readStructEnd();
    if (!encryptionAlgorithm)
      throw new Error('FileCryptoMetaData encryption_algorithm is required');
    return new FileCryptoMetaData({
      encryption_algorithm: encryptionAlgorithm,
      key_metadata: keyMetadata
    });
  }
}
