import {Table} from 'apache-arrow/Arrow.es5.min';

//========================================================
// This code is from private part of H3-JS library
// https://github.com/uber/h3-js/blob/master/lib/h3core.js
//========================================================
/**
 * 64-bit hexidecimal string representation of an H3 index
 * @static
 * @typedef {string} H3Index
 */
// Alias the hexidecimal base for legibility
const BASE_16 = 16;
//========================================================

// Parses arrow to a columnar table
export default function parseArrowSync(arrayBuffer, options) {
  const arrowTable = Table.from([new Uint8Array(arrayBuffer)]);

  // Extract columns

  // TODO - avoid calling `getColumn` on columns we are not interested in?
  // Add options object?
  const columnarTable = {};

  arrowTable.schema.fields.forEach(field => {
    // This (is intended to) coalesce all record batches into a single typed array
    const arrowColumn = arrowTable.getColumn(field.name);
    const metadata = arrowColumn.metadata;
    let values;
    if (metadata.has('hex64str') && metadata.get('hex64str') && arrowColumn.name === 'h3') {
      values = getH3IndexValues(arrowColumn.data.values);
    } else {
      values = arrowColumn.toArray();
    }

    columnarTable[field.name] = values;
  });

  return columnarTable;
}

function getH3IndexValues(array) {
  const result = [];
  for (let index = 0; index < array.length; index += 2) {
    result.push(splitLongToh3Index(array[index], array[index + 1]));
  }
  return result;
}

//========================================================
// This code is from private part of H3-JS library
// https://github.com/uber/h3-js/blob/master/lib/h3core.js
//========================================================
/**
 * Convert a 32-bit int to a hexdecimal string
 * @private
 * @param  {number} num  Integer to convert
 * @return {H3Index}     Hexidecimal string
 */
function hexFrom32Bit(num) {
  if (num >= 0) {
    return num.toString(BASE_16);
  }

  // Handle negative numbers
  num = num & 0x7fffffff;
  let tempStr = zeroPad(8, num.toString(BASE_16));
  const topNum = (parseInt(tempStr[0], BASE_16) + 8).toString(BASE_16);
  tempStr = topNum + tempStr.substring(1);
  return tempStr;
}

/**
 * Get a H3 index from a split long (pair of 32-bit ints)
 * @private
 * @param  {number} lower Lower 32 bits
 * @param  {number} upper Upper 32 bits
 * @return {H3Index}       H3 index
 */
function splitLongToh3Index(lower, upper) {
  return hexFrom32Bit(upper) + zeroPad(8, hexFrom32Bit(lower));
}

/**
 * Zero-pad a string to a given length
 * @private
 * @param  {number} fullLen Target length
 * @param  {string} numStr  String to zero-pad
 * @return {string}         Zero-padded string
 */
function zeroPad(fullLen, numStr) {
  const numZeroes = fullLen - numStr.length;
  let outStr = '';
  for (let i = 0; i < numZeroes; i++) {
    outStr += '0';
  }
  outStr = outStr + numStr;
  return outStr;
}
//========================================================
