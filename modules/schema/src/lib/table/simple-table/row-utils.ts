/** Convert an object row to an array row */
export function convertToObjectRow(
  arrayRow: any[],
  headers: string[]
): {[columnName: string]: any} {
  if (!arrayRow) {
    throw new Error('null row');
  }
  if (!headers) {
    throw new Error('no headers');
  }
  const objectRow = {};
  for (let i = 0; i < headers.length; i++) {
    objectRow[headers[i]] = arrayRow[i];
  }
  return objectRow;
}

/** Convert an object row to an array row */
export function convertToArrayRow(
  objectRow: {[columnName: string]: any},
  headers: string[]
): any[] {
  if (!objectRow) {
    throw new Error('null row');
  }
  if (!headers) {
    throw new Error('no headers');
  }
  const arrayRow = new Array(headers.length);
  for (let i = 0; i < headers.length; i++) {
    arrayRow[i] = objectRow[headers[i]];
  }
  return arrayRow;
}
