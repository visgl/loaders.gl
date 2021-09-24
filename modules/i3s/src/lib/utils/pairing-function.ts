/**
 *  Pairing function which allows to encode two natural numbers into a single natural number.
 * https://en.wikipedia.org/wiki/Pairing_function#Cantor_pairing_function
 * @param x - first natual number
 * @param y  - second natual number
 * @returns unique natural number
 */
export function cantorPair(x: number, y: number): number {
  return 0.5 * (x + y) * (x + y + 1) + y;
}

/**
 * Invert pairing operation to find initial values.
 * @param z - result of pairing function
 * @returns object with initial two natural values.
 */
export function invertCantorPairing(z: number): {x: number; y: number} {
  const w = Math.floor(0.5 * (Math.sqrt(8 * z + 1) - 1));
  const t = 0.5 * (Math.pow(w, 2) + w);
  const y = z - t;
  const x = w - y;

  return {x, y};
}
