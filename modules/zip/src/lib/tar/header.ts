// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// This file is derived from the tar-js code base under MIT license
// See https://github.com/beatgammit/tar-js/blob/master/LICENSE
/*
 * tar-js
 * MIT (c) 2011 T. Jameson Little
 */
/* eslint-disable */
import * as utils from './utils';
import type {TarStructure, TarData} from './types';
/*
struct posix_header {             // byte offset
	char name[100];               //   0
	char mode[8];                 // 100
	char uid[8];                  // 108
	char gid[8];                  // 116
	char size[12];                // 124
	char mtime[12];               // 136
	char chksum[8];               // 148
	char typeflag;                // 156
	char linkname[100];           // 157
	char magic[6];                // 257
	char version[2];              // 263
	char uname[32];               // 265
	char gname[32];               // 297
	char devmajor[8];             // 329
	char devminor[8];             // 337
	char prefix[155];             // 345
                                  // 500
};
*/

const structure: TarStructure = {
  fileName: 100,
  fileMode: 8,
  uid: 8,
  gid: 8,
  fileSize: 12,
  mtime: 12,
  checksum: 8,
  type: 1,
  linkName: 100,
  ustar: 8,
  owner: 32,
  group: 32,
  majorNumber: 8,
  minorNumber: 8,
  filenamePrefix: 155,
  padding: 12
};
/**
 * Getting the header
 * @param data
 * @param [cb]
 * @returns {Uint8Array} | Array
 */
export function format(data: TarData, cb?: any): [string, number][] | Uint8Array {
  const buffer = utils.clean(512);
  let offset = 0;

  Object.entries(structure).forEach(([field, length]) => {
    const str = data[field] || '';
    let i: number;
    let fieldLength: number;

    for (i = 0, fieldLength = str.length; i < fieldLength; i += 1) {
      buffer[offset] = str.charCodeAt(i);
      offset += 1;
    }

    // space it out with nulls
    offset += length - i;
  });

  if (typeof cb === 'function') {
    return cb(buffer, offset);
  }
  return buffer;
}
