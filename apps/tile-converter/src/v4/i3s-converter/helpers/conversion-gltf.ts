// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {GLTFScenegraph, getGLTFAccessor, getGLTFAccessorValue} from '@loaders.gl/scene/gltf';
import type {
  GLTFWithBuffers,
  GLTFAccessor,
  GLTFNode,
  GLTFMeshPrimitive,
  GLTFMaterial,
  GLTFTexture,
  GLTFImage
} from '@loaders.gl/scene/gltf';
import type {TypedArray} from '@math.gl/core';

/** Packed geometry passed to the legacy conversion worker, independent of scene JSON. */
export type ConversionAccessor = Omit<GLTFAccessor, 'bufferView' | 'sparse'> & {
  value: TypedArray;
  components: number;
};
/** Selected primitive data consumed by conversion workers. */
export type ConversionPrimitive = Omit<GLTFMeshPrimitive, 'attributes' | 'indices' | 'material'> & {
  attributes: Record<string, ConversionAccessor>;
  indices?: ConversionAccessor;
  material?: ConversionMaterial;
};
/** Selected mesh data consumed by conversion workers. */
export type ConversionMesh = {primitives: ConversionPrimitive[]};
/** Tree of placements passed to a conversion worker. */
export type ConversionNode = Omit<GLTFNode, 'mesh' | 'children'> & {
  mesh?: ConversionMesh;
  children?: ConversionNode[];
};
/** Decoded image and optional encoded storage needed by the I3S writer. */
export type ConversionImage = Omit<GLTFImage, 'bufferView'> & {
  image: any;
  bufferView?: {data: Uint8Array};
};
/** Selected texture data needed by the I3S writer. */
export type ConversionTexture = Omit<GLTFTexture, 'source' | 'sampler'> & {
  source?: ConversionImage;
};
/** Selected material data needed by the I3S writer. */
export type ConversionMaterial = Omit<GLTFMaterial, 'pbrMetallicRoughness' | 'emissiveTexture'> & {
  id: string;
  uniqueId?: string;
  pbrMetallicRoughness?: Omit<
    NonNullable<GLTFMaterial['pbrMetallicRoughness']>,
    'baseColorTexture'
  > & {baseColorTexture?: {texture: ConversionTexture}};
  emissiveTexture?: {texture: ConversionTexture};
};

/** Select decoded accessor data for the conversion worker without linking glTF resources. */
export function getConversionAccessor(
  gltf: GLTFWithBuffers,
  reference: number | GLTFAccessor
): ConversionAccessor {
  const accessor = getGLTFAccessor(gltf, reference);
  const {bufferView, sparse, ...metadata} = accessor;
  const source = getGLTFAccessorValue(gltf, reference);
  // Invoke the intrinsic typed-array copy; Node Buffer.slice() would retain borrowed storage.
  const value = Uint8Array.prototype.slice.call(source) as TypedArray;
  return {
    ...metadata,
    value,
    components: accessor.type === 'SCALAR' ? 1 : Number(accessor.type.slice(3))
  };
}

/** Resolve only the image and texture fields used by the legacy I3S material writer. */
export function getConversionMaterials(gltf: GLTFWithBuffers): ConversionMaterial[] {
  const scenegraph = new GLTFScenegraph(gltf);
  const getTexture = (index: number): ConversionTexture => {
    const texture = gltf.json.textures![index];
    const image = texture.source === undefined ? undefined : gltf.json.images?.[texture.source];
    return {
      ...texture,
      sampler: undefined,
      source: image
        ? {
            ...image,
            image: gltf.images?.[texture.source!],
            bufferView:
              image.bufferView === undefined
                ? undefined
                : {data: scenegraph.getTypedArrayForBufferView(image.bufferView)}
          }
        : undefined
    } as ConversionTexture;
  };
  return (gltf.json.materials || []).map((material, index) => ({
    ...material,
    id: String(index),
    pbrMetallicRoughness: material.pbrMetallicRoughness
      ? {
          ...material.pbrMetallicRoughness,
          baseColorTexture: material.pbrMetallicRoughness.baseColorTexture
            ? {texture: getTexture(material.pbrMetallicRoughness.baseColorTexture.index)}
            : undefined
        }
      : undefined,
    emissiveTexture: material.emissiveTexture
      ? {texture: getTexture(material.emissiveTexture.index)}
      : undefined
  }));
}
