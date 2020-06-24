/* eslint-disable */

var LITTLE_ENDIAN = true;

function parseDbf(arrayBuffer) {
  // Global header
  var globalHeaderView = new DataView(arrayBuffer, 0, 32);
  var header = parseHeader(globalHeaderView);
  var {headerLength, recordLength, nRecords} = header;

  // Row headers
  // TODO: use code page (.cpg) for encoding. Default to ASCII or UTF-8?
  var encoding = 'utf-8';
  // Requires Node 11+
  var textDecoder = new TextDecoder(encoding);
  var colHeaderView = new DataView(arrayBuffer, 32, headerLength - 32);
  var colHeaders = parseColumnHeaders(colHeaderView, textDecoder);

  // Not exactly sure why start offset is +1?
  // parsedbf uses ((colHeaders.length + 1) << 5) + 2;
  var recordsView = new DataView(arrayBuffer, headerLength + 1);
  return parseRows(recordsView, colHeaders, nRecords, recordLength, textDecoder);
}

function parseHeader(headerView) {
  // Last updated date
  var year = headerView.getUint8(1) + 1900;
  var month = headerView.getUint8(2);
  var day = headerView.getUint8(3);

  // Number of records in data file
  var nRecords = headerView.getUint32(4, LITTLE_ENDIAN);

  // Length of header in bytes
  var headerLength = headerView.getUint16(8, LITTLE_ENDIAN);

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
    recordLength
  };
}

function parseColumnHeaders(view, textDecoder) {
  // NOTE: this might overestimate the number of fields if the "Database
  // Container" container exists and is included in the headerLength
  var nFields = (view.byteLength - 1) / 32;
  var offset = 0;

  var fields = [];
  for (var i = 0; i < nFields; i++) {
    // Better way to read text?
    var name = textDecoder
      .decode(view.buffer.slice(view.byteOffset + offset, view.byteOffset + offset + 11))
      .replace(/\u0000/g, '');

    var dataType = String.fromCharCode(view.getUint8(offset + 11));
    var fieldLength = view.getUint8(offset + 16);
    var decimal = view.getUint8(offset + 17);

    fields.push({
      name,
      dataType,
      fieldLength,
      decimal
    });
    offset += 32;
  }
  return fields;
}

function parseRows(view, fields, nRecords, recordLength, textDecoder) {
  var rows = [];
  for (var i = 0; i < nRecords; i++) {
    var offset = i * recordLength;
    var recordView = new DataView(view.buffer, view.byteOffset + offset, recordLength);
    rows.push(parseRow(recordView, fields, textDecoder));
  }
  return rows;
}

function parseRow(view, fields, textDecoder) {
  var offset = 0;
  var out = {};
  for (var field of fields) {
    var text = textDecoder.decode(
      view.buffer.slice(view.byteOffset + offset, view.byteOffset + offset + field.fieldLength)
    );
    out[field.name] = parseField(text, field.dataType);
    offset += field.fieldLength;
  }

  return out;
}

function parseField(text, dataType) {
  switch (dataType) {
    case 'B':
      return Number(text);
    case 'C':
      return text.trim() || null;
    case 'F':
      return Number(text);
    case 'N':
      return Number(text);
    case 'O':
      return Number(text);
    case 'D':
      return parseDate(text);
    case 'L':
      return readBoolean(text);
    default:
      throw new Error('Unsupported data type');
  }
}

function parseDate(str) {
  return new Date(str.slice(0, 4), parseInt(str.slice(4, 6), 10) - 1, str.slice(6, 8)).getTime();
}

function readBoolean(value) {
  return /^[nf]$/i.test(value) ? false : /^[yt]$/i.test(value) ? true : null;
}
