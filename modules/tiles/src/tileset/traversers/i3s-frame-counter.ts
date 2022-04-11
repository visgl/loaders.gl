/**
 * Counter to register pending tile headers for the particular frameNumber
 * Until all tiles are loaded we won't call `onTraversalEnd` callback
 */
export default class I3SPendingTilesRegister {
  private frameNumberMap: Map<number, number> = new Map();

  /**
   * Register a new pending tile header for the particular frameNumber
   * @param frameNumber
   */
  register(frameNumber: number) {
    const oldCount = this.frameNumberMap.get(frameNumber) || 0;
    this.frameNumberMap.set(frameNumber, (oldCount || 0) + 1);
  }

  /**
   * Deregister a pending tile header for the particular frameNumber
   * @param frameNumber
   */
  deregister(frameNumber: number) {
    const oldCount = this.frameNumberMap.get(frameNumber) || 1;
    this.frameNumberMap.set(frameNumber, (oldCount || 0) - 1);
  }

  /**
   * Check is there are no pending tile headers registered for the particular frameNumber
   * @param frameNumber
   * @returns
   */
  isZero(frameNumber: number) {
    const count = this.frameNumberMap.get(frameNumber) || 0;
    return count === 0;
  }
}
