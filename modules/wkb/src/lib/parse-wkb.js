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



}


  }

}




