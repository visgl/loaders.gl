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
  console.log(`Input tileset value: ${value}`);
  console.log(`Modified tileset value: ${value.replace(/\\/g, '/')}`);
  return value.replace(/\\/g, '/');
}
