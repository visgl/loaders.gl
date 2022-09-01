import type {B3DMContent} from '@loaders.gl/3d-tiles';
import type {GLTFAccessorPostprocessed, GLTFNodePostprocessed} from '@loaders.gl/gltf';
import type {B3DMAttributesData} from '../../i3s-attributes-worker';

type AttributesObject = {
  [k: string]: GLTFAccessorPostprocessed;
};

/**
 * Keep only values for B3DM attributes to pass data to worker thread.
 * @param attributes
 */
function getB3DMAttributesWithoutBufferView(attributes: AttributesObject): AttributesObject {
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
export function prepareDataForAttributesConversion(tileContent: B3DMContent): B3DMAttributesData {
  const gltfMaterials = tileContent.gltf?.materials?.map((material) => ({id: material.id}));
  let nodes =
    tileContent.gltf?.scene?.nodes ||
    tileContent.gltf?.scenes?.[0]?.nodes ||
    tileContent.gltf?.nodes ||
    [];

  const images =
    tileContent.gltf?.images?.map((imageObject) => {
      // Need data only for uncompressed images because we can't get batchIds from compressed textures.
      const data = imageObject?.image?.compressed ? null : imageObject?.image?.data.subarray();
      return {
        data,
        compressed: Boolean(imageObject?.image?.compressed),
        height: imageObject.image.height,
        width: imageObject.image.width,
        components: imageObject.image.components,
        mimeType: imageObject.mimeType
      };
    }) || [];

  prepareNodes(nodes);

  const cartographicOrigin = tileContent.cartographicOrigin;
  const cartesianModelMatrix = tileContent.cartesianModelMatrix;

  return {
    gltfMaterials,
    nodes,
    images,
    cartographicOrigin,
    cartesianModelMatrix
  };
}

/**
 * Traverse all nodes to replace all sensible data with copy to avoid data corruption in worker.
 * @param nodes
 */
function prepareNodes(nodes: GLTFNodePostprocessed[]): void {
  for (let index = 0; index < nodes.length; index++) {
    const node = nodes[index] as any;

    if (node.mesh) {
      nodes[index] = {
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
      };
    }

    if (node.children) {
      prepareNodes(node.children);
    }
  }
}
