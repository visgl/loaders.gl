// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  GLTF,
  GLTFAccessor,
  GLTFAnimation,
  GLTFAnimationChannel,
  GLTFAnimationChannelTarget,
  GLTFAnimationSampler,
  GLTFBuffer,
  GLTFBufferView,
  GLTFCamera,
  GLTFExternalAsset,
  GLTFFile,
  GLTFImage,
  GLTFMaterial,
  GLTFMaterialNormalTextureInfo,
  GLTFMaterialOcclusionTextureInfo,
  GLTFMesh,
  GLTFMeshPrimitive,
  GLTFNode,
  GLTFSampler,
  GLTFScene,
  GLTFSkin,
  GLTFTexture,
  GLTFTextureInfo
} from '../types/gltf-json-schema';
import type {GLTFWithBuffers} from '../types/gltf-types';
import {
  getTypedArrayForAccessor as getAccessorTypedArray,
  getTypedArrayForBufferView as getBufferViewTypedArray,
  getTypedArrayForImageData as getImageTypedArray
} from '../gltf-utils/get-typed-array';
import {getAccessorTypeFromSize} from '../gltf-utils/gltf-utils';

/** String tag identifying a raw glTF object registered with an iterator. */
export type GLTFIteratorType =
  | 'accessor'
  | 'animation'
  | 'animationChannel'
  | 'animationChannelTarget'
  | 'animationSampler'
  | 'buffer'
  | 'bufferView'
  | 'camera'
  | 'externalAsset'
  | 'file'
  | 'image'
  | 'material'
  | 'mesh'
  | 'primitive'
  | 'node'
  | 'sampler'
  | 'scene'
  | 'skin'
  | 'texture'
  | 'textureInfo';

/** Top-level glTF collection wrapper tags. */
type GLTFCollectionType = Exclude<
  GLTFIteratorType,
  'animationChannel' | 'animationChannelTarget' | 'animationSampler' | 'primitive' | 'textureInfo'
>;

/** Minimum raw object shape required by extension helpers. */
type GLTFIteratorData = {
  extensions?: Record<string, any>;
};

/** Base class for a lightweight view of one raw glTF object. */
abstract class GLTFObjectIterator<DataT extends GLTFIteratorData, TypeT extends GLTFIteratorType> {
  /** Original glTF container. */
  readonly gltf: GLTFWithBuffers;

  /** Stable tag identifying the wrapped object type. */
  readonly type: TypeT;

  /** Index in the object's top-level or parent-local collection. */
  readonly index: number;

  /** Exact unmodified object from the source glTF JSON. */
  readonly data: DataT;

  /** Human-readable path to the raw object. */
  readonly path: string;

  /** Root iterator used to resolve linked indices. */
  protected readonly iterator: GLTFIterator;

  /** Create a lightweight wrapper for a raw glTF object. */
  constructor(iterator: GLTFIterator, type: TypeT, index: number, data: DataT, path: string) {
    this.iterator = iterator;
    this.gltf = iterator.gltf;
    this.type = type;
    this.index = index;
    this.data = data;
    this.path = path;
  }
}

/** Base class for an object stored in a parent-local array or property. */
abstract class GLTFNestedObjectIterator<
  DataT extends GLTFIteratorData,
  TypeT extends GLTFIteratorType,
  ParentT extends GLTFObjectIterator<GLTFIteratorData, GLTFIteratorType>
> extends GLTFObjectIterator<DataT, TypeT> {
  /** Wrapper containing this nested object. */
  readonly parent: ParentT;

  /** Create a wrapper for a parent-local raw glTF object. */
  constructor(
    iterator: GLTFIterator,
    type: TypeT,
    index: number,
    data: DataT,
    path: string,
    parent: ParentT
  ) {
    super(iterator, type, index, data, path);
    this.parent = parent;
  }
}

/** Metadata privately associated with a raw glTF object by an iterator. */
export interface GLTFIteratorMetadata {
  readonly gltf: GLTFWithBuffers;
  readonly type: GLTFIteratorType;
  readonly index: number;
  readonly parent?: GLTFIteratorData;
  readonly path: string;
}

/** Lazily resolved standard relationships for one raw glTF object. */
export type GLTFIteratorReferences = object;

/** References reachable from a texture wrapper. */
export interface GLTFTextureReferences {
  readonly sampler: GLTFSampler | undefined;
  readonly source: GLTFImage | undefined;
}

/** References reachable from a node wrapper. */
export interface GLTFNodeReferences {
  readonly camera: GLTFCamera | undefined;
  readonly children: IterableIterator<GLTFNode>;
  readonly skin: GLTFSkin | undefined;
  readonly mesh: GLTFMesh | undefined;
  readonly externalAsset: GLTFExternalAsset | undefined;
}

/** References reachable from a mesh wrapper. */
export interface GLTFMeshReferences {
  readonly primitives: IterableIterator<GLTFMeshPrimitive>;
}

/** References reachable from a scene wrapper. */
export interface GLTFSceneReferences {
  readonly nodes: IterableIterator<GLTFNode>;
}

/** References reachable from a mesh primitive wrapper. */
export interface GLTFMeshPrimitiveReferences {
  readonly attributes: ReadonlyMap<string, GLTFAccessor>;
  readonly indices: GLTFAccessor | undefined;
  readonly material: GLTFMaterial | undefined;
  readonly targets: ReadonlyArray<ReadonlyMap<string, GLTFAccessor>>;
}

/** References reachable from a texture-info wrapper. */
export interface GLTFTextureInfoReferences {
  readonly texture: GLTFTexture;
}

/** References reachable from a material wrapper. */
export interface GLTFMaterialReferences {
  readonly baseColorTexture: GLTFTextureInfo | undefined;
  readonly metallicRoughnessTexture: GLTFTextureInfo | undefined;
  readonly normalTexture: GLTFMaterialNormalTextureInfo | undefined;
  readonly occlusionTexture: GLTFMaterialOcclusionTextureInfo | undefined;
  readonly emissiveTexture: GLTFTextureInfo | undefined;
  readonly textures: IterableIterator<
    GLTFTextureInfo | GLTFMaterialNormalTextureInfo | GLTFMaterialOcclusionTextureInfo
  >;
}

/** References reachable from an accessor wrapper. */
export interface GLTFAccessorReferences {
  readonly bufferView: GLTFBufferView | undefined;
}

/** References reachable from a buffer-view wrapper. */
export interface GLTFBufferViewReferences {
  readonly buffer: GLTFBuffer;
}

/** References reachable from a file or image wrapper. */
export interface GLTFBufferViewOwnerReferences {
  readonly bufferView: GLTFBufferView | undefined;
}

