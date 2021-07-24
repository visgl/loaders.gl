import type {IOBuffer} from '../iobuffer/iobuffer';
import {readType, str2num, num2bytes} from './read-type';

// const STREAMING = 4294967295;

/**
 * Read data for the given non-record variable
 * @param buffer - Buffer for the file data
 * @param {object} variable - Variable metadata
 * @return Data of the element
 */
export function readNonRecord(buffer: IOBuffer, variable): any[] {
  // variable type
  const type = str2num(variable.type);

  // size of the data
  const size = variable.size / num2bytes(type);

  // iterates over the data
  const data = new Array(size);
  for (let i = 0; i < size; i++) {
    data[i] = readType(buffer, type, 1);
  }

  return data;
}

/**
 * Read data for the given record variable
 * @param buffer - Buffer for the file data
 * @param {object} variable - Variable metadata
 * @param {object} recordDimension - Record dimension metadata
 * @return - Data of the element
 */
export function readRecord(buffer: IOBuffer, variable, recordDimension): any[] {
  // variable type
  const type = str2num(variable.type);
  const width = variable.size ? variable.size / num2bytes(type) : 1;

  // size of the data
  // TODO streaming data
  const size = recordDimension.length;

  // iterates over the data
  const data = new Array(size);
  const step = recordDimension.recordStep;

  for (let i = 0; i < size; i++) {
    const currentOffset = buffer.offset;
    data[i] = readType(buffer, type, width);
    buffer.seek(currentOffset + step);
  }

  return data;
}
