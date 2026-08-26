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

/** String tag identifying a glTF iterator wrapper. */
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
export abstract class GLTFObjectIterator<
  DataT extends GLTFIteratorData,
  TypeT extends GLTFIteratorType
> {
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

  /** Return an extension payload without modifying the raw object. */
  getExtension<ExtensionT = unknown>(extensionName: string): ExtensionT | undefined {
    return this.data.extensions?.[extensionName] as ExtensionT | undefined;
  }

  /** Set an extension payload and register the extension as used. */
  setExtension<ExtensionT>(extensionName: string, extension: ExtensionT): void {
    this.data.extensions ||= {};
    this.data.extensions[extensionName] = extension;
    this.iterator.registerUsedExtension(extensionName);
  }

  /** Remove an extension payload while preserving glTF extension bookkeeping. */
  removeExtension(extensionName: string): void {
    if (this.data.extensions?.[extensionName] !== undefined) {
      this.iterator.recordRemovedExtension(extensionName);
      delete this.data.extensions[extensionName];
    }
  }
}

/** Base class for an object stored in a parent-local array or property. */
export abstract class GLTFNestedObjectIterator<
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

/** Lazily resolved standard relationships for one iterator wrapper. */
export type GLTFIteratorReferences = object;

/** References reachable from a texture wrapper. */
export interface GLTFTextureReferences {
  readonly sampler: GLTFSamplerIterator | undefined;
  readonly source: GLTFImageIterator | undefined;
}

/** References reachable from a node wrapper. */
export interface GLTFNodeReferences {
  readonly camera: GLTFCameraIterator | undefined;
  readonly children: IterableIterator<GLTFNodeIterator>;
  readonly skin: GLTFSkinIterator | undefined;
  readonly mesh: GLTFMeshIterator | undefined;
  readonly externalAsset: GLTFExternalAssetIterator | undefined;
}

/** References reachable from a mesh wrapper. */
export interface GLTFMeshReferences {
  readonly primitives: IterableIterator<GLTFMeshPrimitiveIterator>;
}

/** References reachable from a scene wrapper. */
export interface GLTFSceneReferences {
  readonly nodes: IterableIterator<GLTFNodeIterator>;
}

/** References reachable from a mesh primitive wrapper. */
export interface GLTFMeshPrimitiveReferences {
  readonly attributes: ReadonlyMap<string, GLTFAccessorIterator>;
  readonly indices: GLTFAccessorIterator | undefined;
  readonly material: GLTFMaterialIterator | undefined;
  readonly targets: ReadonlyArray<ReadonlyMap<string, GLTFAccessorIterator>>;
}

/** References reachable from a texture-info wrapper. */
export interface GLTFTextureInfoReferences {
  readonly texture: GLTFTextureIterator;
}

/** References reachable from a material wrapper. */
export interface GLTFMaterialReferences {
  readonly baseColorTexture: GLTFTextureInfoIterator | undefined;
  readonly metallicRoughnessTexture: GLTFTextureInfoIterator | undefined;
  readonly normalTexture: GLTFTextureInfoIterator | undefined;
  readonly occlusionTexture: GLTFTextureInfoIterator | undefined;
  readonly emissiveTexture: GLTFTextureInfoIterator | undefined;
  readonly textures: IterableIterator<GLTFTextureInfoIterator>;
}

/** References reachable from an accessor wrapper. */
export interface GLTFAccessorReferences {
  readonly bufferView: GLTFBufferViewIterator | undefined;
}

/** References reachable from a buffer-view wrapper. */
export interface GLTFBufferViewReferences {
  readonly buffer: GLTFBufferIterator;
}

/** References reachable from a file or image wrapper. */
export interface GLTFBufferViewOwnerReferences {
  readonly bufferView: GLTFBufferViewIterator | undefined;
}

/** References reachable from an external asset wrapper. */
export interface GLTFExternalAssetReferences {
  readonly file: GLTFFileIterator;
}

/** References reachable from an animation wrapper. */
export interface GLTFAnimationReferences {
  readonly channels: IterableIterator<GLTFAnimationChannelIterator>;
  readonly samplers: IterableIterator<GLTFAnimationSamplerIterator>;
}

/** References reachable from an animation channel wrapper. */
export interface GLTFAnimationChannelReferences {
  readonly sampler: GLTFAnimationSamplerIterator;
  readonly target: GLTFAnimationChannelTargetIterator;
}

/** References reachable from an animation target wrapper. */
export interface GLTFAnimationChannelTargetReferences {
  readonly node: GLTFNodeIterator | undefined;
}

