// loaders.gl, MIT license

/** A single element of an array is not represented as an array in XML */
export function getXMLArray(xmlValue: any): any[] {
  if (Array.isArray(xmlValue)) {
    return xmlValue;
  }
  if (xmlValue) {
    return [xmlValue];
  }
  return [];
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
