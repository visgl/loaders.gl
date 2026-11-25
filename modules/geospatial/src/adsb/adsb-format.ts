// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Format} from '@loaders.gl/core/loader-utils';

/** Detects the snapshot field names in the beginning of a JSON document. */
export function testADSBText(text: string): boolean {
  const start = text.slice(0, 2048);
  return (
    /^\s*\{/.test(start) &&
    ((/"now"\s*:\s*-?\d/.test(start) && /"aircraft"\s*:\s*\[/.test(start)) ||
      // The v2 API layout often puts `now` after the aircraft list, so an aircraft `hex` field
      // also identifies it. Key order does not matter.
      (/"ac"\s*:\s*\[/.test(start) &&
        (/"hex"\s*:\s*"/.test(start) || /"now"\s*:\s*-?\d/.test(start))) ||
      (/"time"\s*:\s*-?\d/.test(start) && /"states"\s*:\s*(?:\[|null\b)/.test(start)))
  );
}

/** Detects an aircraft snapshot from the starting bytes of an input. */
function testADSB(arrayBuffer: ArrayBuffer): boolean {
  return testADSBText(new TextDecoder().decode(arrayBuffer.slice(0, 2048)));
}

/** ADS-B aircraft state snapshots serialized as JSON. */
export const ADSBFormat = {
  name: 'ADS-B Aircraft State JSON',
  id: 'adsb',
  module: 'geospatial',
  category: 'table',
  encoding: 'json',
  format: 'adsb',
  extensions: ['adsb'],
  mimeTypes: [],
  text: true,
  tests: [testADSB]
} as const satisfies Format;
