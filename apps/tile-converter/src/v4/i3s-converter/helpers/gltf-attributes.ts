import {getConversionAccessor} from './conversion-gltf';
import type {GLTFWithBuffers} from '@loaders.gl/gltf';
import type {ConversionNode} from './conversion-gltf';
import type {Tiles3DTileContent} from '@loaders.gl/tiles-3d/3d-tiles';
import {Matrix4, Vector3} from '@math.gl/core';
import {BoundingSphere, OrientedBoundingBox} from '@math.gl/geometry/culling';
import {getImageData} from '@loaders.gl/images';
import {Ellipsoid} from '@math.gl/geospatial';
import {GLTFAttributesData} from '../types';

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
): GLTFAttributesData {
  const gltf = tileContent.gltf;
  const json = gltf?.json;
  const roots =
    (json?.scene === undefined ? undefined : json.scenes?.[json.scene]?.nodes) ||
    json?.scenes?.[0]?.nodes ||
    json?.nodes?.map((_, index) => index) ||
    [];
  const nodes = gltf ? prepareNodes(gltf, roots) : [];
  const images = (gltf?.images || []).map((image, index) => {
    if (!image || (image as any).compressed) return null;
    const {data, width, height} = getImageData(image);
    return {
      data: Uint8Array.from(data),
      compressed: false,
      height,
      width,
      components: data.length / (width * height),
      mimeType: json?.images?.[index]?.mimeType
    };
  });

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
function prepareNodes(
  gltf: GLTFWithBuffers,
  indices: number[],
  ancestors = new Set<number>()
): ConversionNode[] {
  return indices.map(index => {
    if (ancestors.has(index)) throw new Error('Cyclic glTF node hierarchy');
    const node = gltf.json.nodes![index];
    const mesh = node.mesh === undefined ? undefined : gltf.json.meshes?.[node.mesh];
    return {
      ...node,
      mesh: mesh
        ? {
            primitives: mesh.primitives.map(primitive => ({
              ...primitive,
              indices:
                primitive.indices === undefined
                  ? undefined
                  : getConversionAccessor(gltf, primitive.indices),
              attributes: Object.fromEntries(
                Object.entries(primitive.attributes).map(([name, reference]) => [
                  name,
                  getConversionAccessor(gltf, reference)
                ])
              ),
              material:
                primitive.material === undefined ? undefined : {id: String(primitive.material)}
            }))
          }
        : undefined,
      children: prepareNodes(gltf, node.children || [], new Set([...ancestors, index]))
    };
  });
}
