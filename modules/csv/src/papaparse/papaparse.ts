// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Copyright (c) 2015 Matthew Holt

// This is a fork of papaparse v5.0.0-beta.0 under MIT license
// https://github.com/mholt/PapaParse

// FORK SUMMARY:
// - Adopt ES6 exports
// - Implement new AsyncIteratorStreamer
// - Remove non Async Iterator streamers (can all be handled by new streamer)
// - Remove unused Worker support (loaders.gl worker system used instead)
// - Remove unused jQuery plugin support

import {CsvToJson, Parser, ParserHandle, ChunkStreamer} from './papa-parser';
import {JsonToCsv} from './papa-writer';
import {Papa} from './papa-constants';

export type {CSVParserConfig} from './papa-parser';
export type {CSVWriterConfig} from './papa-writer';

export default {
  ...Papa,

  parse: CsvToJson,
  unparse: JsonToCsv,

  ChunkStreamer,

  // Exposed for testing and development only
  Parser,
  ParserHandle,
};
