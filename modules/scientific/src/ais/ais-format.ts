// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Format} from '@loaders.gl/core/loader-utils';

/** Matches an AIS sentence at the start of a line, with optional NMEA tag blocks. */
const AIS_SENTENCE_START = /^[ \t]*(?:\\[^\\\r\n]*\\[ \t]*)*!AIVD[MO],/m;

/** Detects an AIVDM or AIVDO sentence in the beginning of a text log. */
export function testAISText(text: string): boolean {
  return AIS_SENTENCE_START.test(text.slice(0, 2048));
}

/** Detects AIS text from the starting bytes of an input. */
function testAIS(arrayBuffer: ArrayBuffer): boolean {
  return testAISText(new TextDecoder().decode(arrayBuffer.slice(0, 2048)));
}

/** Maritime AIS reports encapsulated as NMEA text. */
export const AISFormat = {
  name: 'AIS (Automatic Identification System)',
  id: 'ais',
  module: 'scientific',
  category: 'table',
  encoding: 'text',
  format: 'ais',
  extensions: ['ais', 'nmea'],
  mimeTypes: [],
  text: true,
  tests: [testAIS]
} as const satisfies Format;
