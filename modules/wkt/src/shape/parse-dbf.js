const PARSERS = {
  B: readNumber,
  C: readString,
  D: readDate,
  F: readNumber,
  L: readBoolean,
  M: readNumber,
  N: readNumber
};

export default function parseDBF(arrayBuffer, decoder) {

  const head = new DataView(arrayBuffer, 0, 32); // constant
  const byteLength = head.getUint16(8, true) - 32; // what?
  const recordLength = head.getUint16(10, true);
  const body = new DataView(arrayBuffer, 32, byteLength);

  // Parse field descriptors (schema)
  const fields = [];
  for (let n = 0; body.getUint8(n) !== 0x0d; n += 32) {
    let j = 0;
    for (j = 0; j < 11; ++j) {
      if (body.getUint8(n + j) === 0) {
        break;
      }
    }
    fields.push({
      name: decoder.decode(new Uint8Array(body.buffer, body.byteOffset + n, j)),
      type: String.fromCharCode(body.getUint8(n + 11)),
      length: body.getUint8(n + 16)
    });
  }

  // Parse records using the field descriptors
  let i = 1;
  let offset = 32 + byteLength;
  while (offset ... ) {
    const value = new Uint8Array(arrayBuffer, offset, recordLength);
    if (value && (value[0] !== 0x1a)) {
      fields.reduce(function(p, f) {
        decoder.decode(value.subarray(i, i += f.length))
        p[f.name] = PARSERS[f.type]();
        return p;
      }, {})}
    }
  }
  
}

function readBoolean(value) {
  return /^[nf]$/i.test(value) ? false
      : /^[yt]$/i.test(value) ? true
      : null;
}

function readDate(value) {
  return new Date(+value.substring(0, 4), value.substring(4, 6) - 1, +value.substring(6, 8));
}

function readNumber(value) {
  return !(value = value.trim()) || isNaN(value = +value) ? null : value;
}

function readString(value) {
  return value.trim() || null;
}