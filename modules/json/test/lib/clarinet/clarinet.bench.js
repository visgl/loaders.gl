// SPDX-License-Identifier: MIT

import {_ClarinetParser} from '@loaders.gl/json';
import StreamingJSONParser from '../../../src/lib/json-parser/streaming-json-parser';
import FastStreamingJSONParser from '../../../src/lib/json-parser/fast-streaming-json-parser';

const loadJSON = async relativePath => {
  const url = new URL(relativePath, import.meta.url);
  if (url.protocol === 'file:' && typeof window === 'undefined') {
    const {readFile} = await import('fs/promises');
    return JSON.parse(await readFile(url, 'utf8'));
  }
  const response = await fetch(url);
  return response.json();
};

const BASIC = await loadJSON('../../data/clarinet/basic.json');
const GEOJSON = await loadJSON('../../data/geojson-big.json');

const STREAMING_CHUNK_SIZE = 1024;
const STREAMING_JSON_PATHS = ['$.features'];

export default function clarinetBench(bench) {
  const STRING = JSON.stringify(BASIC);
  const geojsonString = JSON.stringify(GEOJSON);
  const geojsonChunks = splitIntoChunks(geojsonString, STREAMING_CHUNK_SIZE);

  bench.group('Clarinet internals - JSON parsing from string');

  bench.add('ClarinetParser', {multiplier: STRING.length, unit: 'bytes'}, () => {
    const parser = new _ClarinetParser();
    parser.write(STRING);
  });

  bench.add('JSON.parse', {multiplier: STRING.length, unit: 'bytes'}, () => {
    JSON.parse(STRING);
  });

  bench.group('Streaming JSON parser backends - chunked GeoJSON extraction');

  bench.add('StreamingJSONParser', {multiplier: geojsonString.length, unit: 'bytes'}, () => {
    runStreamingParser(StreamingJSONParser, geojsonChunks, STREAMING_JSON_PATHS);
  });

  bench.add('FastStreamingJSONParser', {multiplier: geojsonString.length, unit: 'bytes'}, () => {
    runStreamingParser(FastStreamingJSONParser, geojsonChunks, STREAMING_JSON_PATHS);
  });
}

/**
 * Runs one streaming parser backend against a chunked JSON workload.
 */
function runStreamingParser(Parser, chunks, jsonpaths) {
  const parser = new Parser({jsonpaths});
  const rows = [];

  for (const chunk of chunks) {
    rows.push(...parser.write(chunk));
  }

  parser.close();
  return rows;
}

/**
 * Splits a string into equal-sized chunks.
 */
function splitIntoChunks(text, chunkSize) {
  const chunks = [];

  for (let index = 0; index < text.length; index += chunkSize) {
    chunks.push(text.slice(index, index + chunkSize));
  }

  return chunks;
}
