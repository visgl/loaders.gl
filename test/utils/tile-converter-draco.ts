import type {MeshGeometry} from '@loaders.gl/schema';
import type {MeshTileMaterial} from '../../apps/tile-converter/src/v5/mesh';
import {encodeDracoMeshTile} from '../../apps/tile-converter/src/v5/mesh-draco';

/** Generates a tiny compressed source using the same portable writer as v5 archive output. */
export async function createCompressedMesh(
  mesh: MeshGeometry = {
    topology: 'triangle-list',
    mode: 4,
    attributes: {POSITION: {size: 3, value: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0])}},
    indices: {size: 1, value: new Uint16Array([0, 1, 2])}
  },
  material?: MeshTileMaterial
): Promise<ArrayBuffer> {
  return (await encodeDracoMeshTile(mesh, {material}, {useLocalLibraries: true})).glb;
}
