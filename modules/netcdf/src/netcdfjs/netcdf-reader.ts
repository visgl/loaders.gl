import {IOBuffer} from '../iobuffer/iobuffer';

import {readNetCDFHeader} from './read-header';
import {readRecord, readNonRecord} from './read-data';

function notNetcdf(statement, reason) {
  if (statement) {
    throw new TypeError(`Not a valid NetCDF v3.x file: ${reason}`);
  }
}

/**
 * Reads a NetCDF v3.x file
 * https://www.unidata.ucar.edu/software/netcdf/docs/file_format_specifications.html
 * @param {ArrayBuffer} data - ArrayBuffer or any Typed Array (including Node.js' Buffer from v4) with the data
 * @constructor
 */
export class NetCDFReader {
  public header;
  public buffer: IOBuffer;

  constructor(data) {
    const buffer = new IOBuffer(data);
    buffer.setBigEndian();

    // Validate that it's a NetCDF file
    const magic = buffer.readChars(3);
    if (magic !== 'CDF') {
      throw new Error(`NetCDF: file should start with 'CDF', found ${magic}`);
    }

    // Check the NetCDF format
    const version = buffer.readByte();
    if (version > 2) {
      throw new Error(`NetCDF: unsupported version ${version}`);
    }

    // Read the header
    this.header = readNetCDFHeader(buffer, version);
    this.buffer = buffer;
  }

  /**
   * @return {string} - Version for the NetCDF format
   */
  get version() {
    if (this.header.version === 1) {
      return 'classic format';
    }
    return '64-bit offset format';
  }

  /**
   * @return {object} - Metadata for the record dimension
   *  * `length`: Number of elements in the record dimension
   *  * `id`: Id number in the list of dimensions for the record dimension
   *  * `name`: String with the name of the record dimension
   *  * `recordStep`: Number with the record variables step size
   */
  get recordDimension() {
    return this.header.recordDimension;
  }

  /**
   * @return {Array<object>} - List of dimensions with:
   *  * `name`: String with the name of the dimension
   *  * `size`: Number with the size of the dimension
   */
  get dimensions() {
    return this.header.dimensions;
  }

  /**
   * @return {Array<object>} - List of global attributes with:
   *  * `name`: String with the name of the attribute
   *  * `type`: String with the type of the attribute
   *  * `value`: A number or string with the value of the attribute
   */
  get globalAttributes() {
    return this.header.globalAttributes;
  }

  /**
   * Returns the value of an attribute
   * @param {string} attributeName
   * @return {string} Value of the attributeName or null
   */
  getAttribute(attributeName) {
    const attribute = this.globalAttributes.find((val) => val.name === attributeName);
    if (attribute) return attribute.value;
    return null;
  }

  /**
   * Returns the value of a variable as a string
   * @param {string} variableName
   * @return {string} Value of the variable as a string or null
   */
  getDataVariableAsString(variableName) {
    const variable = this.getDataVariable(variableName);
    if (variable) return variable.join('');
    return null;
  }

  /**
   * @return {Array<object>} - List of variables with:
   *  * `name`: String with the name of the variable
   *  * `dimensions`: Array with the dimension IDs of the variable
   *  * `attributes`: Array with the attributes of the variable
   *  * `type`: String with the type of the variable
   *  * `size`: Number with the size of the variable
   *  * `offset`: Number with the offset where of the variable begins
   *  * `record`: True if is a record variable, false otherwise
   */
  get variables() {
    return this.header.variables;
  }

  toString(): string {
    const result: string[] = [];

    result.push('DIMENSIONS');
    for (const dimension of this.dimensions) {
      result.push(`  ${dimension.name.padEnd(30)} = size: ${dimension.size}`);
    }

    result.push('');
    result.push('GLOBAL ATTRIBUTES');
    for (const attribute of this.globalAttributes) {
      result.push(`  ${attribute.name.padEnd(30)} = ${attribute.value}`);
    }

    const variables = JSON.parse(JSON.stringify(this.variables));
    result.push('');
    result.push('VARIABLES:');
    for (const variable of variables) {
      variable.value = this.getDataVariable(variable);
      let stringify = JSON.stringify(variable.value);
      if (stringify.length > 50) stringify = stringify.substring(0, 50);
      if (!isNaN(variable.value.length)) {
        stringify += ` (length: ${variable.value.length})`;
      }
      result.push(`  ${variable.name.padEnd(30)} = ${stringify}`);
    }
    return result.join('\n');
  }

  /**
   * Retrieves the data for a given variable
   * @param {string|object} variableName - Name of the variable to search or variable object
   * @return {Array} - List with the variable values
   */
  getDataVariable(variableName) {
    let variable;
    if (typeof variableName === 'string') {
      // search the variable
      variable = this.header.variables.find(function (val) {
        return val.name === variableName;
      });
    } else {
      variable = variableName;
    }

    // throws if variable not found
    notNetcdf(variable === undefined, `variable not found: ${variableName}`);

    // go to the offset position
    this.buffer.seek(variable.offset);

    if (variable.record) {
      // record variable case
      return readRecord(this.buffer, variable, this.header.recordDimension);
    }
    // non-record variable case
    return readNonRecord(this.buffer, variable);
  }

  /**
   * Check if a dataVariable exists
   * @param {string} variableName - Name of the variable to find
   * @return {boolean}
   */
  dataVariableExists(variableName) {
    const variable = this.header.variables.find(function (val) {
      return val.name === variableName;
    });
    return variable !== undefined;
  }

  /**
   * Check if an attribute exists
   * @param {string} attributeName - Name of the attribute to find
   * @return {boolean}
   */
  attributeExists(attributeName) {
    const attribute = this.globalAttributes.find((val) => val.name === attributeName);
    return attribute !== undefined;
  }
}
