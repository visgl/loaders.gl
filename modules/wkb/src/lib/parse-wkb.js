/* eslint-disable */


function parseWKB(buffer) {
  var view = new DataView(buffer)
  var offset = 0;
  // Check endianness of data
  var littleEndian = view.getUint8(offset) === 1
  offset++

  // 4-digit code representing dimension and type of geometry
  var geometryCode = view.getUint32(offset, littleEndian)
  offset += 4

  var geometryType = geometryCode % 1000;
  var dimension = (geometryCode - geometryType) / 1000

  switch (geometryType) {
    case 1:
      parsePoint();
      break;
    case 2:
      parseLineString();
      break;
    case 3:
      parsePolygon(new DataView(buffer, offset))
      break;
    case 4:
      parseMultiPoint();
      break;
    case 5:
      parseMultiLineString();
      break;
    case 6:
      parseMultiPolygon();
      break;
    case 7:
      parseGeometryCollection();
      break;
    default:
      console.error(`Unsupported geometry type: ${geometryType}`)
  }

  if (littleEndian === isHostLittleEndian()) {
    // Possible to make typedarray without copy?
    // Yes, you can just do new Float64Array(buffer, offset)
    var point = new Float64Array(buffer.slice(offset))
  } else {
    var point = new Float64Array(reverseEndianness(buffer.slice(offset)));
  }


}

// TODO don't copy, just use DataView with offset
function reverseEndianness(buffer, dataLittleEndian) {
  var buf = buffer.slice(offset);
  var view = new DataView(buf);

  // Reverse endianness of each double in buffer
  for (var i = 0; i < view.byteLength; i+=8) {
    view.setFloat64(i, view.getFloat64(i, dataLittleEndian), !dataLittleEndian)
  }

  return buf;
}


// https://gist.github.com/TooTallNate/4750953
function isHostLittleEndian() {
  var b = new ArrayBuffer(4);
  var a = new Uint32Array(b);
  var c = new Uint8Array(b);
  a[0] = 0xdeadbeef;
  if (c[0] == 0xef) return true;
  if (c[0] == 0xde) return false;
  throw new Error('unknown endianness');
}