/** References reachable from an external asset wrapper. */
export interface GLTFExternalAssetReferences {
  readonly file: GLTFFile;
}

/** References reachable from an animation wrapper. */
export interface GLTFAnimationReferences {
  readonly channels: IterableIterator<GLTFAnimationChannel>;
  readonly samplers: IterableIterator<GLTFAnimationSampler>;
}

/** References reachable from an animation channel wrapper. */
export interface GLTFAnimationChannelReferences {
  readonly sampler: GLTFAnimationSampler;
  readonly target: GLTFAnimationChannelTarget;
}

/** References reachable from an animation target wrapper. */
export interface GLTFAnimationChannelTargetReferences {
  readonly node: GLTFNode | undefined;
}

/** References reachable from an animation sampler wrapper. */
export interface GLTFAnimationSamplerReferences {
  readonly input: GLTFAccessor;
  readonly output: GLTFAccessor;
}

/** References reachable from a skin wrapper. */
export interface GLTFSkinReferences {
  readonly inverseBindMatrices: GLTFAccessor | undefined;
  readonly skeleton: GLTFNode | undefined;
  readonly joints: IterableIterator<GLTFNode>;
}

/** Lightweight accessor wrapper. */
class GLTFAccessorIterator extends GLTFObjectIterator<GLTFAccessor, 'accessor'> {
  /** Resolve the accessor's buffer view. */
  get bufferView(): GLTFBufferViewIterator | undefined {
    return this.data.bufferView === undefined
      ? undefined
      : this.iterator.resolveBufferView(this.data.bufferView, `${this.path}.bufferView`);
  }
}

/** Lightweight animation wrapper. */
class GLTFAnimationIterator extends GLTFObjectIterator<GLTFAnimation, 'animation'> {
  /** Iterate animation channels in source order. */
  get channels(): IterableIterator<GLTFAnimationChannelIterator> {
    return iterateValues(this.data.channels, (channel, channelIndex) =>
      this.iterator.getOrCreateNested(
        channel,
        () =>
          new GLTFAnimationChannelIterator(
            this.iterator,
            'animationChannel',
            channelIndex,
            channel,
            `${this.path}.channels[${channelIndex}]`,
            this
          )
      )
    );
  }

  /** Iterate animation samplers in source order. */
  get samplers(): IterableIterator<GLTFAnimationSamplerIterator> {
    return iterateValues(this.data.samplers, (sampler, samplerIndex) =>
      this.iterator.getOrCreateNested(
        sampler,
        () =>
          new GLTFAnimationSamplerIterator(
            this.iterator,
            'animationSampler',
            samplerIndex,
            sampler,
            `${this.path}.samplers[${samplerIndex}]`,
            this
          )
      )
    );
  }
}

/** Lightweight animation channel wrapper. */
class GLTFAnimationChannelIterator extends GLTFNestedObjectIterator<
  GLTFAnimationChannel,
  'animationChannel',
  GLTFAnimationIterator
> {
  /** Resolve the animation-local sampler. */
  get sampler(): GLTFAnimationSamplerIterator {
    const samplers = this.parent.data.samplers;
    const sampler = samplers[this.data.sampler];
    if (!sampler) {
      throw new Error(
        `Invalid glTF reference at ${this.path}.sampler: animation sampler index ${this.data.sampler} is out of range`
      );
    }
    return this.iterator.getOrCreateNested(
      sampler,
      () =>
        new GLTFAnimationSamplerIterator(
          this.iterator,
          'animationSampler',
          this.data.sampler,
          sampler,
          `${this.parent.path}.samplers[${this.data.sampler}]`,
          this.parent
        )
    );
  }

  /** Return the channel target wrapper. */
  get target(): GLTFAnimationChannelTargetIterator {
    return this.iterator.getOrCreateNested(
      this.data.target,
      () =>
        new GLTFAnimationChannelTargetIterator(
          this.iterator,
          'animationChannelTarget',
          0,
          this.data.target,
          `${this.path}.target`,
          this
        )
    );
  }
}

/** Lightweight animation channel target wrapper. */
class GLTFAnimationChannelTargetIterator extends GLTFNestedObjectIterator<
  GLTFAnimationChannelTarget,
  'animationChannelTarget',
  GLTFAnimationChannelIterator
> {
  /** Resolve the target node when one is specified. */
  get node(): GLTFNodeIterator | undefined {
    return this.data.node === undefined
      ? undefined
      : this.iterator.resolveNode(this.data.node, `${this.path}.node`);
  }
}

/** Lightweight animation sampler wrapper. */
class GLTFAnimationSamplerIterator extends GLTFNestedObjectIterator<
  GLTFAnimationSampler,
  'animationSampler',
  GLTFAnimationIterator
> {
  /** Resolve the sampler input accessor. */
  get input(): GLTFAccessorIterator {
    return this.iterator.resolveAccessor(this.data.input, `${this.path}.input`);
  }

  /** Resolve the sampler output accessor. */
  get output(): GLTFAccessorIterator {
    return this.iterator.resolveAccessor(this.data.output, `${this.path}.output`);
  }
}

/** Lightweight buffer wrapper. */
class GLTFBufferIterator extends GLTFObjectIterator<GLTFBuffer, 'buffer'> {
  /** Return the loaded byte range parallel to this JSON buffer, when available. */
  get loadedBuffer(): GLTFWithBuffers['buffers'][number] | undefined {
    return this.gltf.buffers[this.index];
  }
}

/** Lightweight buffer-view wrapper. */
class GLTFBufferViewIterator extends GLTFObjectIterator<GLTFBufferView, 'bufferView'> {
  /** Resolve the backing JSON buffer. */
  get buffer(): GLTFBufferIterator {
    return this.iterator.resolveBuffer(this.data.buffer, `${this.path}.buffer`);
  }

  /** Return a byte view over the loaded buffer-view range. */
  get loadedBufferView(): Uint8Array | undefined {
    const loadedBuffer = this.buffer.loadedBuffer;
    if (!loadedBuffer) {
      return undefined;
    }
    const byteOffset = loadedBuffer.byteOffset + (this.data.byteOffset || 0);
    return new Uint8Array(loadedBuffer.arrayBuffer, byteOffset, this.data.byteLength);
  }
}

/** Lightweight camera wrapper. */
class GLTFCameraIterator extends GLTFObjectIterator<GLTFCamera, 'camera'> {}

/** Lightweight external-asset wrapper for draft glTF 2.1. */
class GLTFExternalAssetIterator extends GLTFObjectIterator<GLTFExternalAsset, 'externalAsset'> {
  /** Resolve the file containing the external glTF asset. */
  get file(): GLTFFileIterator {
    return this.iterator.resolveFile(this.data.file, `${this.path}.file`);
  }

