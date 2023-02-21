// TODO - these utilities could be moved to the XML parser.
// uncapitalizeKeys could be an XMLLoader option

/**
 * Extracts a value or array and always return an array
 * Useful since XML parses to object instead of array when only a single value is provided
 */
export function convertXMLValueToArray(xmlValue: unknown): unknown[] {
  if (Array.isArray(xmlValue)) {
    return xmlValue;
  }
  if (xmlValue && typeof xmlValue === 'object' && xmlValue['0']) {
    // Error this is an objectified array
  }
  if (xmlValue) {
    return [xmlValue];
  }
  return [];
}

/**
 * Mutates a field in place, converting it to array
 * Useful since XML parses to object instead of array when only a single value is provided
 */
export function convertXMLFieldToArrayInPlace(xml: any, key: string): void {
  xml[key] = convertXMLValueToArray(xml[key]);
}
