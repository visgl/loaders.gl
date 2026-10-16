/** Pinned Martini terrain tessellator. */
export default class Martini {
  /** Creates a tessellator for a 2^n+1 grid. */
  constructor(gridSize?: number);
  /** Creates a tile from one padded elevation grid. */
  createTile(terrain: Float32Array): MartiniTile;
}
/** One heightmap tile's mesh decoder. */
export interface MartiniTile {
  /** Builds mesh vertices and triangle indices at the requested maximum error. */
  getMesh(maxError?: number): MartiniMesh;
}
/** Generated integer-grid mesh buffers. */
export interface MartiniMesh {
  /** Paired grid coordinates of each vertex. */
  readonly vertices: Uint16Array;
  /** Triangle vertex indices. */
  readonly triangles: Uint32Array;
}
