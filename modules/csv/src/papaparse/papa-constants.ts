// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Copyright (c) 2015 Matthew Holt

// This is a fork of papaparse v5.0.0-beta.0 under MIT license
// https://github.com/mholt/PapaParse

const BYTE_ORDER_MARK = '\ufeff';

export const Papa = {
  RECORD_SEP: String.fromCharCode(30),
  UNIT_SEP: String.fromCharCode(31),
  BYTE_ORDER_MARK,
  BAD_DELIMITERS: ['\r', '\n', '"', BYTE_ORDER_MARK],
  WORKERS_SUPPORTED: false, // !IS_WORKER && !!globalThis.Worker
  NODE_STREAM_INPUT: 1,

  // Configurable chunk sizes for local and remote files, respectively
  LocalChunkSize: 1024 * 1024 * 10, // 10 M,
  RemoteChunkSize: 1024 * 1024 * 5, // 5 M,
  DefaultDelimiter: ',', // Used if not specified and detection fail,
};
