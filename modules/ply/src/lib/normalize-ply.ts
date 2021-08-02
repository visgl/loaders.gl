import type {MeshAttributes} from '@loaders.gl/schema';
import {getMeshBoundingBox} from '@loaders.gl/schema';
import type {PLYMesh, PLYHeader, PLYAttributes, MeshHeader} from './ply-types';
import {getPLYSchema} from './get-ply-schema';

/**
 * @param header
 * @param attributes
 * @returns data and header
 */
export default function normalizePLY(
  plyHeader: MeshHeader & PLYHeader,
  plyAttributes: PLYAttributes,
  options?: {}
): PLYMesh {
  const attributes = getMeshAttributes(plyAttributes);
  const boundingBox = getMeshBoundingBox(attributes);
  const vertexCount = plyAttributes.indices.length || plyAttributes.vertices.length / 3;

  // TODO - how to detect POINT CLOUDS vs MESHES?
  // TODO - For Meshes, PLY quadrangles must be split?
  const isTriangles = plyAttributes.indices && plyAttributes.indices.length > 0;
  const mode = isTriangles ? 4 : 0; // TRIANGLES vs POINTS
  const topology = isTriangles ? 'triangle-list' : 'point-list';

  const schema = getPLYSchema(plyHeader, attributes);

  const plyMesh: PLYMesh = {
    loader: 'ply',
    loaderData: plyHeader,
    header: {
      vertexCount,
      boundingBox
    },
    schema,
    attributes,
    indices: {value: new Uint32Array(0), size: 0},
    mode,
    topology
  };

  if (plyAttributes.indices.length > 0) {
    plyMesh.indices = {value: new Uint32Array(plyAttributes.indices), size: 1};
  }

  return plyMesh;
}

/**
 * @param attributes
 * @returns accessors []
 */
function getMeshAttributes(attributes: PLYAttributes): MeshAttributes {
  const accessors: MeshAttributes = {};

  accessors.POSITION = {value: new Float32Array(attributes.vertices), size: 3};

  // optional attributes data

  if (attributes.normals.length > 0) {
    accessors.NORMAL = {value: new Float32Array(attributes.normals), size: 3};
  }

  if (attributes.uvs.length > 0) {
    accessors.TEXCOORD_0 = {value: new Float32Array(attributes.uvs), size: 2};
  }

  if (attributes.colors.length > 0) {
    // TODO - normalized shoud be based on `uchar` flag in source data?
    accessors.COLOR_0 = {value: new Uint8Array(attributes.colors), size: 3, normalized: true};
  }

  return accessors;
}
