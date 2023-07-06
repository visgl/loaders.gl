import type {Tiles3DTileContent} from '@loaders.gl/3d-tiles';
import type {GLTFAccessorPostprocessed, GLTFNodePostprocessed} from '@loaders.gl/gltf';
import type {B3DMAttributesData} from '../../i3s-attributes-worker';
import {Matrix4, TypedArray, Vector3} from '@math.gl/core';
import {BoundingSphere, OrientedBoundingBox} from '@math.gl/culling';
import {Ellipsoid} from '@math.gl/geospatial';

/**
 * Prepare attributes for conversion to avoid binary data breaking in worker thread.
 * @param tileContent - 3DTiles tile content
 * @param tileTransform - transformation matrix of the tile, calculated recursively multiplying
 *                        transform of all parent tiles and transform of the current tile
 * @param boundingVolume - initialized bounding volume of the source tile
 * @returns 3DTiles content data, prepared for conversion
 */
export function prepareDataForAttributesConversion(
  tileContent: Tiles3DTileContent,
  tileTransform: Matrix4,
  boundingVolume: OrientedBoundingBox | BoundingSphere
): B3DMAttributesData {
  let nodes =
    tileContent.gltf?.scene?.nodes ||
    tileContent.gltf?.scenes?.[0]?.nodes ||
    tileContent.gltf?.nodes ||
    [];

  const images =
    tileContent.gltf?.images?.map((imageObject) => {
      // Need data only for uncompressed images because we can't get batchIds from compressed textures.
      if (imageObject?.image?.compressed) {
        return null;
      } else {
        const data = imageObject?.image?.data;
        const dataCopy = new Uint8Array(data.length);
        dataCopy.set(data);
        return {
          data: dataCopy,
          compressed: false,
          height: imageObject.image.height,
          width: imageObject.image.width,
          components: imageObject.image.components,
          mimeType: imageObject.mimeType
        };
      }
    }) || [];

  prepareNodes(nodes);

  const {cartographicOrigin, modelMatrix: cartesianModelMatrix} = calculateTransformProps(
    tileContent,
    tileTransform,
    boundingVolume
  );

  return {
    nodes,
    images,
    cartographicOrigin,
    cartesianModelMatrix
  };
}

/**
 * Keep only values for glTF attributes to pass data to worker thread.
 * @param attributes - geometry attributes
 * @returns attributes with only `value` item
 */
function getB3DMAttributesWithoutBufferView(
  attributes: Record<string, GLTFAccessorPostprocessed>
): Record<string, {value: TypedArray}> {
  const attributesWithoutBufferView: Record<string, {value: TypedArray}> = {};

  for (const attributeName in attributes) {
    attributesWithoutBufferView[attributeName] = {
      value: attributes[attributeName].value
    };
  }

  return attributesWithoutBufferView;
}

/**
 * Calculate transformation properties to transform vertex attributes (POSITION, NORMAL, etc.)
 * from METER_OFFSET coorditantes to LNGLAT_OFFSET coordinates
 * @param tileContent - 3DTiles tile content
 * @param tileTransform - transformation matrix of the tile, calculated recursively multiplying
 *                        transform of all parent tiles and transform of the current tile
 * @param boundingVolume - initialized bounding volume of the source tile
 * @returns modelMatrix - transformation matrix to transform coordinates to cartographic coordinates
 *          cartographicOrigin - tile origin coordinates to calculate offsets
 */
export function calculateTransformProps(
  tileContent: Tiles3DTileContent,
  tileTransform: Matrix4,
  boundingVolume: OrientedBoundingBox | BoundingSphere
): {modelMatrix: Matrix4; cartographicOrigin: Vector3} {
  const {rtcCenter, gltfUpAxis} = tileContent;
  const {center} = boundingVolume;

  let modelMatrix = new Matrix4(tileTransform);

  // Translate if appropriate
  if (rtcCenter) {
    modelMatrix.translate(rtcCenter);
  }

  // glTF models need to be rotated from Y to Z up
  // https://github.com/AnalyticalGraphicsInc/3d-tiles/tree/master/specification#y-up-to-z-up
  switch (gltfUpAxis) {
    case 'Z':
      break;
    case 'Y':
      const rotationY = new Matrix4().rotateX(Math.PI / 2);
      modelMatrix = modelMatrix.multiplyRight(rotationY);
      break;
    case 'X':
      const rotationX = new Matrix4().rotateY(-Math.PI / 2);
      modelMatrix = modelMatrix.multiplyRight(rotationX);
      break;
    default:
      break;
  }

  const cartesianOrigin = new Vector3(center);
  const cartographicOrigin = Ellipsoid.WGS84.cartesianToCartographic(
    cartesianOrigin,
    new Vector3()
  );
  return {modelMatrix, cartographicOrigin};
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
              id: primitive?.material?.id,
              uniqueId: primitive?.material?.uniqueId
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
