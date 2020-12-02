import {AnyArrayType, VECTOR_TYPES} from '../types';

/**
 * Encodes set of arrays into the Apache Arrow columnar format
 * https://arrow.apache.org/docs/format/Columnar.html#ipc-file-format
 * @param data - columns data
 * @param options - the writer options
 * @returns - encoded ArrayBuffer
 */
export function encodeArrowSync(
  data: Array<{array: AnyArrayType; name: string; type: VECTOR_TYPES}>,
  options
): ArrayBuffer;
