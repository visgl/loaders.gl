/**
 * Get string option value from cli arguments
 * @param index - option's name index in the argument's array.
 *                The value of the option should be next to name of the option.
 * @param args - cli arguments array
 * @returns - string value of the option
 */
export function getStringValue(index: number, args: string[]): string {
  if (index + 1 >= args.length) {
    return '';
  }
  const value = args[index + 1];
  if (value.indexOf('--') === 0) {
    return '';
  }
  return value;
}

/**
 * Modyfy URL path to be compatible with fetch
 * @param index - option's name index in the argument's array.
 *                The value of the option should be next to name of the option.
 * @param args - cli arguments array
 * @returns - string value of the option
 */
export function getURLValue(index: number, args: string[]): string {
  const value = getStringValue(index, args);
  // eslint-disable-next-line no-console
  console.log(`Input tileset value: ${value}`);
  // eslint-disable-next-line no-console
  console.log(`Modified tileset value: ${value.replace(/\\/g, '/')}`);
  return value.replace(/\\/g, '/');
}

export function validateOptionsWithEqual(args: string[]): string[] {
  return args.reduce((acc: string[], curr) => {
    const equalSignIndex = curr.indexOf('=');
    const beforeEqual = curr.slice(0, equalSignIndex);
    const afterEqual = curr.slice(equalSignIndex + 1, curr.length);
    const condition = curr.includes('=') && curr.startsWith('--') && afterEqual;
    if (condition) {
      return acc.concat(beforeEqual, afterEqual);
    }
    return acc.concat(curr);
  }, []);
}

/**
 * Get integer option value from cli arguments
 * @param index - option's name index in the argument's array
 *                The value of the option should be next to name of the option.
 * @param args - cli arguments array
 * @returns - number value of the option
 */
export function getIntegerValue(index: number, args: string[]): number {
  const stringValue: string = getStringValue(index, args);
  const result: number = Number.parseInt(stringValue);
  if (isFinite(result)) {
    return result;
  }
  return NaN;
}

/**
 * Get boolean option value from cli arguments
 * @param index - option's name index in the argument's array
 *                The value of the option should be next to name of the option.
 * @param args - cli arguments array
 * @returns - boolean value of the option
 */
export function getBooleanValue(index: number, args: string[]): boolean {
  const stringValue: string = getStringValue(index, args).toLowerCase().trim();
  if (['--no-draco', '--split-nodes'].includes(args[index]) && !stringValue) {
    return false;
  }
  if (!stringValue || stringValue === 'true') {
    return true;
  }
  return false;
}
