// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** NMEA armor characters ordered by six-bit value. */
const ARMOR = '0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVW`abcdefghijklmnopqrstuvw';

/** AIS payload text characters ordered by six-bit value. */
const TEXT = '@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_ !"#$%&\'()*+,-./0123456789:;<=>?';

/** A numeric or text fixture field with its offset and width in bits. */
type Field = readonly [offset: number, width: number, value: number | string];

/** Encodes a test payload from specified fields and leaves any unset bits at zero. */
export function encodeAISPayload(
  messageType: number,
  bitLength: number,
  fields: readonly Field[] = [],
  mmsi = 234567890
): {payload: string; fillBits: number} {
  const fillBits = (6 - (bitLength % 6)) % 6;
  const bits = new Uint8Array(bitLength + fillBits);
  for (const [offset, width, value] of [
    [0, 6, messageType],
    [8, 30, mmsi],
    ...fields
  ] satisfies Field[]) {
    if (typeof value === 'string') {
      for (let index = 0; index < value.length; index++) {
        writeNumber(bits, offset + index * 6, 6, TEXT.indexOf(value[index]));
      }
    } else {
      writeNumber(bits, offset, width, value);
    }
  }

  let payload = '';
  for (let offset = 0; offset < bits.length; offset += 6) {
    const character = Number.parseInt(bits.slice(offset, offset + 6).join(''), 2);
    payload += ARMOR[character];
  }
  return {payload, fillBits};
}

/** Writes signed or unsigned numeric test data, most significant bit first. */
function writeNumber(bits: Uint8Array, offset: number, width: number, value: number): void {
  for (let index = 0; index < width; index++) {
    bits[offset + index] = (value >> (width - index - 1)) & 1;
  }
}

/** Wraps an armored payload fragment in an NMEA sentence. */
export function encodeAIVDM(
  payload: string,
  fillBits: number,
  {count = 1, number = 1, sequence = '', channel = 'A', type = 'AIVDM'} = {}
): string {
  const sentence = `${type},${count},${number},${sequence},${channel},${payload},${fillBits}`;
  return `!${withChecksum(sentence)}`;
}

/** Wraps tag fields with their own NMEA checksum. */
export function encodeTagBlock(fields: string): string {
  return `\\${withChecksum(fields)}\\`;
}

/** Replaces a valid sentence checksum with a different, well-formed checksum. */
export function corruptChecksum(sentence: string): string {
  return `${sentence.slice(0, -2)}${sentence.endsWith('00') ? 'FF' : '00'}`;
}

/** Appends a two-character XOR checksum to an NMEA body. */
function withChecksum(body: string): string {
  const checksum = Array.from(body).reduce(
    (value, character) => value ^ character.charCodeAt(0),
    0
  );
  return `${body}*${checksum.toString(16).toUpperCase().padStart(2, '0')}`;
}
