// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Format} from '@loaders.gl/core/loader-utils';

/**
 * Returns `true` when the first bytes look like an OMM document in the JSON or the KVN form.
 *
 * @param arrayBuffer - First bytes of the data.
 */
function testOMM(arrayBuffer: ArrayBuffer): boolean {
  const text = new TextDecoder().decode(
    new Uint8Array(arrayBuffer, 0, Math.min(arrayBuffer.byteLength, 2048))
  );
  if (/^\s*CCSDS_OMM_VERS\s*=/.test(text)) {
    return true;
  }
  return /^\s*[[{]/.test(text) && text.includes('"MEAN_MOTION"') && text.includes('"EPOCH"');
}

/** CCSDS Orbit Mean-Elements Message (OMM), in the JSON or the KVN form. */
export const OMMFormat = {
  name: 'CCSDS OMM (Orbit Mean-Elements Message)',
  id: 'omm',
  module: 'scientific',
  category: 'table',
  encoding: 'text',
  format: 'omm',
  extensions: ['omm'],
  mimeTypes: [],
  text: true,
  tests: [testOMM]
} as const satisfies Format;
