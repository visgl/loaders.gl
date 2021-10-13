/**
 * Safely stringify JSON (drop non serializable values like functions and regexps)
 * @param value
 */
export function removeNontransferableOptions(object: object): object {
  // options.log object contains functions which cannot be transferred
  // TODO - decide how to handle logging on workers
  // TODO - warn if options stringification is long
  return JSON.parse(stringifyJSON(object));
}

function stringifyJSON(v: unknown) {
  const cache = new Set();
  return JSON.stringify(v, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (cache.has(value)) {
        // Circular reference found
        try {
          // If this value does not reference a parent it can be deduped
          return JSON.parse(JSON.stringify(value));
        } catch (err) {
          // discard key if value cannot be deduped
          return undefined;
        }
      }
      // Store value in our set
      cache.add(value);
    }
    return value;
  });
}
