import {expect, test} from 'vitest';
import {encodeStringAttribute} from '../apps/tile-converter/src/i3s-converter/helpers/encode-string-attribute';

test('I3S string attributes preserve the binary layout for ASCII and empty strings', () => {
  const result = encodeStringAttribute(['oak', '']);
  expect(result).toBeInstanceOf(ArrayBuffer);
  expect(new Uint8Array(result)).toEqual(
    new Uint8Array([2, 0, 0, 0, 5, 0, 0, 0, 4, 0, 0, 0, 1, 0, 0, 0, 111, 97, 107, 0, 0])
  );
});

test('I3S string attributes count UTF-8 bytes and preserve embedded nulls', () => {
  const result = encodeStringAttribute(['é', '😀', 'a\0b', '\ud800']);
  const header = new DataView(result);
  expect(Array.from({length: 6}, (_, index) => header.getUint32(index * 4, true))).toEqual([
    4, 16, 3, 5, 4, 4
  ]);
  expect(new Uint8Array(result, 24)).toEqual(
    new Uint8Array([0xc3, 0xa9, 0, 0xf0, 0x9f, 0x98, 0x80, 0, 97, 0, 98, 0, 0xef, 0xbf, 0xbd, 0])
  );
});

test('I3S string attributes retain value coercion and support empty tables', () => {
  expect(new Uint8Array(encodeStringAttribute([]))).toEqual(new Uint8Array(8));
  const result = encodeStringAttribute([null, undefined, 42, ['a', 'b']]);
  expect(new TextDecoder().decode(new Uint8Array(result, 24))).toBe(
    `${['null', 'undefined', '42', 'a,b'].join('\0')}\0`
  );
  expect(encodeStringAttribute(new Array(2))).toEqual(
    encodeStringAttribute([undefined, undefined])
  );
});
