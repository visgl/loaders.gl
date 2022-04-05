import type {B3DMContent} from '@loaders.gl/3d-tiles';

/**
 * Keep only values for B3DM attributes to pass data to worker thread.
 * @param attributes
 */
function getB3DMAttributesWithoutBufferView(attributes) {
  const attributesWithoutBufferView = {};

  for (const attributeName in attributes) {
    attributesWithoutBufferView[attributeName] = {
      value: attributes[attributeName].value
    };
  }

  return attributesWithoutBufferView;
}

/**
 * Prepare attributes for conversion to avoid binary data breaking in worker thread.
 * @param tileContent
 * @returns
 */
export function prepareDataForAttributesConversion(tileContent: B3DMContent) {
  const gltfMaterials = tileContent.gltf?.materials?.map((material) => ({id: material.id}));
  let nodes =
    tileContent.gltf?.scene?.nodes ||
    tileContent.gltf?.scenes?.[0]?.nodes ||
    tileContent.gltf?.nodes ||
    [];

  const prepearedNodes = nodes.map((node) => ({
    ...node,
    mesh: {
      ...node.mesh,
      primitives: node.mesh?.primitives.map((primitive) => ({
        ...primitive,
        indices: {value: primitive?.indices?.value},
        attributes: getB3DMAttributesWithoutBufferView(primitive.attributes),
        material: {
          id: primitive?.material?.id
        }
      }))
    }
  }));

  const cartographicOrigin = tileContent.cartographicOrigin;
  const cartesianModelMatrix = tileContent.cartesianModelMatrix;

  return {
    gltfMaterials,
    nodes: prepearedNodes,
    cartographicOrigin,
    cartesianModelMatrix
  };
}
