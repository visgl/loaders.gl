// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/* eslint-disable camelcase */

import {ImageType} from '@loaders.gl/images';
import type {GLTF} from './gltf-json-schema';

/** GLTFLoader removes processed extensions from `extensionsUsed` and `extensionsUsed`
 * `processedExtensions` is used to track those extensions
 */
export type GLTFWithBuffers = {
  json: GLTF;
  binary?: ArrayBuffer;
  buffers: GLTFExternalBuffer[];
  images?: GLTFExternalImage[];
  /** Resolved draft glTF 2.1 unified file references, parallel to `json.files`. */
  files?: GLTFExternalFile[];
  /** Parsed draft glTF 2.1 external assets, parallel to `json.externalAssets`. */
  externalAssets?: Array<GLTFWithBuffers | null>;
};

export type GLTFExternalBuffer = {
  arrayBuffer: ArrayBuffer;
  byteOffset: number;
  byteLength: number;
};

/** Raw bytes and metadata for a resolved draft glTF 2.1 file reference. */
export type GLTFExternalFile = GLTFExternalBuffer & {
  /** MIME type declared by the file definition. */
  mimeType: string;
  /** Optional package lookup name declared by the file definition. */
  name?: string;
  /** Resolved URL for URI-backed files. */
  url?: string;
};

type GLTFExternalImage =
  | ImageType
  | {
      compressed: true;
      mipmaps: false;
      width: number;
      height: number;
      data: Uint8Array;
    };

export type FeatureTableJson = {
  [key: string]: any[];
};

export type {
  GLTF,
  GLTFAccessor,
  GLTFBuffer,
  GLTFBufferView,
  // GLTFCamera,
  GLTFMeshPrimitive,
  GLTFMesh,
  GLTFNode,
  GLTFMaterial,
  GLTFSampler,
  GLTFScene,
  GLTFSkin,
  GLTFTexture,
  GLTFImage,
  GLTFFile,
  GLTFExternalAsset,
  GLTF_KHR_binary_glTF,
  GLTF_KHR_draco_mesh_compression,
  GLTF_KHR_texture_basisu,
  GLTF_KHR_meshopt_compression,
  GLTF_EXT_meshopt_compression,
  GLTF_EXT_texture_webp
} from './gltf-json-schema';

export type {GLTFShape, GLTFBoundingVolume} from './gltf-shape-schema';

export type {
  GLTFPostprocessed,
  GLTFAccessorPostprocessed,
  GLTFImagePostprocessed,
  GLTFNodePostprocessed,
  GLTFMeshPostprocessed,
  GLTFMeshPrimitivePostprocessed,
  GLTFMaterialPostprocessed,
  GLTFTexturePostprocessed
} from './gltf-postprocessed-schema';
