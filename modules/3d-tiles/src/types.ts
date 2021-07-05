import type {GLTFObject, GLTFHeader} from '@loaders.gl/gltf';
import {Matrix4, Vector3} from '@math.gl/core';

export type TableJson = {
  [key: string]: any[];
};

export type B3DMContent = {
  batchTableJson?: TableJson;
  byteLength: number;
  byteOffset: number;
  cartesianModelMatrix: Matrix4;
  cartesianOrigin: Vector3;
  cartographicModelMatrix: Matrix4;
  cartographicOrigin: Vector3;
  featureIds?: number[] | null;
  featureTableBinary?: Uint8Array;
  featureTableJson?: TableJson;
  gltf?: GLTFObject;
  gltfUpAxis: string;
  header: GLTFHeader;
  magic: number;
  modelMatrix: Matrix4;
  rotateYtoZ: boolean;
  rtcCenter: [number, number, number];
  type: string;
  version: number;
};
