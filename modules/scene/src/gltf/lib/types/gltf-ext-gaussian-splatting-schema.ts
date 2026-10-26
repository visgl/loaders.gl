// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

/* eslint-disable camelcase */

/** JSON representation of the ratified KHR_gaussian_splatting primitive extension. */
export type GLTF_KHR_gaussian_splatting = {
  /** Gaussian kernel name, currently `ellipse` for the ratified extension. */
  kernel: string;
  /** Color space of reconstructed splat colors. */
  colorSpace: string;
  /** Projection method, defaulting to perspective. */
  projection?: string;
  /** Sorting method, defaulting to cameraDistance. */
  sortingMethod?: string;
  /** Optional nested compression extensions. */
  extensions?: {
    KHR_gaussian_splatting_compression_spz_2?: GLTF_KHR_gaussian_splatting_compression_spz_2;
    [key: string]: unknown;
  };
};

/** JSON representation of the draft SPZ2 compression extension. */
export type GLTF_KHR_gaussian_splatting_compression_spz_2 = {
  /** Buffer view containing the complete SPZ payload. */
  bufferView: number;
};

/** A normalized reference to one Gaussian splat primitive in a glTF asset. */
export type GLTFGaussianSplatPrimitive = {
  /** Mesh index containing the primitive. */
  meshIndex: number;
  /** Primitive index within the mesh. */
  primitiveIndex: number;
  /** Accessor indices for the standard and KHR splat attributes. */
  attributes: Readonly<Record<string, number>>;
  /** Parsed base-extension declaration. */
  extension: GLTF_KHR_gaussian_splatting;
  /** Optional SPZ2 compressed buffer-view index. */
  compressedBufferView?: number;
  /** Preserved compressed SPZ2 bytes for native or GPU decoders. */
  compressedBytes?: Uint8Array;
  /** Result returned by an injected SPZ2 decoder, when one was supplied. */
  decoded?: unknown;
};
