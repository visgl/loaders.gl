// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {HDF5ObjectMessage} from './hdf5-object-header';

export type HDF5HardLink = {name: string; address: bigint};

function unsigned(data: Uint8Array, offset: number, length: number): bigint {
  if (length < 1 || length > 8 || offset < 0 || offset + length > data.length) {
    throw new Error('HDF5: truncated link field');
  }
  let value = 0n;
  for (let i = length - 1; i >= 0; i--) value = (value << 8n) | BigInt(data[offset + i]);
  return value;
}

/** Decode an HDF5 v1 hard-link message (object-header message type 6). */
export function parseHDF5HardLink(payload: Uint8Array, offsetSize: number): HDF5HardLink {
  if (payload.length < 3 || payload[0] !== 1) {
    throw new Error('HDF5: unsupported link message version');
  }
  const flags = payload[1];
  const nameLengthSize = 1 << (flags & 3);
  let cursor = 2;
  let linkType = 0;
  if (flags & 8) {
    if (cursor >= payload.length) throw new Error('HDF5: truncated link type');
    linkType = payload[cursor++];
  }
  if (flags & 4) cursor += 8; // creation order
  if (flags & 16) cursor += 1; // character set
  const length = Number(unsigned(payload, cursor, nameLengthSize));
  cursor += nameLengthSize;
  if (
    !Number.isSafeInteger(length) ||
    length <= 0 ||
    cursor + length + offsetSize > payload.length
  ) {
    throw new Error('HDF5: truncated link name or address');
  }
  if (linkType !== 0) throw new Error('HDF5: soft/external links not supported');
  const name = new TextDecoder('utf-8', {fatal: true}).decode(
    payload.subarray(cursor, cursor + length)
  );
  cursor += length;
  if (name === '.' || name === '..' || name.includes('/')) {
    throw new Error('HDF5: invalid hard-link name');
  }
  return {name, address: unsigned(payload, cursor, offsetSize)};
}

export function getHDF5CompactLinks(
  messages: readonly HDF5ObjectMessage[],
  offsetSize: number
): HDF5HardLink[] {
  const links = messages
    .filter(message => message.type === 6)
    .map(message => parseHDF5HardLink(message.payload, offsetSize));
  const seen = new Set<string>();
  for (const link of links) {
    if (seen.has(link.name)) throw new Error('HDF5: duplicate compact link ' + link.name);
    seen.add(link.name);
  }
  if (messages.some(message => message.type === 2)) {
    throw new Error('HDF5: dense link storage requires fractal heap/B-tree support');
  }
  return links;
}
