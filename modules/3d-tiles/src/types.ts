import type {GLTFObject} from '@loaders.gl/gltf';
import {Matrix4, Vector3} from '@math.gl/core';

export type BatchTableJson = {
  [key: string]: any[];
};

export type B3DMContent = {
  batchTableJson?: BatchTableJson;
  byteLength: number;
  byteOffset: number;
  cartesianModelMatrix: Matrix4;
  cartesianOrigin: Vector3;
  cartographicModelMatrix: Matrix4;
  cartographicOrigin: Vector3;
  featureIds?: number[] | null;
  featureTableBinary?: Uint8Array;
  featureTableJson?: BatchTableJson;
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

export type GLTFHeader = {
  batchLength?: number;
  batchTableBinaryByteLength: number;
  batchTableJsonByteLength: number;
  featureTableBinaryByteLength: number;
  featureTableJsonByteLength: number;
};

export type Node3D = {
  boundingVolume: BoundingVolume;
  children: any;
  geometricError: number;
  content?: {
    uri: string;
    boundingVolume: BoundingVolume;
  };
};

type BoundingVolume = {
  box?: number[];
  sphere?: number[];
};
