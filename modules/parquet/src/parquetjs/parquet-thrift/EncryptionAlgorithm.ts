// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as thrift from '../utils/thrift-runtime';

/** AES-GCM algorithm parameters from the Parquet modular-encryption spec. */
export class AesGcmV1 {
  public aad_prefix?: Uint8Array;
  public aad_file_unique?: Uint8Array;
  public supply_aad_prefix?: boolean;

  constructor(args: Partial<AesGcmV1> = {}) {
    Object.assign(this, args);
  }
}

/** AES-GCM metadata algorithm with AES-CTR page encryption. */
export class AesGcmCtrV1 extends AesGcmV1 {}

/** Parquet modular-encryption algorithm union. */
export class EncryptionAlgorithm {
  public AES_GCM_V1?: AesGcmV1;
  public AES_GCM_CTR_V1?: AesGcmCtrV1;

  constructor(args: Partial<EncryptionAlgorithm> = {}) {
    const fields = [args.AES_GCM_V1, args.AES_GCM_CTR_V1].filter(Boolean);
    if (fields.length !== 1) {
      throw new thrift.Thrift.TProtocolException(
        thrift.Thrift.TProtocolExceptionType.INVALID_DATA,
        'EncryptionAlgorithm must contain exactly one algorithm'
      );
    }
    Object.assign(this, args);
  }

  /** Writes the selected encryption algorithm union. */
  public write(output: thrift.TProtocol): void {
    output.writeStructBegin('EncryptionAlgorithm');
    if (this.AES_GCM_V1) {
      writeAlgorithm(output, 'AES_GCM_V1', 1, this.AES_GCM_V1);
    } else if (this.AES_GCM_CTR_V1) {
      writeAlgorithm(output, 'AES_GCM_CTR_V1', 2, this.AES_GCM_CTR_V1);
    }
    output.writeFieldStop();
    output.writeStructEnd();
  }

  /** Reads an encryption algorithm union. */
  public static read(input: thrift.TProtocol): EncryptionAlgorithm {
    input.readStructBegin();
    let algorithm: EncryptionAlgorithm | undefined;
    while (true) {
      const field = input.readFieldBegin();
      if (field.ftype === thrift.Thrift.Type.STOP) break;
      if (field.fid === 1 && field.ftype === thrift.Thrift.Type.STRUCT) {
        algorithm = new EncryptionAlgorithm({AES_GCM_V1: readAlgorithm(input)});
      } else if (field.fid === 2 && field.ftype === thrift.Thrift.Type.STRUCT) {
        algorithm = new EncryptionAlgorithm({AES_GCM_CTR_V1: readAlgorithm(input)});
      } else {
        input.skip(field.ftype);
      }
      input.readFieldEnd();
    }
    input.readStructEnd();
    if (!algorithm) {
      throw new thrift.Thrift.TProtocolException(
        thrift.Thrift.TProtocolExceptionType.INVALID_DATA,
        'EncryptionAlgorithm union has no selected algorithm'
      );
    }
    return algorithm;
  }
}

function writeAlgorithm(
  output: thrift.TProtocol,
  name: string,
  fieldId: number,
  algorithm: AesGcmV1
): void {
  output.writeFieldBegin(name, thrift.Thrift.Type.STRUCT, fieldId);
  output.writeStructBegin(name);
  if (algorithm.aad_prefix) writeBinary(output, 'aad_prefix', 1, algorithm.aad_prefix);
  if (algorithm.aad_file_unique)
    writeBinary(output, 'aad_file_unique', 2, algorithm.aad_file_unique);
  if (algorithm.supply_aad_prefix !== undefined) {
    output.writeFieldBegin('supply_aad_prefix', thrift.Thrift.Type.BOOL, 3);
    output.writeBool(algorithm.supply_aad_prefix);
    output.writeFieldEnd();
  }
  output.writeFieldStop();
  output.writeStructEnd();
  output.writeFieldEnd();
}

function readAlgorithm(input: thrift.TProtocol): AesGcmV1 {
  input.readStructBegin();
  const result = new AesGcmV1();
  while (true) {
    const field = input.readFieldBegin();
    if (field.ftype === thrift.Thrift.Type.STOP) break;
    if (field.fid === 1 && field.ftype === thrift.Thrift.Type.STRING) {
      result.aad_prefix = input.readBinary();
    } else if (field.fid === 2 && field.ftype === thrift.Thrift.Type.STRING) {
      result.aad_file_unique = input.readBinary();
    } else if (field.fid === 3 && field.ftype === thrift.Thrift.Type.BOOL) {
      result.supply_aad_prefix = input.readBool();
    } else {
      input.skip(field.ftype);
    }
    input.readFieldEnd();
  }
  input.readStructEnd();
  return result;
}

function writeBinary(
  output: thrift.TProtocol,
  name: string,
  fieldId: number,
  value: Uint8Array
): void {
  output.writeFieldBegin(name, thrift.Thrift.Type.STRING, fieldId);
  output.writeBinary(value);
  output.writeFieldEnd();
}
