/**
 * `btoa()` polyfill as defined by the HTML and Infra specs, which mostly just references
 * RFC 4648.
 */
export function toBase64(string) {
  // String conversion as required by Web IDL.
  string = `${string}`;
  // "The btoa() method must throw an "InvalidCharacterError" DOMException if
  // data contains any character whose code point is greater than U+00FF."
  for (let i = 0; i < string.length; i++) {
    if (string.charCodeAt(i) > 255) {
      return null;
    }
  }
  let out = '';
  for (let i = 0; i < string.length; i += 3) {
    /** @type {Array[4]} */
    const groupsOfSix = [undefined, undefined, undefined, undefined];
    groupsOfSix[0] = string.charCodeAt(i) >> 2;
    groupsOfSix[1] = (string.charCodeAt(i) & 0x03) << 4;
    if (string.length > i + 1) {
      groupsOfSix[1] |= string.charCodeAt(i + 1) >> 4;
      groupsOfSix[2] = (string.charCodeAt(i + 1) & 0x0f) << 2;
    }
    if (string.length > i + 2) {
      groupsOfSix[2] |= string.charCodeAt(i + 2) >> 6;
      groupsOfSix[3] = string.charCodeAt(i + 2) & 0x3f;
    }
    for (let j = 0; j < groupsOfSix.length; j++) {
      if (typeof groupsOfSix[j] === 'undefined') {
        out += '=';
      } else {
        out += btoaLookup(groupsOfSix[j]);
      }
    }
  }
  return out;
}

/**
 * Lookup table for btoa(), which converts a six-bit number into the
 * corresponding ASCII character.
 */
function btoaLookup(idx) {
  if (idx < 26) {
    return String.fromCharCode(idx + 'A'.charCodeAt(0));
  }
  if (idx < 52) {
    return String.fromCharCode(idx - 26 + 'a'.charCodeAt(0));
  }
  if (idx < 62) {
    return String.fromCharCode(idx - 52 + '0'.charCodeAt(0));
  }
  if (idx === 62) {
    return '+';
  }
  if (idx === 63) {
    return '/';
  }
  // Throw INVALID_CHARACTER_ERR exception here -- won't be hit in the teststring.
  return undefined;
}