  /** Return the parsed external glTF loaded parallel to this definition. */
  get loadedAsset(): GLTFWithBuffers | null | undefined {
    return this.gltf.externalAssets?.[this.index];
  }
}

/** Lightweight file wrapper for draft glTF 2.1. */
class GLTFFileIterator extends GLTFObjectIterator<GLTFFile, 'file'> {
  /** Resolve the optional buffer view containing this file. */
  get bufferView(): GLTFBufferViewIterator | undefined {
    return this.data.bufferView === undefined
      ? undefined
      : this.iterator.resolveBufferView(this.data.bufferView, `${this.path}.bufferView`);
  }

  /** Return the resolved file loaded parallel to this definition. */
  get loadedFile(): NonNullable<GLTFWithBuffers['files']>[number] | undefined {
    return this.gltf.files?.[this.index];
  }
}

/** Lightweight image wrapper. */
class GLTFImageIterator extends GLTFObjectIterator<GLTFImage, 'image'> {
  /** Resolve the optional buffer view containing this image. */
  get bufferView(): GLTFBufferViewIterator | undefined {
    return this.data.bufferView === undefined
      ? undefined
      : this.iterator.resolveBufferView(this.data.bufferView, `${this.path}.bufferView`);
  }

  /** Return the decoded image loaded parallel to this definition. */
  get loadedImage(): NonNullable<GLTFWithBuffers['images']>[number] | undefined {
    return this.gltf.images?.[this.index];
  }
}

/** Lightweight material wrapper. */
class GLTFMaterialIterator extends GLTFObjectIterator<GLTFMaterial, 'material'> {
  /** Resolve the base-color texture info. */
  get baseColorTexture(): GLTFTextureInfoIterator | undefined {
    return this.getTextureInfo(
      this.data.pbrMetallicRoughness?.baseColorTexture,
      0,
      'pbrMetallicRoughness.baseColorTexture'
    );
  }

  /** Resolve the metallic-roughness texture info. */
  get metallicRoughnessTexture(): GLTFTextureInfoIterator | undefined {
    return this.getTextureInfo(
      this.data.pbrMetallicRoughness?.metallicRoughnessTexture,
      1,
      'pbrMetallicRoughness.metallicRoughnessTexture'
    );
  }

  /** Resolve the normal texture info. */
  get normalTexture(): GLTFTextureInfoIterator | undefined {
    return this.getTextureInfo(this.data.normalTexture, 2, 'normalTexture');
  }

  /** Resolve the occlusion texture info. */
  get occlusionTexture(): GLTFTextureInfoIterator | undefined {
    return this.getTextureInfo(this.data.occlusionTexture, 3, 'occlusionTexture');
  }

  /** Resolve the emissive texture info. */
  get emissiveTexture(): GLTFTextureInfoIterator | undefined {
    return this.getTextureInfo(this.data.emissiveTexture, 4, 'emissiveTexture');
  }

  /** Resolve standard texture-info properties in their schema order. */
  get textures(): IterableIterator<GLTFTextureInfoIterator> {
    const textureInfos = [
      this.baseColorTexture,
      this.metallicRoughnessTexture,
      this.normalTexture,
      this.occlusionTexture,
      this.emissiveTexture
    ].filter((textureInfo): textureInfo is GLTFTextureInfoIterator => Boolean(textureInfo));
    return textureInfos.values();
  }

  /** Wrap one optional standard material texture-info property. */
  private getTextureInfo(
    textureInfo:
      | GLTFTextureInfo
      | GLTFMaterialNormalTextureInfo
      | GLTFMaterialOcclusionTextureInfo
      | undefined,
    index: number,
    propertyPath: string
  ): GLTFTextureInfoIterator | undefined {
    return textureInfo
      ? this.iterator.getOrCreateNested(
          textureInfo,
          () =>
            new GLTFTextureInfoIterator(
              this.iterator,
              'textureInfo',
              index,
              textureInfo,
              `${this.path}.${propertyPath}`,
              this
            )
        )
      : undefined;
  }
}

/** Lightweight texture-info wrapper nested in a material. */
class GLTFTextureInfoIterator extends GLTFNestedObjectIterator<
  GLTFTextureInfo | GLTFMaterialNormalTextureInfo | GLTFMaterialOcclusionTextureInfo,
  'textureInfo',
  GLTFMaterialIterator
> {
  /** Resolve the texture referenced by the raw texture-info `index` field. */
  get texture(): GLTFTextureIterator {
    return this.iterator.resolveTexture(this.data.index, `${this.path}.index`);
  }
}

/** Lightweight mesh wrapper. */
class GLTFMeshIterator extends GLTFObjectIterator<GLTFMesh, 'mesh'> {
  /** Iterate mesh primitives in source order. */
  get primitives(): IterableIterator<GLTFMeshPrimitiveIterator> {
    return iterateValues(this.data.primitives, (primitive, primitiveIndex) =>
      this.iterator.getOrCreateNested(
        primitive,
        () =>
          new GLTFMeshPrimitiveIterator(
            this.iterator,
            'primitive',
            primitiveIndex,
            primitive,
            `${this.path}.primitives[${primitiveIndex}]`,
            this
          )
      )
    );
  }
}

/** Lightweight mesh primitive wrapper. */
class GLTFMeshPrimitiveIterator extends GLTFNestedObjectIterator<
  GLTFMeshPrimitive,
  'primitive',
  GLTFMeshIterator
> {
  /** Resolve every vertex attribute accessor by semantic name. */
  get attributes(): ReadonlyMap<string, GLTFAccessorIterator> {
    return new Map(
      Object.entries(this.data.attributes).map(([attributeName, accessorIndex]) => [
        attributeName,
        this.iterator.resolveAccessor(accessorIndex, `${this.path}.attributes.${attributeName}`)
      ])
    );
  }

  /** Resolve the optional index accessor. */
  get indices(): GLTFAccessorIterator | undefined {
    return this.data.indices === undefined
      ? undefined
      : this.iterator.resolveAccessor(this.data.indices, `${this.path}.indices`);
  }

  /** Resolve the optional material. */
  get material(): GLTFMaterialIterator | undefined {
    return this.data.material === undefined
      ? undefined
      : this.iterator.resolveMaterial(this.data.material, `${this.path}.material`);
  }

  /** Resolve morph-target attribute accessors without rewriting target dictionaries. */
  get targets(): ReadonlyArray<ReadonlyMap<string, GLTFAccessorIterator>> {
    return (this.data.targets || []).map(
      (target, targetIndex) =>
        new Map(
          Object.entries(target).map(([attributeName, accessorIndex]) => [
            attributeName,
            this.iterator.resolveAccessor(
              accessorIndex,
              `${this.path}.targets[${targetIndex}].${attributeName}`
            )
          ])
        )
    );
  }
}

