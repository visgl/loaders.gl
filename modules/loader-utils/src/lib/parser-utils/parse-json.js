import {getFirstCharacters} from '../binary-utils/get-first-characters';

// Minimal JSON parser with a meaningful error message
export function parseJSON(string) {
  try {
    return JSON.parse(string);
  } catch (_) {
    throw new Error(`Failed to parse JSON from data starting with "${getFirstCharacters(string)}"`);
  }
}
