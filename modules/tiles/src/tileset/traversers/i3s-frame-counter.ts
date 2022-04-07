export default class FrameCounter {
  private frameNumberMap: Map<number, number> = new Map();

  increase(frameNumber: number) {
    if (this.frameNumberMap.has(frameNumber)) {
      const oldCount = this.frameNumberMap.get(frameNumber);
      this.frameNumberMap.set(frameNumber, oldCount || 0 + 1);
    } else {
      this.frameNumberMap.set(frameNumber, 1);
    }
  }

  decrease(frameNumber: number) {
    if (this.frameNumberMap.has(frameNumber)) {
      const oldCount = this.frameNumberMap.get(frameNumber);
      this.frameNumberMap.set(frameNumber, oldCount || 0 - 1);
    }
  }

  isZero(frameNumber: number) {
    const count = this.frameNumberMap.get(frameNumber) || 0;
    return count === 0;
  }
}
