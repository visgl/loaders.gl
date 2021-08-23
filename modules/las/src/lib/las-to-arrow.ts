import {convertMeshToArrowTable} from '@loaders.gl/schema';
import {makeMetadataFromLasHeader} from './get-las-schema';
import {LASMesh} from './las-types';

export function lasToArrow(lasMesh: LASMesh): ArrayBuffer {
  const metadata = makeMetadataFromLasHeader(lasMesh.loaderData);
  const table = convertMeshToArrowTable(lasMesh, metadata);
  return table.serialize();
}
