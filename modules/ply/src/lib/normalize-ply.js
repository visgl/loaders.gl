import {getMeshBoundingBox} from '@loaders.gl/loader-utils';

export default function normalizePLY(header, attributes, options) {
  const normalizedAttributes = normalizeAttributes(attributes);

  const result = {
    loaderData: {
      header
    },
    // TODO - how to detect POINT CLOUDS vs MESHES?
    // TODO - For Meshes, PLY quadrangles must be split?
    header: {
      vertexCount: attributes.indices.length || attributes.vertices.length / 3,
      // @ts-ignore Need to export Attributes type
      boundingBox: getMeshBoundingBox(normalizedAttributes)
    },
    mode: attributes.indices && attributes.indices.length > 0 ? 4 : 0, // TRIANGLES vs POINTS
    attributes: normalizedAttributes
  };

  if (attributes.indices && attributes.indices.length > 0) {
    result.indices = {value: new Uint32Array(attributes.indices), size: 1};
  }

  return result;
}

function normalizeAttributes(attributes) {
  const accessors = {};

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
