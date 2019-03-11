import {getGLTFIndices, getGLTFAccessors, getGLTFAttributeMap} from '@loaders.gl/core';

export function standardizePLYMesh(header, attributes) {
  const vertexCount = attributes.indices.length || attributes.vertices.length / 3;
  const normalizedAttributes = normalizeAttributes(attributes);

  return {
    loaderData: {
      header
    },
    // TODO - how to detect POINT CLOUDS vs MESHES?
    // TODO - For Meshes, PLY quadrangles must be split?
    header: {
      vertexCount
    },
    mode: normalizedAttributes.indices
      ? 4 // TRIANGLES
      : 0, // POINTS
    indices: getGLTFIndices(normalizedAttributes),
    attributes: getGLTFAccessors(normalizedAttributes),
    glTFAttributeMap: getGLTFAttributeMap(normalizedAttributes)
  };
}

function normalizeAttributes(attributes) {
  const accessors = {};

  // mandatory attributes data

  if (attributes.indices.length > 0) {
    accessors.indices = attributes.indices;
  }

  accessors.position = {value: attributes.vertices, size: 3};

  // optional attributes data

  if (attributes.normals.length > 0) {
    accessors.normal = {value: attributes.normals, size: 3};
  }

  if (attributes.uvs.length > 0) {
    accessors.uv = {value: attributes.uvs, size: 2};
  }

  if (attributes.colors.length > 0) {
    accessors.color = {value: attributes.colors, size: 3};
  }

  return accessors;
}
