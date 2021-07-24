export const TYPES = {
  BYTE: 1,
  CHAR: 2,
  SHORT: 3,
  INT: 4,
  FLOAT: 5,
  DOUBLE: 6
};

function notNetcdf(statement, reason) {
  if (statement) {
    throw new TypeError(`Not a valid NetCDF v3.x file: ${reason}`);
  }
}

/**
 * Given a type and a size reads the next element
 * @ignore
 * @param {IOBuffer} buffer - Buffer for the file data
 * @param {number} type - Type of the data to read
 * @param {number} size - Size of the element to read
 * @return {string|Array<number>|number}
 */
export function readType(buffer, type, size) {
  switch (type) {
    case TYPES.BYTE:
      return buffer.readBytes(size);
    case TYPES.CHAR:
      return trimNull(buffer.readChars(size));
    case TYPES.SHORT:
      return readNumber(size, buffer.readInt16.bind(buffer));
    case TYPES.INT:
      return readNumber(size, buffer.readInt32.bind(buffer));
    case TYPES.FLOAT:
      return readNumber(size, buffer.readFloat32.bind(buffer));
    case TYPES.DOUBLE:
      return readNumber(size, buffer.readFloat64.bind(buffer));
    /* istanbul ignore next */
    default:
      notNetcdf(true, `non valid type ${type}`);
      return undefined;
  }
}

/**
 * Parse a number into their respective type
 * @ignore
 * @param {number} type - integer that represents the type
 * @return {string} - parsed value of the type
 */
export function num2str(type: number): string {
  switch (Number(type)) {
    case TYPES.BYTE:
      return 'byte';
    case TYPES.CHAR:
      return 'char';
    case TYPES.SHORT:
      return 'short';
    case TYPES.INT:
      return 'int';
    case TYPES.FLOAT:
      return 'float';
    case TYPES.DOUBLE:
      return 'double';
    /* istanbul ignore next */
    default:
      return 'undefined';
  }
}

/**
 * Parse a number type identifier to his size in bytes
 * @ignore
 * @param {number} type - integer that represents the type
 * @return {number} -size of the type
 */
export function num2bytes(type) {
  switch (Number(type)) {
    case TYPES.BYTE:
      return 1;
    case TYPES.CHAR:
      return 1;
    case TYPES.SHORT:
      return 2;
    case TYPES.INT:
      return 4;
    case TYPES.FLOAT:
      return 4;
    case TYPES.DOUBLE:
      return 8;
    /* istanbul ignore next */
    default:
      return -1;
  }
}

/**
 * Reverse search of num2str
 * @ignore
 * @param {string} type - string that represents the type
 * @return {number} - parsed value of the type
 */
export function str2num(type) {
  switch (String(type)) {
    case 'byte':
      return TYPES.BYTE;
    case 'char':
      return TYPES.CHAR;
    case 'short':
      return TYPES.SHORT;
    case 'int':
      return TYPES.INT;
    case 'float':
      return TYPES.FLOAT;
    case 'double':
      return TYPES.DOUBLE;
    /* istanbul ignore next */
    default:
      return -1;
  }
}

/**
 * Auxiliary function to read numeric data
 * @ignore
 * @param {number} size - Size of the element to read
 * @param {function} bufferReader - Function to read next value
 * @return {Array<number>|number}
 */
function readNumber(size, bufferReader) {
  if (size !== 1) {
    const numbers = new Array(size);
    for (let i = 0; i < size; i++) {
      numbers[i] = bufferReader();
    }
    return numbers;
  }
  return bufferReader();
}

/**
 * Removes null terminate value
 * @ignore
 * @param {string} value - String to trim
 * @return {string} - Trimmed string
 */
function trimNull(value) {
  if (value.charCodeAt(value.length - 1) === 0) {
    return value.substring(0, value.length - 1);
  }
  return value;
}
