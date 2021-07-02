// Forked from https://github.com/ironSource/parquetjs under MIT license
import thrift from '../libs/thrift';

/**
 * Helper function that serializes a thrift object into a buffer
 */
export function serializeThrift(obj) {
  const output: Buffer[] = [];

  const transport = new thrift.TBufferedTransport(null, function (buf) {
    output.push(buf);
  });

  const protocol = new thrift.TCompactProtocol(transport);
  obj.write(protocol);
  transport.flush();

  return Buffer.concat(output);
}

export function decodeThrift(obj, buf, offset = 0) {
  const transport = new thrift.TFramedTransport(buf);
  transport.readPos = offset;
  const protocol = new thrift.TCompactProtocol(transport);
  obj.read(protocol);
  return transport.readPos - offset;
}

/**
 * Get the number of bits required to store a given value
 */
export function getBitWidth(val): number {
  if (val === 0) {
    return 0;
  }
  return Math.ceil(Math.log2(val + 1));
}

/**
 * FIXME not ideal that this is linear
 */
export function getThriftEnum(klass, value) {
  for (const k in klass) {
    if (klass[k] === value) {
      return k;
    }
  }

  throw new Error('parquet: Invalid ENUM value');
}

export function fieldIndexOf(arr, elem) {
  for (let j = 0; j < arr.length; ++j) {
    if (arr[j].length !== elem.length) {
      continue; // eslint-disable-line no-continue
    }

    let m = true;
    for (let i = 0; i < elem.length; ++i) {
      if (arr[j][i] !== elem[i]) {
        m = false;
        break;
      }
    }

    if (m) {
      return j;
    }
  }

  return -1;
}
