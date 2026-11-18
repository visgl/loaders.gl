/** Bounded exact-byte registry for unchanged encoded legacy texture resources. */
export class TextureOwners {
  /** Creates a registry with a bounded additional encoded-image byte budget. */
  constructor(
    /** Maximum additional encoded bytes retained for matching. */
    private readonly maximumBytes = 16 * 1024 * 1024
  ) {}
  /** Encoded bytes retained so hash collisions can never merge distinct textures. */
  private readonly owners: {format: string; data: Uint8Array; nodeId: number}[] = [];
  /** Current retained encoded byte count. */
  private retainedBytes = 0;

  /** Returns an existing owner, or remembers this node while capacity permits. */
  findOrAddOwner(format: string, data: Uint8Array, nodeId: number): number {
    const owner = this.owners.find(
      candidate =>
        candidate.format === format &&
        candidate.data.length === data.length &&
        candidate.data.every((value, index) => value === data[index])
    );
    if (owner) return owner.nodeId;
    if (this.retainedBytes + data.byteLength <= this.maximumBytes) {
      this.owners.push({format, data: Uint8Array.from(data), nodeId});
      this.retainedBytes += data.byteLength;
    }
    return nodeId;
  }

  /** Releases matching state at the start of each conversion. */
  clear(): void {
    this.owners.length = 0;
    this.retainedBytes = 0;
  }
}