/** Lightweight node wrapper. */
class GLTFNodeIterator extends GLTFObjectIterator<GLTFNode, 'node'> {
  /** Resolve the optional camera. */
  get camera(): GLTFCameraIterator | undefined {
    return this.data.camera === undefined
      ? undefined
      : this.iterator.resolveCamera(this.data.camera, `${this.path}.camera`);
  }

  /** Iterate resolved child nodes in source order. */
  get children(): IterableIterator<GLTFNodeIterator> {
    return iterateValues(this.data.children || [], (childNodeIndex, childIndex) =>
      this.iterator.resolveNode(childNodeIndex, `${this.path}.children[${childIndex}]`)
    );
  }

  /** Resolve the optional skin. */
  get skin(): GLTFSkinIterator | undefined {
    return this.data.skin === undefined
      ? undefined
      : this.iterator.resolveSkin(this.data.skin, `${this.path}.skin`);
  }

  /** Resolve the optional mesh definition. */
  get mesh(): GLTFMeshIterator | undefined {
    return this.data.mesh === undefined
      ? undefined
      : this.iterator.resolveMesh(this.data.mesh, `${this.path}.mesh`);
  }

  /** Resolve the optional draft glTF 2.1 external asset. */
  get externalAsset(): GLTFExternalAssetIterator | undefined {
    return this.data.externalAsset === undefined
      ? undefined
      : this.iterator.resolveExternalAsset(this.data.externalAsset, `${this.path}.externalAsset`);
  }
}

/** Lightweight texture sampler wrapper. */
class GLTFSamplerIterator extends GLTFObjectIterator<GLTFSampler, 'sampler'> {}

/** Lightweight scene wrapper. */
class GLTFSceneIterator extends GLTFObjectIterator<GLTFScene, 'scene'> {
  /** Iterate resolved scene root nodes in source order. */
  get nodes(): IterableIterator<GLTFNodeIterator> {
    return iterateValues(this.data.nodes || [], (nodeIndex, sceneNodeIndex) =>
      this.iterator.resolveNode(nodeIndex, `${this.path}.nodes[${sceneNodeIndex}]`)
    );
  }
}

/** Lightweight skin wrapper. */
class GLTFSkinIterator extends GLTFObjectIterator<GLTFSkin, 'skin'> {
  /** Resolve the optional inverse-bind-matrix accessor. */
  get inverseBindMatrices(): GLTFAccessorIterator | undefined {
    return this.data.inverseBindMatrices === undefined
      ? undefined
      : this.iterator.resolveAccessor(
          this.data.inverseBindMatrices,
          `${this.path}.inverseBindMatrices`
        );
  }

  /** Resolve the optional skeleton root node. */
  get skeleton(): GLTFNodeIterator | undefined {
    return this.data.skeleton === undefined
      ? undefined
      : this.iterator.resolveNode(this.data.skeleton, `${this.path}.skeleton`);
  }

  /** Iterate resolved joint nodes in source order. */
  get joints(): IterableIterator<GLTFNodeIterator> {
    return iterateValues(this.data.joints, (jointNodeIndex, jointIndex) =>
      this.iterator.resolveNode(jointNodeIndex, `${this.path}.joints[${jointIndex}]`)
    );
  }
}

/** Lightweight texture wrapper. */
class GLTFTextureIterator extends GLTFObjectIterator<GLTFTexture, 'texture'> {
  /** Resolve the optional sampler. */
  get sampler(): GLTFSamplerIterator | undefined {
    return this.data.sampler === undefined
      ? undefined
      : this.iterator.resolveSampler(this.data.sampler, `${this.path}.sampler`);
  }

  /** Resolve the optional source image. */
  get source(): GLTFImageIterator | undefined {
    return this.data.source === undefined
      ? undefined
      : this.iterator.resolveImage(this.data.source, `${this.path}.source`);
  }
}

/**
 * Traverse and transform raw glTF data through lazy, identity-preserving object wrappers.
 *
 * The iterator never clones, links, normalizes, or otherwise postprocesses its input. Wrapper
 * `data` fields are the original mutable JSON objects so extension handlers can transform them in
 * place while using typed reference getters for navigation.
 */
export class GLTFIterator {
  /** Original glTF container traversed by this iterator. */
  readonly gltf: GLTFWithBuffers;

  /** Cached wrapper for each raw source object. */
  private readonly objectCache = new WeakMap<object, GLTFObjectIterator<any, any>>();

  /** Cached lazy reference facades keyed by their source wrapper. */
  private readonly referencesCache = new WeakMap<object, GLTFIteratorReferences>();

  /** Create an iterator over an existing parsed glTF container. */
  constructor(gltf: GLTFWithBuffers) {
    this.gltf = gltf;
  }

  /** Exact unmodified glTF JSON root. */
  get data(): GLTF {
    return this.gltf.json;
  }

  /** Return the loaded bytes addressed by a raw bufferView index. */
  getTypedArrayForBufferView(bufferViewIndex: number): Uint8Array {
    return getBufferViewTypedArray(this.data, this.gltf.buffers, bufferViewIndex);
  }

  /** Return the loaded typed values addressed by a raw accessor index. */
  getTypedArrayForAccessor(accessorIndex: number): unknown {
    return getAccessorTypedArray(this.data, this.gltf.buffers, accessorIndex);
  }

  /** Return the loaded bytes addressed by a raw image index. */
  getTypedArrayForImageData(imageIndex: number): Uint8Array {
    return getImageTypedArray(this.data, this.gltf.buffers, imageIndex);
  }

  /** Return the loaded buffer companion for a raw buffer definition. */
  getLoadedBuffer(buffer: GLTFBuffer): GLTFWithBuffers['buffers'][number] | undefined {
    const metadata = this.getMetadata(buffer);
    return this.gltf.buffers[metadata.index];
  }

  /** Return the loaded byte range for a raw buffer-view definition. */
  getLoadedBufferView(bufferView: GLTFBufferView): Uint8Array | undefined {
    const buffer = this.getReferences(bufferView).buffer;
    const loadedBuffer = this.getLoadedBuffer(buffer);
    if (!loadedBuffer) {
      return undefined;
    }
    const byteOffset = loadedBuffer.byteOffset + (bufferView.byteOffset || 0);
    return new Uint8Array(loadedBuffer.arrayBuffer, byteOffset, bufferView.byteLength);
  }

