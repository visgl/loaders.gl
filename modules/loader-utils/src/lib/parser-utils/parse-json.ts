import {getFirstCharacters} from '../binary-utils/get-first-characters';

/**
 * Minimal JSON parser that throws more meaningful error messages
 */
export function parseJSON(string: string): any {
  try {
    return JSON.parse(string);
  } catch (_) {
    throw new Error(`Failed to parse JSON from data starting with "${getFirstCharacters(string)}"`);
  }
}
