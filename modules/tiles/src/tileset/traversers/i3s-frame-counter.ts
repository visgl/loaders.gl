/**
 * frameNumber counter to register tile headers that are in loading progress
 * Until all tiles are loaded we won't call `onTraversalEnd` callback
 */
export default class FrameCounter {
  private frameNumberMap: Map<number, number> = new Map();

  increase(frameNumber: number) {
    const oldCount = this.frameNumberMap.get(frameNumber) || 0;
    this.frameNumberMap.set(frameNumber, (oldCount || 0) + 1);
  }

  decrease(frameNumber: number) {
    const oldCount = this.frameNumberMap.get(frameNumber) || 1;
    this.frameNumberMap.set(frameNumber, (oldCount || 0) - 1);
  }

  isZero(frameNumber: number) {
    const count = this.frameNumberMap.get(frameNumber) || 0;
    return count === 0;
  }
}