  /** Return the loaded image companion for a raw image definition. */
  getLoadedImage(image: GLTFImage): NonNullable<GLTFWithBuffers['images']>[number] | undefined {
    return this.gltf.images?.[this.getMetadata(image).index];
  }

  /** Return the loaded file companion for a raw file definition. */
  getLoadedFile(file: GLTFFile): NonNullable<GLTFWithBuffers['files']>[number] | undefined {
    return this.gltf.files?.[this.getMetadata(file).index];
  }

  /** Return the loaded asset companion for a raw external-asset definition. */
  getLoadedExternalAsset(externalAsset: GLTFExternalAsset): GLTFWithBuffers | null | undefined {
    return this.gltf.externalAssets?.[this.getMetadata(externalAsset).index];
  }

  /** Append loaded bytes and a raw buffer definition, returning the new buffer index. */
  addBuffer(array: ArrayBufferView): number {
    const arrayBuffer = array.buffer.slice(
      array.byteOffset,
      array.byteOffset + array.byteLength
    ) as ArrayBuffer;
    this.gltf.buffers.push({arrayBuffer, byteOffset: 0, byteLength: array.byteLength});
    this.data.buffers ||= [];
    this.data.buffers.push({byteLength: array.byteLength});
    return this.data.buffers.length - 1;
  }

  /** Append a raw bufferView definition and return its index. */
  addBufferView(bufferIndex: number, byteLength: number, byteOffset = 0): number {
    this.data.bufferViews ||= [];
    this.data.bufferViews.push({buffer: bufferIndex, byteOffset, byteLength});
    return this.data.bufferViews.length - 1;
  }

  /** Append a raw accessor definition and return its index. */
  addAccessor(
    bufferViewIndex: number,
    accessor: {
      size: number;
      componentType: number;
      count: number;
      min?: number[];
      max?: number[];
    }
  ): number {
    this.data.accessors ||= [];
    this.data.accessors.push({
      bufferView: bufferViewIndex,
      type: getAccessorTypeFromSize(accessor.size),
      componentType: accessor.componentType,
      count: accessor.count,
      min: accessor.min,
      max: accessor.max
    });
    return this.data.accessors.length - 1;
  }

  /** Return lazily resolved standard relationships for a raw glTF object. */
  getReferences(object: GLTFAccessor): GLTFAccessorReferences;
  getReferences(object: GLTFAnimation): GLTFAnimationReferences;
  getReferences(object: GLTFAnimationChannel): GLTFAnimationChannelReferences;
  getReferences(object: GLTFAnimationChannelTarget): GLTFAnimationChannelTargetReferences;
  getReferences(object: GLTFAnimationSampler): GLTFAnimationSamplerReferences;
  getReferences(object: GLTFBufferView): GLTFBufferViewReferences;
  getReferences(object: GLTFExternalAsset): GLTFExternalAssetReferences;
  getReferences(object: GLTFFile): GLTFBufferViewOwnerReferences;
  getReferences(object: GLTFImage): GLTFBufferViewOwnerReferences;
  getReferences(object: GLTFMaterial): GLTFMaterialReferences;
  getReferences(object: GLTFTextureInfo): GLTFTextureInfoReferences;
  getReferences(object: GLTFMesh): GLTFMeshReferences;
  getReferences(object: GLTFMeshPrimitive): GLTFMeshPrimitiveReferences;
  getReferences(object: GLTFNode): GLTFNodeReferences;
  getReferences(object: GLTFScene): GLTFSceneReferences;
  getReferences(object: GLTFSkin): GLTFSkinReferences;
  getReferences(object: GLTFTexture): GLTFTextureReferences;
  getReferences(object: GLTFIteratorData): GLTFIteratorReferences {
    const cachedReferences = this.referencesCache.get(object);
    if (cachedReferences) {
      return cachedReferences;
    }
    const objectIterator = this.getObjectIterator(object);
    const references = createReferences(objectIterator);
    this.referencesCache.set(object, references);
    return references;
  }

  /** Return iterator-owned metadata for a raw glTF object. */
  getMetadata(object: GLTFIteratorData): GLTFIteratorMetadata {
    const objectIterator = this.getObjectIterator(object);
    const parent =
      objectIterator instanceof GLTFNestedObjectIterator ? objectIterator.parent.data : undefined;
    return {
      gltf: this.gltf,
      type: objectIterator.type,
      index: objectIterator.index,
      parent,
      path: objectIterator.path
    };
  }

  /** Resolve the default scene. */
  get scene(): GLTFScene | undefined {
    return this.data.scene === undefined
      ? undefined
      : this.resolveScene(this.data.scene, 'scene').data;
  }

  /** Resolve the optional draft glTF 2.1 thumbnail image. */
  get thumbnail(): GLTFImage | undefined {
    return this.data.asset.thumbnail === undefined
      ? undefined
      : this.resolveImage(this.data.asset.thumbnail, 'asset.thumbnail').data;
  }

  /** Iterate raw accessors in source order. */
  get accessors(): IterableIterator<GLTFAccessor> {
    return this.iterateCollectionData('accessor') as IterableIterator<GLTFAccessor>;
  }

  /** Iterate raw animations in source order. */
  get animations(): IterableIterator<GLTFAnimation> {
    return this.iterateCollectionData('animation') as IterableIterator<GLTFAnimation>;
  }

  /** Iterate raw buffers in source order. */
  get buffers(): IterableIterator<GLTFBuffer> {
    return this.iterateCollectionData('buffer') as IterableIterator<GLTFBuffer>;
  }

  /** Iterate raw buffer views in source order. */
  get bufferViews(): IterableIterator<GLTFBufferView> {
    return this.iterateCollectionData('bufferView') as IterableIterator<GLTFBufferView>;
  }

  /** Iterate raw cameras in source order. */
  get cameras(): IterableIterator<GLTFCamera> {
    return this.iterateCollectionData('camera') as IterableIterator<GLTFCamera>;
  }

  /** Iterate raw draft glTF 2.1 external assets in source order. */
  get externalAssets(): IterableIterator<GLTFExternalAsset> {
    return this.iterateCollectionData('externalAsset') as IterableIterator<GLTFExternalAsset>;
  }

  /** Iterate raw draft glTF 2.1 files in source order. */
  get files(): IterableIterator<GLTFFile> {
    return this.iterateCollectionData('file') as IterableIterator<GLTFFile>;
  }

  /** Iterate raw images in source order. */
  get images(): IterableIterator<GLTFImage> {
    return this.iterateCollectionData('image') as IterableIterator<GLTFImage>;
  }

