// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/* tslint:disable */
/* eslint-disable */
import * as thrift from '../utils/thrift-runtime';

export interface IFloat16TypeArgs {}
export class Float16Type {
  constructor() {}
  public write(output: thrift.TProtocol): void {
    output.writeStructBegin('Float16Type');
    output.writeFieldStop();
    output.writeStructEnd();
  }
  public static read(input: thrift.TProtocol): Float16Type {
    input.readStructBegin();
    while (true) {
      const field = input.readFieldBegin();
      if (field.ftype === thrift.Thrift.Type.STOP) break;
      input.skip(field.ftype);
      input.readFieldEnd();
    }
    input.readStructEnd();
    return new Float16Type();
  }
}
