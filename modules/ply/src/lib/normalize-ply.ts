// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {MeshAttributes} from '@loaders.gl/schema';
import {getMeshBoundingBox} from '@loaders.gl/schema-utils';
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
// eslint-disable-next-line complexity
function getMeshAttributes(attributes: PLYAttributes): MeshAttributes {
  const accessors: MeshAttributes = {};

  for (const attributeName of Object.keys(attributes)) {
    switch (attributeName) {
      case 'vertices':
        if (attributes.vertices.length > 0) {
          accessors.POSITION = {value: getFloat32Array(attributes.vertices), size: 3};
        }
        break;

      // optional attributes data
      case 'normals':
        if (attributes.normals.length > 0) {
          accessors.NORMAL = {value: getFloat32Array(attributes.normals), size: 3};
        }
        break;

      case 'uvs':
        if (attributes.uvs.length > 0) {
          accessors.TEXCOORD_0 = {value: getFloat32Array(attributes.uvs), size: 2};
        }
        break;

      case 'colors':
        if (attributes.colors.length > 0) {
          // TODO - normalized shoud be based on `uchar` flag in source data?
          accessors.COLOR_0 = {value: getUint8Array(attributes.colors), size: 3, normalized: true};
        }
        break;

      case 'indices':
        break;

      default:
        if (attributes[attributeName].length > 0) {
          accessors[attributeName] = {value: getFloat32Array(attributes[attributeName]), size: 1};
        }
        break;
    }
  }
  return accessors;
}

/** Return a Float32Array without copying when the parser already produced one. */
function getFloat32Array(attribute: PLYAttributes[string]): Float32Array {
  return attribute instanceof Float32Array ? attribute : new Float32Array(attribute);
}

/** Return a Uint8Array without copying when the parser already produced one. */
function getUint8Array(attribute: PLYAttributes[string]): Uint8Array {
  return attribute instanceof Uint8Array ? attribute : new Uint8Array(attribute);
}