  /** Iterate raw materials in source order. */
  get materials(): IterableIterator<GLTFMaterial> {
    return this.iterateCollectionData('material') as IterableIterator<GLTFMaterial>;
  }

  /** Iterate raw mesh definitions in source order. */
  get meshes(): IterableIterator<GLTFMesh> {
    return this.iterateCollectionData('mesh') as IterableIterator<GLTFMesh>;
  }

  /** Iterate raw nodes in source order. */
  get nodes(): IterableIterator<GLTFNode> {
    return this.iterateCollectionData('node') as IterableIterator<GLTFNode>;
  }

  /** Iterate raw texture samplers in source order. */
  get samplers(): IterableIterator<GLTFSampler> {
    return this.iterateCollectionData('sampler') as IterableIterator<GLTFSampler>;
  }

  /** Iterate raw scenes in source order. */
  get scenes(): IterableIterator<GLTFScene> {
    return this.iterateCollectionData('scene') as IterableIterator<GLTFScene>;
  }

  /** Iterate raw skins in source order. */
  get skins(): IterableIterator<GLTFSkin> {
    return this.iterateCollectionData('skin') as IterableIterator<GLTFSkin>;
  }

  /** Iterate raw textures in source order. */
  get textures(): IterableIterator<GLTFTexture> {
    return this.iterateCollectionData('texture') as IterableIterator<GLTFTexture>;
  }

  /** Return whether an extension is declared used or required. */
  hasExtension(extensionName: string): boolean {
    return (
      Boolean(this.data.extensionsUsed?.includes(extensionName)) ||
      Boolean(this.data.extensionsRequired?.includes(extensionName))
    );
  }

  /** Return whether an extension is declared required. */
  isExtensionRequired(extensionName: string): boolean {
    return Boolean(this.data.extensionsRequired?.includes(extensionName));
  }

  /** Return an extension payload from the root or a wrapped raw object without modifying it. */
  getExtension<ExtensionT = unknown>(extensionName: string): ExtensionT | undefined;
  getExtension<ExtensionT = unknown>(
    object: GLTFIteratorData,
    extensionName: string
  ): ExtensionT | undefined;
  getExtension<ExtensionT = unknown>(
    objectOrExtensionName: GLTFIteratorData | string,
    objectExtensionName?: string
  ): ExtensionT | undefined {
    const data = typeof objectOrExtensionName === 'string' ? this.data : objectOrExtensionName;
    const extensionName =
      typeof objectOrExtensionName === 'string' ? objectOrExtensionName : objectExtensionName!;
    return data.extensions?.[extensionName] as ExtensionT | undefined;
  }

  /** Set an extension payload on the root or a wrapped raw object and register it as used. */
  setExtension<ExtensionT>(extensionName: string, extension: ExtensionT, required?: boolean): void;
  setExtension<ExtensionT>(
    object: GLTFIteratorData,
    extensionName: string,
    extension: ExtensionT
  ): void;
  setExtension<ExtensionT>(
    objectOrExtensionName: GLTFIteratorData | string,
    extensionNameOrExtension: string | ExtensionT,
    extensionOrRequired?: ExtensionT | boolean
  ): void {
    const isRootExtension = typeof objectOrExtensionName === 'string';
    const data = isRootExtension ? this.data : objectOrExtensionName;
    const extensionName = isRootExtension
      ? objectOrExtensionName
      : (extensionNameOrExtension as string);
    const extension = isRootExtension
      ? (extensionNameOrExtension as ExtensionT)
      : (extensionOrRequired as ExtensionT);
    const required = isRootExtension ? Boolean(extensionOrRequired) : false;
    data.extensions ||= {};
    data.extensions[extensionName] = extension;
    this.registerUsedExtension(extensionName);
    if (required) {
      this.registerRequiredExtension(extensionName);
    }
  }

  /** Register an extension in `extensionsUsed`. */
  registerUsedExtension(extensionName: string): void {
    this.data.extensionsUsed ||= [];
    if (!this.data.extensionsUsed.includes(extensionName)) {
      this.data.extensionsUsed.push(extensionName);
    }
  }

  /** Register an extension in both `extensionsUsed` and `extensionsRequired`. */
  registerRequiredExtension(extensionName: string): void {
    this.registerUsedExtension(extensionName);
    this.data.extensionsRequired ||= [];
    if (!this.data.extensionsRequired.includes(extensionName)) {
      this.data.extensionsRequired.push(extensionName);
    }
  }

  /** Remove extension data from the root or a wrapped raw object. */
  removeExtension(extensionName: string): void;
  removeExtension(object: GLTFIteratorData, extensionName: string): void;
  removeExtension(
    objectOrExtensionName: GLTFIteratorData | string,
    objectExtensionName?: string
  ): void {
    const isRootExtension = typeof objectOrExtensionName === 'string';
    const data = isRootExtension ? this.data : objectOrExtensionName;
    const extensionName = isRootExtension ? objectOrExtensionName : objectExtensionName!;
    if (data.extensions?.[extensionName] !== undefined) {
      this.recordRemovedExtension(extensionName);
      delete data.extensions[extensionName];
    }
    if (isRootExtension) {
      removeString(this.data.extensionsUsed, extensionName);
      removeString(this.data.extensionsRequired, extensionName);
    }
  }

  /** Record that an extension payload was consumed by a transformation. */
  recordRemovedExtension(extensionName: string): void {
    const json = this.data as GLTF & {extensionsRemoved?: string[]};
    json.extensionsRemoved ||= [];
    if (!json.extensionsRemoved.includes(extensionName)) {
      json.extensionsRemoved.push(extensionName);
    }
  }

  /** Resolve an accessor reference. */
  resolveAccessor(index: number, sourcePath: string): GLTFAccessorIterator {
    return this.resolveCollectionObject('accessor', index, sourcePath) as GLTFAccessorIterator;
  }

  /** Resolve a buffer reference. */
  resolveBuffer(index: number, sourcePath: string): GLTFBufferIterator {
    return this.resolveCollectionObject('buffer', index, sourcePath) as GLTFBufferIterator;
  }

  /** Resolve a buffer-view reference. */
  resolveBufferView(index: number, sourcePath: string): GLTFBufferViewIterator {
    return this.resolveCollectionObject('bufferView', index, sourcePath) as GLTFBufferViewIterator;
  }

  /** Resolve a camera reference. */
  resolveCamera(index: number, sourcePath: string): GLTFCameraIterator {
    return this.resolveCollectionObject('camera', index, sourcePath) as GLTFCameraIterator;
  }

