/* eslint-disable */

var LITTLE_ENDIAN = true;

function parseDbf(arrayBuffer) {
  // Global header
  var globalHeaderView = new DataView(arrayBuffer, 0, 32);
  var header = parseHeader(globalHeaderView);
  var {headerLength, recordLength, nRecords} = header;

  // Row headers
  var encoding = 'utf-8';
  // Requires Node 11+
  var textDecoder = new TextDecoder(encoding);
  var colHeaderView = new DataView(arrayBuffer, 32, headerLength - 32);
  var colHeaders = parseColumnHeaders(colHeaderView, textDecoder);

  headerLength
}

function parseHeader(headerView) {
  // Last updated date
  var year = headerView.getUint8(1) + 1900
  var month = headerView.getUint8(2)
  var day = headerView.getUint8(3)

  // Number of records in data file
  var nRecords = headerView.getUint32(4, LITTLE_ENDIAN)

  // Length of header in bytes
  var headerLength = headerView.getUint16(8, LITTLE_ENDIAN)

  // Length of each record
  var recordLength = headerView.getUint16(10, LITTLE_ENDIAN);

  // Not sure if this is usually set
  var languageDriver = headerView.getUint8(29);

  return {
    year,
    month,
    day,
    nRecords,
    headerLength,
    recordLength,
  }
}

function parseColumnHeaders(view, textDecoder) {
  var nFields = (view.byteLength - 1) / 32;
  var offset = 0;

  var fields = [];
  for (var i = 0; i < nFields; i++) {
    // Better way to read text?
    // TODO: remove null \u0000; looks like they right fill with that
    var name = textDecoder.decode(view.buffer.slice(view.byteOffset + offset, view.byteOffset + offset + 11))

    var dataType = String.fromCharCode(view.getUint8(offset + 11));
    var fieldLength = view.getUint8(offset + 16);
    var decimal = view.getUint8(offset + 17);

    fields.push({
      name,
      dataType,
      fieldLength,
      decimal
    })
    offset += 32;
  }
  return fields;
}

