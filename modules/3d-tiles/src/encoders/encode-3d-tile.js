import {TILE3D_TYPE} from '../constants';

import {
  encodeComposite3DTile,
  encodeBatchedModel3DTile,
  encodeInstancedModel3DTile,
  encodePointCloud3DTile,
  encodeVector3DTile,
  encodeGeometry3DTile
} from './encoders/3d-tile-encoders';

export function encode3DTile(tile, options) {
  switch (tile.type) {
    case TILE3D_TYPE.COMPOSITE:
      return encodeComposite3DTile({...tile, ...options});
    case TILE3D_TYPE.POINTCLOUD:
      return encodePointCloud3DTile({...tile, ...options});
    case TILE3D_TYPE.MODEL_BATCHED:
      return encodeBatchedModel3DTile({...tile, ...options});
    case TILE3D_TYPE.MODEL_INSTANCED:
      return encodeInstancedModel3DTile({...tile, ...options});
    case TILE3D_TYPE.GEOMETRY:
      return encodeGeometry3DTile({...tile, ...options});
    case TILE3D_TYPE.VECTOR:
      return encodeVector3DTile({...tile, ...options});
    default:
      throw new Error();
  }
}