  /** Resolve a draft external-asset reference. */
  resolveExternalAsset(index: number, sourcePath: string): GLTFExternalAssetIterator {
    return this.resolveCollectionObject(
      'externalAsset',
      index,
      sourcePath
    ) as GLTFExternalAssetIterator;
  }

  /** Resolve a draft file reference. */
  resolveFile(index: number, sourcePath: string): GLTFFileIterator {
    return this.resolveCollectionObject('file', index, sourcePath) as GLTFFileIterator;
  }

  /** Resolve an image reference. */
  resolveImage(index: number, sourcePath: string): GLTFImageIterator {
    return this.resolveCollectionObject('image', index, sourcePath) as GLTFImageIterator;
  }

  /** Resolve a material reference. */
  resolveMaterial(index: number, sourcePath: string): GLTFMaterialIterator {
    return this.resolveCollectionObject('material', index, sourcePath) as GLTFMaterialIterator;
  }

  /** Resolve a mesh reference. */
  resolveMesh(index: number, sourcePath: string): GLTFMeshIterator {
    return this.resolveCollectionObject('mesh', index, sourcePath) as GLTFMeshIterator;
  }

  /** Resolve a node reference. */
  resolveNode(index: number, sourcePath: string): GLTFNodeIterator {
    return this.resolveCollectionObject('node', index, sourcePath) as GLTFNodeIterator;
  }

  /** Resolve a sampler reference. */
  resolveSampler(index: number, sourcePath: string): GLTFSamplerIterator {
    return this.resolveCollectionObject('sampler', index, sourcePath) as GLTFSamplerIterator;
  }

  /** Resolve a scene reference. */
  resolveScene(index: number, sourcePath: string): GLTFSceneIterator {
    return this.resolveCollectionObject('scene', index, sourcePath) as GLTFSceneIterator;
  }

  /** Resolve a skin reference. */
  resolveSkin(index: number, sourcePath: string): GLTFSkinIterator {
    return this.resolveCollectionObject('skin', index, sourcePath) as GLTFSkinIterator;
  }

  /** Resolve a texture reference. */
  resolveTexture(index: number, sourcePath: string): GLTFTextureIterator {
    return this.resolveCollectionObject('texture', index, sourcePath) as GLTFTextureIterator;
  }

  /** Return a cached nested wrapper or create it once. */
  getOrCreateNested<IteratorT extends GLTFObjectIterator<any, any>>(
    data: object,
    createIterator: () => IteratorT
  ): IteratorT {
    return this.getOrCreate(data, createIterator);
  }

  /** Iterate one top-level glTF collection lazily. */
  private iterateCollection(
    type: GLTFCollectionType
  ): IterableIterator<GLTFObjectIterator<any, any>> {
    const values = this.getCollection(type);
    return iterateValues(values, (_, index) => this.resolveCollectionObject(type, index, type));
  }

  /** Iterate exact raw objects from one top-level glTF collection. */
  private iterateCollectionData(type: GLTFCollectionType): IterableIterator<GLTFIteratorData> {
    return (function* iterateRawObjects(
      iterator: GLTFIterator
    ): IterableIterator<GLTFIteratorData> {
      for (const objectIterator of iterator.iterateCollection(type)) {
        yield objectIterator.data;
      }
    })(this);
  }

  /** Return the registered internal context for a raw glTF object. */
  private getObjectIterator(object: GLTFIteratorData): GLTFObjectIterator<any, any> {
    const objectIterator = this.objectCache.get(object);
    if (!objectIterator) {
      throw new Error('glTF object is not registered with this iterator');
    }
    return objectIterator;
  }

  /** Resolve and cache one top-level collection object. */
  private resolveCollectionObject(
    type: GLTFCollectionType,
    index: number,
    sourcePath: string
  ): GLTFObjectIterator<any, any> {
    const values = this.getCollection(type);
    const data = values[index] as GLTFIteratorData | undefined;
    if (!data) {
      throw new Error(
        `Invalid glTF reference at ${sourcePath}: ${type} index ${index} is out of range`
      );
    }
    return this.getOrCreate(data, () => this.createCollectionObject(type, index, data));
  }

  /** Return the raw array corresponding to a top-level wrapper type. */
  private getCollection(type: GLTFCollectionType): GLTFIteratorData[] {
    switch (type) {
      case 'accessor':
        return this.data.accessors || [];
      case 'animation':
        return this.data.animations || [];
      case 'buffer':
        return this.data.buffers || [];
      case 'bufferView':
        return this.data.bufferViews || [];
      case 'camera':
        return this.data.cameras || [];
      case 'externalAsset':
        return this.data.externalAssets || [];
      case 'file':
        return this.data.files || [];
      case 'image':
        return this.data.images || [];
      case 'material':
        return this.data.materials || [];
      case 'mesh':
        return this.data.meshes || [];
      case 'node':
        return this.data.nodes || [];
      case 'sampler':
        return this.data.samplers || [];
      case 'scene':
        return this.data.scenes || [];
      case 'skin':
        return this.data.skins || [];
      case 'texture':
        return this.data.textures || [];
    }
  }

  /** Create one correctly typed top-level wrapper. */
  private createCollectionObject(
    type: GLTFCollectionType,
    index: number,
    data: GLTFIteratorData
  ): GLTFObjectIterator<any, any> {
    const path = `${getCollectionName(type)}[${index}]`;
    switch (type) {
      case 'accessor':
        return new GLTFAccessorIterator(this, type, index, data as GLTFAccessor, path);
      case 'animation':
        return new GLTFAnimationIterator(this, type, index, data as GLTFAnimation, path);
      case 'buffer':
        return new GLTFBufferIterator(this, type, index, data as GLTFBuffer, path);
      case 'bufferView':
        return new GLTFBufferViewIterator(this, type, index, data as GLTFBufferView, path);
      case 'camera':
        return new GLTFCameraIterator(this, type, index, data as GLTFCamera, path);
      case 'externalAsset':
        return new GLTFExternalAssetIterator(this, type, index, data as GLTFExternalAsset, path);
      case 'file':
        return new GLTFFileIterator(this, type, index, data as GLTFFile, path);
      case 'image':
        return new GLTFImageIterator(this, type, index, data as GLTFImage, path);
      case 'material':
        return new GLTFMaterialIterator(this, type, index, data as GLTFMaterial, path);
      case 'mesh':
        return new GLTFMeshIterator(this, type, index, data as GLTFMesh, path);
      case 'node':
        return new GLTFNodeIterator(this, type, index, data as GLTFNode, path);
      case 'sampler':
        return new GLTFSamplerIterator(this, type, index, data as GLTFSampler, path);
      case 'scene':
        return new GLTFSceneIterator(this, type, index, data as GLTFScene, path);
      case 'skin':
        return new GLTFSkinIterator(this, type, index, data as GLTFSkin, path);
      case 'texture':
        return new GLTFTextureIterator(this, type, index, data as GLTFTexture, path);
    }
  }