/** References reachable from an animation sampler wrapper. */
export interface GLTFAnimationSamplerReferences {
  readonly input: GLTFAccessorIterator;
  readonly output: GLTFAccessorIterator;
}

/** References reachable from a skin wrapper. */
export interface GLTFSkinReferences {
  readonly inverseBindMatrices: GLTFAccessorIterator | undefined;
  readonly skeleton: GLTFNodeIterator | undefined;
  readonly joints: IterableIterator<GLTFNodeIterator>;
}

/** Lightweight accessor wrapper. */
export class GLTFAccessorIterator extends GLTFObjectIterator<GLTFAccessor, 'accessor'> {
  /** Resolve the accessor's buffer view. */
  get bufferView(): GLTFBufferViewIterator | undefined {
    return this.data.bufferView === undefined
      ? undefined
      : this.iterator.resolveBufferView(this.data.bufferView, `${this.path}.bufferView`);
  }
}

/** Lightweight animation wrapper. */
export class GLTFAnimationIterator extends GLTFObjectIterator<GLTFAnimation, 'animation'> {
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
export class GLTFAnimationChannelIterator extends GLTFNestedObjectIterator<
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
export class GLTFAnimationChannelTargetIterator extends GLTFNestedObjectIterator<
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
export class GLTFAnimationSamplerIterator extends GLTFNestedObjectIterator<
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
export class GLTFBufferIterator extends GLTFObjectIterator<GLTFBuffer, 'buffer'> {
  /** Return the loaded byte range parallel to this JSON buffer, when available. */
  get loadedBuffer(): GLTFWithBuffers['buffers'][number] | undefined {
    return this.gltf.buffers[this.index];
  }
}

/** Lightweight buffer-view wrapper. */
export class GLTFBufferViewIterator extends GLTFObjectIterator<GLTFBufferView, 'bufferView'> {
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
export class GLTFCameraIterator extends GLTFObjectIterator<GLTFCamera, 'camera'> {}

/** Lightweight external-asset wrapper for draft glTF 2.1. */
export class GLTFExternalAssetIterator extends GLTFObjectIterator<
  GLTFExternalAsset,
  'externalAsset'
> {
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
export class GLTFFileIterator extends GLTFObjectIterator<GLTFFile, 'file'> {
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
export class GLTFImageIterator extends GLTFObjectIterator<GLTFImage, 'image'> {
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
export class GLTFMaterialIterator extends GLTFObjectIterator<GLTFMaterial, 'material'> {
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
export class GLTFTextureInfoIterator extends GLTFNestedObjectIterator<
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
export class GLTFMeshIterator extends GLTFObjectIterator<GLTFMesh, 'mesh'> {
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
export class GLTFMeshPrimitiveIterator extends GLTFNestedObjectIterator<
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
export class GLTFNodeIterator extends GLTFObjectIterator<GLTFNode, 'node'> {
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
export class GLTFSamplerIterator extends GLTFObjectIterator<GLTFSampler, 'sampler'> {}

/** Lightweight scene wrapper. */
export class GLTFSceneIterator extends GLTFObjectIterator<GLTFScene, 'scene'> {
  /** Iterate resolved scene root nodes in source order. */
  get nodes(): IterableIterator<GLTFNodeIterator> {
    return iterateValues(this.data.nodes || [], (nodeIndex, sceneNodeIndex) =>
      this.iterator.resolveNode(nodeIndex, `${this.path}.nodes[${sceneNodeIndex}]`)
    );
  }
}

/** Lightweight skin wrapper. */
export class GLTFSkinIterator extends GLTFObjectIterator<GLTFSkin, 'skin'> {
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
export class GLTFTextureIterator extends GLTFObjectIterator<GLTFTexture, 'texture'> {
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

  /** Return lazily resolved standard relationships for an iterator wrapper. */
  getReferences(object: GLTFAccessorIterator): GLTFAccessorReferences;
  getReferences(object: GLTFAnimationIterator): GLTFAnimationReferences;
  getReferences(object: GLTFAnimationChannelIterator): GLTFAnimationChannelReferences;
  getReferences(object: GLTFAnimationChannelTargetIterator): GLTFAnimationChannelTargetReferences;
  getReferences(object: GLTFAnimationSamplerIterator): GLTFAnimationSamplerReferences;
  getReferences(object: GLTFBufferViewIterator): GLTFBufferViewReferences;
  getReferences(object: GLTFExternalAssetIterator): GLTFExternalAssetReferences;
  getReferences(object: GLTFFileIterator): GLTFBufferViewOwnerReferences;
  getReferences(object: GLTFImageIterator): GLTFBufferViewOwnerReferences;
  getReferences(object: GLTFMaterialIterator): GLTFMaterialReferences;
  getReferences(object: GLTFTextureInfoIterator): GLTFTextureInfoReferences;
  getReferences(object: GLTFMeshIterator): GLTFMeshReferences;
  getReferences(object: GLTFMeshPrimitiveIterator): GLTFMeshPrimitiveReferences;
  getReferences(object: GLTFNodeIterator): GLTFNodeReferences;
  getReferences(object: GLTFSceneIterator): GLTFSceneReferences;
  getReferences(object: GLTFSkinIterator): GLTFSkinReferences;
  getReferences(object: GLTFTextureIterator): GLTFTextureReferences;
  getReferences(object: GLTFObjectIterator<any, any>): GLTFIteratorReferences {
    const cachedReferences = this.referencesCache.get(object);
    if (cachedReferences) {
      return cachedReferences;
    }
    const references = createReferences(object);
    this.referencesCache.set(object, references);
    return references;
  }

  /** Resolve the default scene. */
  get scene(): GLTFSceneIterator | undefined {
    return this.data.scene === undefined ? undefined : this.resolveScene(this.data.scene, 'scene');
  }

  /** Resolve the optional draft glTF 2.1 thumbnail image. */
  get thumbnail(): GLTFImageIterator | undefined {
    return this.data.asset.thumbnail === undefined
      ? undefined
      : this.resolveImage(this.data.asset.thumbnail, 'asset.thumbnail');
  }

  /** Iterate raw accessors in source order. */
  get accessors(): IterableIterator<GLTFAccessorIterator> {
    return this.iterateCollection('accessor') as IterableIterator<GLTFAccessorIterator>;
  }

  /** Iterate raw animations in source order. */
  get animations(): IterableIterator<GLTFAnimationIterator> {
    return this.iterateCollection('animation') as IterableIterator<GLTFAnimationIterator>;
  }

  /** Iterate raw buffers in source order. */
  get buffers(): IterableIterator<GLTFBufferIterator> {
    return this.iterateCollection('buffer') as IterableIterator<GLTFBufferIterator>;
  }

  /** Iterate raw buffer views in source order. */
  get bufferViews(): IterableIterator<GLTFBufferViewIterator> {
    return this.iterateCollection('bufferView') as IterableIterator<GLTFBufferViewIterator>;
  }

  /** Iterate raw cameras in source order. */
  get cameras(): IterableIterator<GLTFCameraIterator> {
    return this.iterateCollection('camera') as IterableIterator<GLTFCameraIterator>;
  }

  /** Iterate raw draft glTF 2.1 external assets in source order. */
  get externalAssets(): IterableIterator<GLTFExternalAssetIterator> {
    return this.iterateCollection('externalAsset') as IterableIterator<GLTFExternalAssetIterator>;
  }

  /** Iterate raw draft glTF 2.1 files in source order. */
  get files(): IterableIterator<GLTFFileIterator> {
    return this.iterateCollection('file') as IterableIterator<GLTFFileIterator>;
  }

  /** Iterate raw images in source order. */
  get images(): IterableIterator<GLTFImageIterator> {
    return this.iterateCollection('image') as IterableIterator<GLTFImageIterator>;
  }

  /** Iterate raw materials in source order. */
  get materials(): IterableIterator<GLTFMaterialIterator> {
    return this.iterateCollection('material') as IterableIterator<GLTFMaterialIterator>;
  }

  /** Iterate raw mesh definitions in source order. */
  get meshes(): IterableIterator<GLTFMeshIterator> {
    return this.iterateCollection('mesh') as IterableIterator<GLTFMeshIterator>;
  }

  /** Iterate raw nodes in source order. */
  get nodes(): IterableIterator<GLTFNodeIterator> {
    return this.iterateCollection('node') as IterableIterator<GLTFNodeIterator>;
  }

  /** Iterate raw texture samplers in source order. */
  get samplers(): IterableIterator<GLTFSamplerIterator> {
    return this.iterateCollection('sampler') as IterableIterator<GLTFSamplerIterator>;
  }

  /** Iterate raw scenes in source order. */
  get scenes(): IterableIterator<GLTFSceneIterator> {
    return this.iterateCollection('scene') as IterableIterator<GLTFSceneIterator>;
  }

  /** Iterate raw skins in source order. */
  get skins(): IterableIterator<GLTFSkinIterator> {
    return this.iterateCollection('skin') as IterableIterator<GLTFSkinIterator>;
  }

  /** Iterate raw textures in source order. */
  get textures(): IterableIterator<GLTFTextureIterator> {
    return this.iterateCollection('texture') as IterableIterator<GLTFTextureIterator>;
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

  /** Return a top-level extension payload without modifying the glTF. */
  getExtension<ExtensionT = unknown>(extensionName: string): ExtensionT | undefined {
    return this.data.extensions?.[extensionName] as ExtensionT | undefined;
  }

  /** Set a top-level extension payload and register it as used. */
  setExtension<ExtensionT>(extensionName: string, extension: ExtensionT, required = false): void {
    this.data.extensions ||= {};
    this.data.extensions[extensionName] = extension;
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

  /** Remove top-level extension data and declarations. */
  removeExtension(extensionName: string): void {
    if (this.data.extensions?.[extensionName] !== undefined) {
      this.recordRemovedExtension(extensionName);
      delete this.data.extensions[extensionName];
    }
    removeString(this.data.extensionsUsed, extensionName);
    removeString(this.data.extensionsRequired, extensionName);
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
          return (object as GLTFAccessorIterator).bufferView;
        }
      };
    case 'animation':
      return {
        get channels() {
          return (object as GLTFAnimationIterator).channels;
        },
        get samplers() {
          return (object as GLTFAnimationIterator).samplers;
        }
      };
    case 'animationChannel':
      return {
        get sampler() {
          return (object as GLTFAnimationChannelIterator).sampler;
        },
        get target() {
          return (object as GLTFAnimationChannelIterator).target;
        }
      };
    case 'animationChannelTarget':
      return {
        get node() {
          return (object as GLTFAnimationChannelTargetIterator).node;
        }
      };
    case 'animationSampler':
      return {
        get input() {
          return (object as GLTFAnimationSamplerIterator).input;
        },
        get output() {
          return (object as GLTFAnimationSamplerIterator).output;
        }
      };
    case 'bufferView':
      return {
        get buffer() {
          return (object as GLTFBufferViewIterator).buffer;
        }
      };
    case 'externalAsset':
      return {
        get file() {
          return (object as GLTFExternalAssetIterator).file;
        }
      };
    case 'file':
    case 'image':
      return {
        get bufferView() {
          return (object as GLTFFileIterator | GLTFImageIterator).bufferView;
        }
      };
    case 'material':
      return {
        get baseColorTexture() {
          return (object as GLTFMaterialIterator).baseColorTexture;
        },
        get metallicRoughnessTexture() {
          return (object as GLTFMaterialIterator).metallicRoughnessTexture;
        },
        get normalTexture() {
          return (object as GLTFMaterialIterator).normalTexture;
        },
        get occlusionTexture() {
          return (object as GLTFMaterialIterator).occlusionTexture;
        },
        get emissiveTexture() {
          return (object as GLTFMaterialIterator).emissiveTexture;
        },
        get textures() {
          return (object as GLTFMaterialIterator).textures;
        }
      };
    case 'textureInfo':
      return {
        get texture() {
          return (object as GLTFTextureInfoIterator).texture;
        }
      };
    case 'mesh':
      return {
        get primitives() {
          return (object as GLTFMeshIterator).primitives;
        }
      };
    case 'primitive':
      return {
        get attributes() {
          return (object as GLTFMeshPrimitiveIterator).attributes;
        },
        get indices() {
          return (object as GLTFMeshPrimitiveIterator).indices;
        },
        get material() {
          return (object as GLTFMeshPrimitiveIterator).material;
        },
        get targets() {
          return (object as GLTFMeshPrimitiveIterator).targets;
        }
      };
    case 'node':
      return {
        get camera() {
          return (object as GLTFNodeIterator).camera;
        },
        get children() {
          return (object as GLTFNodeIterator).children;
        },
        get skin() {
          return (object as GLTFNodeIterator).skin;
        },
        get mesh() {
          return (object as GLTFNodeIterator).mesh;
        },
        get externalAsset() {
          return (object as GLTFNodeIterator).externalAsset;
        }
      };
    case 'scene':
      return {
        get nodes() {
          return (object as GLTFSceneIterator).nodes;
        }
      };
    case 'skin':
      return {
        get inverseBindMatrices() {
          return (object as GLTFSkinIterator).inverseBindMatrices;
        },
        get skeleton() {
          return (object as GLTFSkinIterator).skeleton;
        },
        get joints() {
          return (object as GLTFSkinIterator).joints;
        }
      };
    case 'texture':
      return {
        get sampler() {
          return (object as GLTFTextureIterator).sampler;
        },
        get source() {
          return (object as GLTFTextureIterator).source;
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
