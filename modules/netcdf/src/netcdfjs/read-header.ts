import type {IOBuffer} from '../iobuffer/iobuffer';
import type {NetCDFHeader, NetCDFDimension, NetCDFVariable, NetCDFAttribute} from './netcdf-types';
import {readType, num2str} from './read-type';

// Grammar constants
const ZERO = 0;
const NC_DIMENSION = 10;
const NC_VARIABLE = 11;
const NC_ATTRIBUTE = 12;

const NC_UNLIMITED = 0;

/**
 * Read the header of the file
 * @param buffer - Buffer for the file data
 * @param version - Version of the file
 * @return  - Header
 */
export function readNetCDFHeader(buffer: IOBuffer, version: number): NetCDFHeader {
  // Length of record dimension
  // sum of the varSize's of all the record variables.
  const recordDimensionLength = buffer.readUint32();

  // List of dimensions
  const dimList = readDimensionsList(buffer);

  // List of global attributes
  const globalAttributes = readAttributesList(buffer);

  // List of variables
  const variableList = readVariablesList(buffer, dimList.recordId, version);

  const header: NetCDFHeader = {
    version,
    recordDimension: {
      length: recordDimensionLength,
      id: dimList.recordId, // id of the unlimited dimension
      name: dimList.recordName, // name of the unlimited dimension
      recordStep: variableList.recordStep
    },
    dimensions: dimList.dimensions,
    variables: variableList.variables,
    globalAttributes
  };

  return header;
}

/**
 * Read list of dimensions
 * @ignore
 * @param {IOBuffer} buffer - Buffer for the file data
 */
function readDimensionsList(buffer: IOBuffer): {
  recordId: number;
  recordName: string;
  dimensions: NetCDFDimension[];
} {
  const dimList = buffer.readUint32();
  if (dimList === ZERO) {
    if (buffer.readUint32() !== ZERO) {
      throw new Error('NetCDF: wrong empty tag for list of dimensions');
    }
    // TODO - is this empty dimension list supported / recoverable?
    return {
      recordId: 0,
      recordName: '',
      dimensions: []
    };
  }

  if (dimList !== NC_DIMENSION) {
    throw new Error('NetCDF: wrong tag for list of dimensions');
  }

  // Length of dimensions
  const dimensionSize = buffer.readUint32();
  const dimensions = new Array(dimensionSize);
  let recordId;
  let recordName;
  for (let dim = 0; dim < dimensionSize; dim++) {
    // Read name
    const name = readName(buffer);

    // Read dimension size
    const size = buffer.readUint32();
    if (size === NC_UNLIMITED) {
      // in netcdf 3 one field can be of size unlimmited
      recordId = dim;
      recordName = name;
    }

    dimensions[dim] = {
      name,
      size
    };
  }

  return {
    dimensions,
    recordId,
    recordName
  };
}

/**
 * List of attributes
 * @ignore
 * @param buffer - Buffer for the file data
 * @return List of attributes with:
 */
function readAttributesList(buffer: IOBuffer): NetCDFAttribute[] {
  const gAttList = buffer.readUint32();
  if (gAttList === ZERO) {
    if (buffer.readUint32() !== ZERO) {
      throw new Error('NetCDF: wrong empty tag for list of attributes');
    }
    return [];
  }

  if (gAttList !== NC_ATTRIBUTE) {
    throw new Error('NetCDF: wrong tag for list of attributes');
  }

  // Length of attributes
  const attributeSize = buffer.readUint32();
  const attributes = new Array(attributeSize);
  for (let gAtt = 0; gAtt < attributeSize; gAtt++) {
    // Read name
    const name = readName(buffer);

    // Read type
    const type = buffer.readUint32();
    if (type < 1 || type > 6) {
      throw new Error(`NetCDF: non valid type ${type}`);
    }

    // Read attribute
    const size = buffer.readUint32();
    const value = readType(buffer, type, size);

    // Apply padding
    padding(buffer);

    attributes[gAtt] = {
      name,
      type: num2str(type),
      value
    };
  }
  return attributes;
}

/**
 * List of variables
 * @param buffer - Buffer for the file data
 * @param recordId - Id of the unlimited dimension (also called record dimension)
 *                            This value may be undefined if there is no unlimited dimension
 * @param {number} version - Version of the file
 */
// eslint-disable-next-line max-statements, complexity
function readVariablesList(
  buffer: IOBuffer,
  recordId: number,
  version: number
): {
  recordStep: number;
  variables: NetCDFVariable[];
} {
  const varList = buffer.readUint32();
  let recordStep = 0;
  if (varList === ZERO) {
    if (buffer.readUint32() !== ZERO) {
      throw new Error('NetCDF: wrong empty tag for list of variables');
    }
    return {
      recordStep,
      variables: []
    };
  }

  if (varList !== NC_VARIABLE) {
    throw new Error('NetCDF: wrong tag for list of variables');
  }

  // Length of variables
  const variableSize = buffer.readUint32();
  const variables = new Array(variableSize);
  for (let v = 0; v < variableSize; v++) {
    // Read name
    const name = readName(buffer);

    // Read dimensionality of the variable
    const dimensionality = buffer.readUint32();

    // Index into the list of dimensions
    const dimensionsIds = new Array(dimensionality);
    for (let dim = 0; dim < dimensionality; dim++) {
      dimensionsIds[dim] = buffer.readUint32();
    }

    // Read variables size
    const attributes = readAttributesList(buffer);

    // Read type
    const type = buffer.readUint32();
    if (type < 1 && type > 6) {
      throw new Error(`NetCDF: non valid type ${type}`);
    }

    // Read variable size
    // The 32-bit varSize field is not large enough to contain the size of variables that require
    // more than 2^32 - 4 bytes, so 2^32 - 1 is used in the varSize field for such variables.
    const varSize = buffer.readUint32();

    // Read offset
    let offset = buffer.readUint32();
    if (version === 2) {
      if (offset > 0) {
        throw new Error('NetCDF: offsets larger than 4GB not supported');
      }
      offset = buffer.readUint32();
    }

    let record = false;
    // Count amount of record variables
    if (typeof recordId !== 'undefined' && dimensionsIds[0] === recordId) {
      recordStep += varSize;
      record = true;
    }
    variables[v] = {
      name,
      dimensions: dimensionsIds,
      attributes,
      type: num2str(type),
      size: varSize,
      offset,
      record
    };
  }

  return {
    variables,
    recordStep
  };
}

// HELPERS

/**
 * Reads the name
 * @param buffer - Buffer for the file data
 * @return Name
 */
export function readName(buffer: IOBuffer): string {
  // Read name
  const nameLength = buffer.readUint32();
  const name = buffer.readChars(nameLength);

  // validate name
  // TODO

  // Apply padding
  padding(buffer);
  return name;
}

/**
 * Moves 1, 2, or 3 bytes to next 4-byte boundary
 */
function padding(buffer: IOBuffer) {
  if (buffer.offset % 4 !== 0) {
    buffer.skip(4 - (buffer.offset % 4));
  }
}
