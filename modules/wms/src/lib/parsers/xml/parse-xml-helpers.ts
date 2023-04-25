// loaders.gl, MIT license

/** A single element of an array is not represented as an array in XML */
export function getXMLArray(xmlValue: any): any[] {
  // Already an array, return as is
  if (Array.isArray(xmlValue)) {
    return xmlValue;
  }
  // Single value, wrap in array
  if (xmlValue) {
    return [xmlValue];
  }
  // nullish, return empty array
  return [];
}

/** Get a list of strings from XML */
export function getXMLStringArray(xmlValue: any): string[] {
  const xmlArray = getXMLArray(xmlValue);
  if (xmlArray.length > 0 && xmlArray.every((_) => typeof _ === 'string')) {
    return xmlArray as string[];
  }
  // TODO - error handling?
  return [];
}

/** Get XML float */
export function getXMLFloat(xmlValue: any, defaultValue = undefined): number | undefined {
  switch (typeof xmlValue) {
    case 'number':
      return xmlValue;
    case 'string':
      return parseFloat(xmlValue);
    default:
      return undefined;
  }
}

/** Get XML integer */
export function getXMLInteger(xmlValue: any, defaultValue = undefined): number | undefined {
  switch (typeof xmlValue) {
    case 'number':
      return xmlValue;
    case 'string':
      return parseInt(xmlValue, 10);
    default:
      return undefined;
  }
}

/** Somewhat arbitrary boolean parsing */
export function getXMLBoolean(xmlValue: any): boolean {
  switch (xmlValue) {
    case 'true':
      return true;
    case 'false':
      return false;
    case '1':
      return true;
    case '0':
      return false;
    default:
      return false;
  }
}