  /** Reuse a wrapper for the same raw source object. */
  private getOrCreate<IteratorT extends GLTFObjectIterator<any, any>>(
    data: object,
    createIterator: () => IteratorT
  ): IteratorT {
    const cachedIterator = this.objectCache.get(data);
    if (cachedIterator) {
      return cachedIterator as IteratorT;
    }
    const iterator = createIterator();
    this.objectCache.set(data, iterator);
    return iterator;
  }
}

/** Build a lazy relationship facade without resolving any links during construction. */
function createReferences(object: GLTFObjectIterator<any, any>): GLTFIteratorReferences {
  switch (object.type) {
    case 'accessor':
      return {
        get bufferView() {
          return (object as GLTFAccessorIterator).bufferView?.data;
        }
      };
    case 'animation':
      return {
        get channels() {
          return iterateObjectData((object as GLTFAnimationIterator).channels);
        },
        get samplers() {
          return iterateObjectData((object as GLTFAnimationIterator).samplers);
        }
      };
    case 'animationChannel':
      return {
        get sampler() {
          return (object as GLTFAnimationChannelIterator).sampler.data;
        },
        get target() {
          return (object as GLTFAnimationChannelIterator).target.data;
        }
      };
    case 'animationChannelTarget':
      return {
        get node() {
          return (object as GLTFAnimationChannelTargetIterator).node?.data;
        }
      };
    case 'animationSampler':
      return {
        get input() {
          return (object as GLTFAnimationSamplerIterator).input.data;
        },
        get output() {
          return (object as GLTFAnimationSamplerIterator).output.data;
        }
      };
    case 'bufferView':
      return {
        get buffer() {
          return (object as GLTFBufferViewIterator).buffer.data;
        }
      };
    case 'externalAsset':
      return {
        get file() {
          return (object as GLTFExternalAssetIterator).file.data;
        }
      };
    case 'file':
    case 'image':
      return {
        get bufferView() {
          return (object as GLTFFileIterator | GLTFImageIterator).bufferView?.data;
        }
      };
    case 'material':
      return {
        get baseColorTexture() {
          return (object as GLTFMaterialIterator).baseColorTexture?.data;
        },
        get metallicRoughnessTexture() {
          return (object as GLTFMaterialIterator).metallicRoughnessTexture?.data;
        },
        get normalTexture() {
          return (object as GLTFMaterialIterator).normalTexture?.data;
        },
        get occlusionTexture() {
          return (object as GLTFMaterialIterator).occlusionTexture?.data;
        },
        get emissiveTexture() {
          return (object as GLTFMaterialIterator).emissiveTexture?.data;
        },
        get textures() {
          return iterateObjectData((object as GLTFMaterialIterator).textures);
        }
      };
    case 'textureInfo':
      return {
        get texture() {
          return (object as GLTFTextureInfoIterator).texture.data;
        }
      };
    case 'mesh':
      return {
        get primitives() {
          return iterateObjectData((object as GLTFMeshIterator).primitives);
        }
      };
    case 'primitive':
      return {
        get attributes() {
          return mapObjectData((object as GLTFMeshPrimitiveIterator).attributes);
        },
        get indices() {
          return (object as GLTFMeshPrimitiveIterator).indices?.data;
        },
        get material() {
          return (object as GLTFMeshPrimitiveIterator).material?.data;
        },
        get targets() {
          return (object as GLTFMeshPrimitiveIterator).targets.map(mapObjectData);
        }
      };
    case 'node':
      return {
        get camera() {
          return (object as GLTFNodeIterator).camera?.data;
        },
        get children() {
          return iterateObjectData((object as GLTFNodeIterator).children);
        },
        get skin() {
          return (object as GLTFNodeIterator).skin?.data;
        },
        get mesh() {
          return (object as GLTFNodeIterator).mesh?.data;
        },
        get externalAsset() {
          return (object as GLTFNodeIterator).externalAsset?.data;
        }
      };
    case 'scene':
      return {
        get nodes() {
          return iterateObjectData((object as GLTFSceneIterator).nodes);
        }
      };
    case 'skin':
      return {
        get inverseBindMatrices() {
          return (object as GLTFSkinIterator).inverseBindMatrices?.data;
        },
        get skeleton() {
          return (object as GLTFSkinIterator).skeleton?.data;
        },
        get joints() {
          return iterateObjectData((object as GLTFSkinIterator).joints);
        }
      };
    case 'texture':
      return {
        get sampler() {
          return (object as GLTFTextureIterator).sampler?.data;
        },
        get source() {
          return (object as GLTFTextureIterator).source?.data;
        }
      };
    default:
      return {};
  }
}

/** Iterate raw array values without creating wrapper arrays. */
function iterateValues<ValueT, IteratorT>(
  values: readonly ValueT[],
  getIterator: (value: ValueT, index: number) => IteratorT
): IterableIterator<IteratorT> {
  return (function* iterate(): IterableIterator<IteratorT> {
    for (let index = 0; index < values.length; index++) {
      yield getIterator(values[index], index);
    }
  })();
}

/** Yield the exact raw object carried by each internal iterator context. */
function iterateObjectData<DataT extends GLTFIteratorData>(
  objects: Iterable<GLTFObjectIterator<DataT, any>>
): IterableIterator<DataT> {
  return (function* iterateRawData(): IterableIterator<DataT> {
    for (const object of objects) {
      yield object.data;
    }
  })();
}

/** Replace internal iterator contexts in a reference map with their exact raw objects. */
function mapObjectData<DataT extends GLTFIteratorData>(
  objects: ReadonlyMap<string, GLTFObjectIterator<DataT, any>>
): ReadonlyMap<string, DataT> {
  return new Map(Array.from(objects, ([name, object]) => [name, object.data]));
}

/** Return the JSON collection name for a wrapper type. */
function getCollectionName(type: GLTFCollectionType): string {
  switch (type) {
    case 'bufferView':
      return 'bufferViews';
    case 'externalAsset':
      return 'externalAssets';
    case 'mesh':
      return 'meshes';
    default:
      return `${type}s`;
  }
}

/** Remove every occurrence of a string from an optional array. */
function removeString(values: string[] | undefined, value: string): void {
  if (!values) {
    return;
  }
  for (let index = values.length - 1; index >= 0; index--) {
    if (values[index] === value) {
      values.splice(index, 1);
    }
  }
}
