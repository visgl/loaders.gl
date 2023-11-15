/**
 * Handle UVs if they are out of range [0,1].
 * @param n
 */
export function emod(n: number): number {
  return ((n % 1) + 1) % 1;
}
