// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/* tslint:disable */
/* eslint-disable */
import * as thrift from '../utils/thrift-runtime';

export interface INanoSecondsArgs {}
export class NanoSeconds {
  constructor() {}
  public write(output: thrift.TProtocol): void {
    output.writeStructBegin('NanoSeconds');
    output.writeFieldStop();
    output.writeStructEnd();
  }
  public static read(input: thrift.TProtocol): NanoSeconds {
    input.readStructBegin();
    while (true) {
      const field = input.readFieldBegin();
      if (field.ftype === thrift.Thrift.Type.STOP) break;
      input.skip(field.ftype);
      input.readFieldEnd();
    }
    input.readStructEnd();
    return new NanoSeconds();
  }
}
