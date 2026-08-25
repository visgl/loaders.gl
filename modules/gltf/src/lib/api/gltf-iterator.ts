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

/** Metadata and explicit mutation helpers for a proxied raw glTF object. */
export class GLTFProxyContext<
  DataT extends GLTFIteratorData,
  TypeT extends GLTFIteratorType,
  ParentT = undefined
> {
  /** Original glTF container. */
  readonly gltf: GLTFWithBuffers;

  /** Stable tag identifying the proxied object type. */
  readonly type: TypeT;

  /** Index in the object's top-level or parent-local collection. */
  readonly index: number;

  /** Exact mutable object from the source glTF JSON. */
  readonly raw: DataT;

  /** Human-readable path to the raw object. */
  readonly path: string;

  /** Proxy containing this nested object, when applicable. */
  readonly parent: ParentT;

  /** Root iterator used by extension mutation helpers. */
  private readonly iterator: GLTFIterator;

  /** Create metadata for one proxied raw glTF object. */
  constructor(
    iterator: GLTFIterator,
    type: TypeT,
    index: number,
    raw: DataT,
    path: string,
    parent: ParentT
  ) {
    this.iterator = iterator;
    this.gltf = iterator.gltf;
    this.type = type;
    this.index = index;
    this.raw = raw;
    this.path = path;
    this.parent = parent;
  }

  /** Return an extension payload without modifying the raw object. */
  getExtension<ExtensionT = unknown>(extensionName: string): ExtensionT | undefined {
    return this.raw.extensions?.[extensionName] as ExtensionT | undefined;
  }

  /** Set an extension payload and register the extension as used. */
  setExtension<ExtensionT>(extensionName: string, extension: ExtensionT): void {
    this.raw.extensions ||= {};
    this.raw.extensions[extensionName] = extension;
    this.iterator.registerUsedExtension(extensionName);
  }

  /** Remove an extension payload while preserving glTF extension bookkeeping. */
  removeExtension(extensionName: string): void {
    if (this.raw.extensions?.[extensionName] !== undefined) {
      this.iterator.recordRemovedExtension(extensionName);
      delete this.raw.extensions[extensionName];
    }
  }
}

/** Base class for a lightweight view of one raw glTF object. */
export abstract class GLTFObjectIterator<
  DataT extends GLTFIteratorData,
  TypeT extends GLTFIteratorType,
  ParentT = undefined
> {
  /** Metadata and explicit mutation helpers for this JavaScript Proxy. */
  readonly _proxy: GLTFProxyContext<DataT, TypeT, ParentT>;

  /** Root iterator used to resolve linked indices. */
  protected readonly iterator: GLTFIterator;

  /** Raw source object used internally by resolved reference getters. */
  protected readonly _data: DataT;

  /** Raw object path used internally for precise reference errors. */
  protected readonly _path: string;

  /** Create a lightweight wrapper for a raw glTF object. */
  constructor(
    iterator: GLTFIterator,
    type: TypeT,
    index: number,
    data: DataT,
    path: string,
    parent: ParentT = undefined as ParentT
  ) {
    this.iterator = iterator;
    this._data = data;
    this._path = path;
    this._proxy = new GLTFProxyContext(iterator, type, index, data, path, parent);
  }
}

/** Base class for an object stored in a parent-local array or property. */
export abstract class GLTFNestedObjectIterator<
  DataT extends GLTFIteratorData,
  TypeT extends GLTFIteratorType,
  ParentT extends GLTFObjectIterator<GLTFIteratorData, GLTFIteratorType, any>
> extends GLTFObjectIterator<DataT, TypeT, ParentT> {
  /** Create a wrapper for a parent-local raw glTF object. */
  constructor(
    iterator: GLTFIterator,
    type: TypeT,
    index: number,
    data: DataT,
    path: string,
    parent: ParentT
  ) {
    super(iterator, type, index, data, path, parent);
  }
}

/** Lightweight accessor wrapper. */
export class GLTFAccessorIterator extends GLTFObjectIterator<GLTFAccessor, 'accessor'> {
  /** Resolve the accessor's buffer view. */
  get bufferView(): GLTFBufferViewIterator | undefined {
    return this._data.bufferView === undefined
      ? undefined
      : this.iterator.resolveBufferView(this._data.bufferView, `${this._path}.bufferView`);
  }
}

/** Raw accessor properties exposed directly by the accessor Proxy. */
export interface GLTFAccessorIterator extends Omit<GLTFAccessor, 'bufferView'> {}

/** Lightweight animation wrapper. */
export class GLTFAnimationIterator extends GLTFObjectIterator<GLTFAnimation, 'animation'> {
  /** Iterate animation channels in source order. */
  get channels(): IterableIterator<GLTFAnimationChannelIterator> {
    return iterateValues(this._data.channels, (channel, channelIndex) =>
      this.iterator.getOrCreateNested(
        channel,
        () =>
          new GLTFAnimationChannelIterator(
            this.iterator,
            'animationChannel',
            channelIndex,
            channel,
            `${this._path}.channels[${channelIndex}]`,
            this
          )
      )
    );
  }

  /** Iterate animation samplers in source order. */
  get samplers(): IterableIterator<GLTFAnimationSamplerIterator> {
    return iterateValues(this._data.samplers, (sampler, samplerIndex) =>
      this.iterator.getOrCreateNested(
        sampler,
        () =>
          new GLTFAnimationSamplerIterator(
            this.iterator,
            'animationSampler',
            samplerIndex,
            sampler,
            `${this._path}.samplers[${samplerIndex}]`,
            this
          )
      )
    );
  }
}

/** Raw animation properties exposed directly by the animation Proxy. */
export interface GLTFAnimationIterator extends Omit<GLTFAnimation, 'channels' | 'samplers'> {}

/** Lightweight animation channel wrapper. */
export class GLTFAnimationChannelIterator extends GLTFNestedObjectIterator<
  GLTFAnimationChannel,
  'animationChannel',
  GLTFAnimationIterator
> {
  /** Resolve the animation-local sampler. */
  get sampler(): GLTFAnimationSamplerIterator {
    const samplers = this._proxy.parent._proxy.raw.samplers;
    const sampler = samplers[this._data.sampler];
    if (!sampler) {
      throw new Error(
        `Invalid glTF reference at ${this._path}.sampler: animation sampler index ${this._data.sampler} is out of range`
      );
    }
    return this.iterator.getOrCreateNested(
      sampler,
      () =>
        new GLTFAnimationSamplerIterator(
          this.iterator,
          'animationSampler',
          this._data.sampler,
          sampler,
          `${this._proxy.parent._proxy.path}.samplers[${this._data.sampler}]`,
          this._proxy.parent
        )
    );
  }

  /** Return the channel target wrapper. */
  get target(): GLTFAnimationChannelTargetIterator {
    return this.iterator.getOrCreateNested(
      this._data.target,
      () =>
        new GLTFAnimationChannelTargetIterator(
          this.iterator,
          'animationChannelTarget',
          0,
          this._data.target,
          `${this._path}.target`,
          this
        )
    );
  }
}

/** Raw channel properties exposed directly by the animation-channel Proxy. */
export interface GLTFAnimationChannelIterator
  extends Omit<GLTFAnimationChannel, 'sampler' | 'target'> {}

/** Lightweight animation channel target wrapper. */
export class GLTFAnimationChannelTargetIterator extends GLTFNestedObjectIterator<
  GLTFAnimationChannelTarget,
  'animationChannelTarget',
  GLTFAnimationChannelIterator
> {
  /** Resolve the target node when one is specified. */
  get node(): GLTFNodeIterator | undefined {
    return this._data.node === undefined
      ? undefined
      : this.iterator.resolveNode(this._data.node, `${this._path}.node`);
  }
}

/** Raw target properties exposed directly by the animation-target Proxy. */
export interface GLTFAnimationChannelTargetIterator
  extends Omit<GLTFAnimationChannelTarget, 'node'> {}

/** Lightweight animation sampler wrapper. */
export class GLTFAnimationSamplerIterator extends GLTFNestedObjectIterator<
  GLTFAnimationSampler,
  'animationSampler',
  GLTFAnimationIterator
> {
  /** Resolve the sampler input accessor. */
  get input(): GLTFAccessorIterator {
    return this.iterator.resolveAccessor(this._data.input, `${this._path}.input`);
  }

  /** Resolve the sampler output accessor. */
  get output(): GLTFAccessorIterator {
    return this.iterator.resolveAccessor(this._data.output, `${this._path}.output`);
  }
}

/** Raw sampler properties exposed directly by the animation-sampler Proxy. */
export interface GLTFAnimationSamplerIterator
  extends Omit<GLTFAnimationSampler, 'input' | 'output'> {}

/** Lightweight buffer wrapper. */
export class GLTFBufferIterator extends GLTFObjectIterator<GLTFBuffer, 'buffer'> {
  /** Return the loaded byte range parallel to this JSON buffer, when available. */
  get loadedBuffer(): GLTFWithBuffers['buffers'][number] | undefined {
    return this._proxy.gltf.buffers[this._proxy.index];
  }
}

/** Raw buffer properties exposed directly by the buffer Proxy. */
export interface GLTFBufferIterator extends GLTFBuffer {}

/** Lightweight buffer-view wrapper. */
export class GLTFBufferViewIterator extends GLTFObjectIterator<GLTFBufferView, 'bufferView'> {
  /** Resolve the backing JSON buffer. */
  get buffer(): GLTFBufferIterator {
    return this.iterator.resolveBuffer(this._data.buffer, `${this._path}.buffer`);
  }

  /** Return a byte view over the loaded buffer-view range. */
  get loadedBufferView(): Uint8Array | undefined {
    const loadedBuffer = this.buffer.loadedBuffer;
    if (!loadedBuffer) {
      return undefined;
    }
    const byteOffset = loadedBuffer.byteOffset + (this._data.byteOffset || 0);
    return new Uint8Array(loadedBuffer.arrayBuffer, byteOffset, this._data.byteLength);
  }
}

/** Raw buffer-view properties exposed directly by the buffer-view Proxy. */
export interface GLTFBufferViewIterator extends Omit<GLTFBufferView, 'buffer'> {}

/** Lightweight camera wrapper. */
export class GLTFCameraIterator extends GLTFObjectIterator<GLTFCamera, 'camera'> {}

/** Raw camera properties exposed directly by the camera Proxy. */
export interface GLTFCameraIterator extends GLTFCamera {}

/** Lightweight external-asset wrapper for draft glTF 2.1. */
export class GLTFExternalAssetIterator extends GLTFObjectIterator<
  GLTFExternalAsset,
  'externalAsset'
> {
  /** Resolve the file containing the external glTF asset. */
  get file(): GLTFFileIterator {
    return this.iterator.resolveFile(this._data.file, `${this._path}.file`);
  }

  /** Return the parsed external glTF loaded parallel to this definition. */
  get loadedAsset(): GLTFWithBuffers | null | undefined {
    return this._proxy.gltf.externalAssets?.[this._proxy.index];
  }
}

/** Raw external-asset properties exposed directly by the external-asset Proxy. */
export interface GLTFExternalAssetIterator extends Omit<GLTFExternalAsset, 'file'> {}

/** Lightweight file wrapper for draft glTF 2.1. */
export class GLTFFileIterator extends GLTFObjectIterator<GLTFFile, 'file'> {
  /** Resolve the optional buffer view containing this file. */
  get bufferView(): GLTFBufferViewIterator | undefined {
    return this._data.bufferView === undefined
      ? undefined
      : this.iterator.resolveBufferView(this._data.bufferView, `${this._path}.bufferView`);
  }

  /** Return the resolved file loaded parallel to this definition. */
  get loadedFile(): NonNullable<GLTFWithBuffers['files']>[number] | undefined {
    return this._proxy.gltf.files?.[this._proxy.index];
  }
}

/** Raw file properties exposed directly by the file Proxy. */
export interface GLTFFileIterator extends Omit<GLTFFile, 'bufferView'> {}

/** Lightweight image wrapper. */
export class GLTFImageIterator extends GLTFObjectIterator<GLTFImage, 'image'> {
  /** Resolve the optional buffer view containing this image. */
  get bufferView(): GLTFBufferViewIterator | undefined {
    return this._data.bufferView === undefined
      ? undefined
      : this.iterator.resolveBufferView(this._data.bufferView, `${this._path}.bufferView`);
  }

  /** Return the decoded image loaded parallel to this definition. */
  get loadedImage(): NonNullable<GLTFWithBuffers['images']>[number] | undefined {
    return this._proxy.gltf.images?.[this._proxy.index];
  }
}

/** Raw image properties exposed directly by the image Proxy. */
export interface GLTFImageIterator extends Omit<GLTFImage, 'bufferView'> {}

/** Lightweight material wrapper. */
export class GLTFMaterialIterator extends GLTFObjectIterator<GLTFMaterial, 'material'> {
  /** Resolve the base-color texture info. */
  get baseColorTexture(): GLTFTextureInfoIterator | undefined {
    return this.getTextureInfo(
      this._data.pbrMetallicRoughness?.baseColorTexture,
      0,
      'pbrMetallicRoughness.baseColorTexture'
    );
  }

  /** Resolve the metallic-roughness texture info. */
  get metallicRoughnessTexture(): GLTFTextureInfoIterator | undefined {
    return this.getTextureInfo(
      this._data.pbrMetallicRoughness?.metallicRoughnessTexture,
      1,
      'pbrMetallicRoughness.metallicRoughnessTexture'
    );
  }

  /** Resolve the normal texture info. */
  get normalTexture(): GLTFTextureInfoIterator | undefined {
    return this.getTextureInfo(this._data.normalTexture, 2, 'normalTexture');
  }

  /** Resolve the occlusion texture info. */
  get occlusionTexture(): GLTFTextureInfoIterator | undefined {
    return this.getTextureInfo(this._data.occlusionTexture, 3, 'occlusionTexture');
  }

  /** Resolve the emissive texture info. */
  get emissiveTexture(): GLTFTextureInfoIterator | undefined {
    return this.getTextureInfo(this._data.emissiveTexture, 4, 'emissiveTexture');
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
              `${this._path}.${propertyPath}`,
              this
            )
        )
      : undefined;
  }
}

/** Raw material properties exposed directly by the material Proxy. */
export interface GLTFMaterialIterator
  extends Omit<GLTFMaterial, 'normalTexture' | 'occlusionTexture' | 'emissiveTexture'> {}

/** Lightweight texture-info wrapper nested in a material. */
export class GLTFTextureInfoIterator extends GLTFNestedObjectIterator<
  GLTFTextureInfo | GLTFMaterialNormalTextureInfo | GLTFMaterialOcclusionTextureInfo,
  'textureInfo',
  GLTFMaterialIterator
> {
  /** Resolve the texture referenced by the raw texture-info `index` field. */
  get texture(): GLTFTextureIterator {
    return this.iterator.resolveTexture(this._data.index, `${this._path}.index`);
  }
}

/** Raw texture-info properties exposed directly by the texture-info Proxy. */
export interface GLTFTextureInfoIterator extends GLTFTextureInfo {
  /** Scalar multiplier for a normal texture. */
  scale?: number;

  /** Strength multiplier for an occlusion texture. */
  strength?: number;
}

/** Lightweight mesh wrapper. */
export class GLTFMeshIterator extends GLTFObjectIterator<GLTFMesh, 'mesh'> {
  /** Iterate mesh primitives in source order. */
  get primitives(): IterableIterator<GLTFMeshPrimitiveIterator> {
    return iterateValues(this._data.primitives, (primitive, primitiveIndex) =>
      this.iterator.getOrCreateNested(
        primitive,
        () =>
          new GLTFMeshPrimitiveIterator(
            this.iterator,
            'primitive',
            primitiveIndex,
            primitive,
            `${this._path}.primitives[${primitiveIndex}]`,
            this
          )
      )
    );
  }
}

/** Raw mesh properties exposed directly by the mesh Proxy. */
export interface GLTFMeshIterator extends Omit<GLTFMesh, 'primitives'> {}

/** Lightweight mesh primitive wrapper. */
export class GLTFMeshPrimitiveIterator extends GLTFNestedObjectIterator<
  GLTFMeshPrimitive,
  'primitive',
  GLTFMeshIterator
> {
  /** Resolve every vertex attribute accessor by semantic name. */
  get attributes(): ReadonlyMap<string, GLTFAccessorIterator> {
    return new Map(
      Object.entries(this._data.attributes).map(([attributeName, accessorIndex]) => [
        attributeName,
        this.iterator.resolveAccessor(accessorIndex, `${this._path}.attributes.${attributeName}`)
      ])
    );
  }

  /** Resolve the optional index accessor. */
  get indices(): GLTFAccessorIterator | undefined {
    return this._data.indices === undefined
      ? undefined
      : this.iterator.resolveAccessor(this._data.indices, `${this._path}.indices`);
  }

  /** Resolve the optional material. */
  get material(): GLTFMaterialIterator | undefined {
    return this._data.material === undefined
      ? undefined
      : this.iterator.resolveMaterial(this._data.material, `${this._path}.material`);
  }

  /** Resolve morph-target attribute accessors without rewriting target dictionaries. */
  get targets(): ReadonlyArray<ReadonlyMap<string, GLTFAccessorIterator>> {
    return (this._data.targets || []).map(
      (target, targetIndex) =>
        new Map(
          Object.entries(target).map(([attributeName, accessorIndex]) => [
            attributeName,
            this.iterator.resolveAccessor(
              accessorIndex,
              `${this._path}.targets[${targetIndex}].${attributeName}`
            )
          ])
        )
    );
  }
}

/** Raw primitive properties exposed directly by the primitive Proxy. */
export interface GLTFMeshPrimitiveIterator
  extends Omit<GLTFMeshPrimitive, 'attributes' | 'indices' | 'material' | 'targets'> {}

/** Lightweight node wrapper. */
export class GLTFNodeIterator extends GLTFObjectIterator<GLTFNode, 'node'> {
  /** Resolve the optional camera. */
  get camera(): GLTFCameraIterator | undefined {
    return this._data.camera === undefined
      ? undefined
      : this.iterator.resolveCamera(this._data.camera, `${this._path}.camera`);
  }

  /** Iterate resolved child nodes in source order. */
  get children(): IterableIterator<GLTFNodeIterator> {
    return iterateValues(this._data.children || [], (childNodeIndex, childIndex) =>
      this.iterator.resolveNode(childNodeIndex, `${this._path}.children[${childIndex}]`)
    );
  }

  /** Resolve the optional skin. */
  get skin(): GLTFSkinIterator | undefined {
    return this._data.skin === undefined
      ? undefined
      : this.iterator.resolveSkin(this._data.skin, `${this._path}.skin`);
  }

  /** Resolve the optional mesh definition. */
  get mesh(): GLTFMeshIterator | undefined {
    return this._data.mesh === undefined
      ? undefined
      : this.iterator.resolveMesh(this._data.mesh, `${this._path}.mesh`);
  }

  /** Resolve the optional draft glTF 2.1 external asset. */
  get externalAsset(): GLTFExternalAssetIterator | undefined {
    return this._data.externalAsset === undefined
      ? undefined
      : this.iterator.resolveExternalAsset(this._data.externalAsset, `${this._path}.externalAsset`);
  }
}

/** Raw node properties exposed directly by the node Proxy. */
export interface GLTFNodeIterator
  extends Omit<GLTFNode, 'camera' | 'children' | 'skin' | 'mesh' | 'externalAsset'> {}

/** Lightweight texture sampler wrapper. */
export class GLTFSamplerIterator extends GLTFObjectIterator<GLTFSampler, 'sampler'> {}

/** Raw texture-sampler properties exposed directly by the sampler Proxy. */
export interface GLTFSamplerIterator extends GLTFSampler {}

/** Lightweight scene wrapper. */
export class GLTFSceneIterator extends GLTFObjectIterator<GLTFScene, 'scene'> {
  /** Iterate resolved scene root nodes in source order. */
  get nodes(): IterableIterator<GLTFNodeIterator> {
    return iterateValues(this._data.nodes || [], (nodeIndex, sceneNodeIndex) =>
      this.iterator.resolveNode(nodeIndex, `${this._path}.nodes[${sceneNodeIndex}]`)
    );
  }
}

/** Raw scene properties exposed directly by the scene Proxy. */
export interface GLTFSceneIterator extends Omit<GLTFScene, 'nodes'> {}

/** Lightweight skin wrapper. */
export class GLTFSkinIterator extends GLTFObjectIterator<GLTFSkin, 'skin'> {
  /** Resolve the optional inverse-bind-matrix accessor. */
  get inverseBindMatrices(): GLTFAccessorIterator | undefined {
    return this._data.inverseBindMatrices === undefined
      ? undefined
      : this.iterator.resolveAccessor(
          this._data.inverseBindMatrices,
          `${this._path}.inverseBindMatrices`
        );
  }

  /** Resolve the optional skeleton root node. */
  get skeleton(): GLTFNodeIterator | undefined {
    return this._data.skeleton === undefined
      ? undefined
      : this.iterator.resolveNode(this._data.skeleton, `${this._path}.skeleton`);
  }

  /** Iterate resolved joint nodes in source order. */
  get joints(): IterableIterator<GLTFNodeIterator> {
    return iterateValues(this._data.joints, (jointNodeIndex, jointIndex) =>
      this.iterator.resolveNode(jointNodeIndex, `${this._path}.joints[${jointIndex}]`)
    );
  }
}

/** Raw skin properties exposed directly by the skin Proxy. */
export interface GLTFSkinIterator
  extends Omit<GLTFSkin, 'inverseBindMatrices' | 'skeleton' | 'joints'> {}

/** Lightweight texture wrapper. */
export class GLTFTextureIterator extends GLTFObjectIterator<GLTFTexture, 'texture'> {
  /** Resolve the optional sampler. */
  get sampler(): GLTFSamplerIterator | undefined {
    return this._data.sampler === undefined
      ? undefined
      : this.iterator.resolveSampler(this._data.sampler, `${this._path}.sampler`);
  }

  /** Resolve the optional source image. */
  get source(): GLTFImageIterator | undefined {
    return this._data.source === undefined
      ? undefined
      : this.iterator.resolveImage(this._data.source, `${this._path}.source`);
  }
}

/** Raw texture properties exposed directly by the texture Proxy. */
export interface GLTFTextureIterator extends Omit<GLTFTexture, 'sampler' | 'source'> {}

/**
 * Traverse and transform raw glTF data through lazy, identity-preserving JavaScript Proxies.
 *
 * The iterator never clones, links, normalizes, or otherwise postprocesses its input. Ordinary
 * properties read and write the original raw JSON, same-name reference getters resolve linked
 * objects, and `_proxy` exposes metadata plus explicit extension mutation helpers.
 */
export class GLTFIterator {
  /** Original glTF container traversed by this iterator. */
  readonly gltf: GLTFWithBuffers;

  /** Cached wrapper for each raw source object. */
  private readonly objectCache = new WeakMap<object, GLTFObjectIterator<any, any, any>>();

  /** Create an iterator over an existing parsed glTF container. */
  constructor(gltf: GLTFWithBuffers) {
    this.gltf = gltf;
  }

  /** Exact unmodified glTF JSON root. */
  get data(): GLTF {
    return this.gltf.json;
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
  getOrCreateNested<IteratorT extends GLTFObjectIterator<any, any, any>>(
    data: object,
    createIterator: () => IteratorT
  ): IteratorT {
    return this.getOrCreate(data, createIterator);
  }

  /** Iterate one top-level glTF collection lazily. */
  private iterateCollection(
    type: GLTFCollectionType
  ): IterableIterator<GLTFObjectIterator<any, any, any>> {
    const values = this.getCollection(type);
    return iterateValues(values, (_, index) => this.resolveCollectionObject(type, index, type));
  }

  /** Resolve and cache one top-level collection object. */
  private resolveCollectionObject(
    type: GLTFCollectionType,
    index: number,
    sourcePath: string
  ): GLTFObjectIterator<any, any, any> {
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
  ): GLTFObjectIterator<any, any, any> {
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
  private getOrCreate<IteratorT extends GLTFObjectIterator<any, any, any>>(
    data: object,
    createIterator: () => IteratorT
  ): IteratorT {
    const cachedIterator = this.objectCache.get(data);
    if (cachedIterator) {
      return cachedIterator as IteratorT;
    }
    const iterator = createIterator();
    const proxy = createGLTFProxy(iterator);
    this.objectCache.set(data, proxy);
    return proxy;
  }
}

/** Create a natural object view over a raw glTF object and its resolved reference getters. */
function createGLTFProxy<IteratorT extends GLTFObjectIterator<any, any, any>>(
  iterator: IteratorT
): IteratorT {
  return new Proxy(iterator, {
    get(target, property, receiver) {
      if (property === 'toJSON') {
        return () => target._proxy.raw;
      }
      if (property === '_proxy') {
        return target._proxy;
      }
      if (typeof property === 'string' && hasPrototypeProperty(target, property)) {
        return Reflect.get(target, property, receiver);
      }
      if (property in target._proxy.raw) {
        return Reflect.get(target._proxy.raw, property, target._proxy.raw);
      }
      return Reflect.get(target, property, receiver);
    },
    set(target, property, value) {
      if (
        property === '_proxy' ||
        property === 'toJSON' ||
        property in target ||
        (typeof property === 'string' && hasPrototypeProperty(target, property))
      ) {
        return false;
      }
      return Reflect.set(target._proxy.raw, property, value, target._proxy.raw);
    },
    deleteProperty(target, property) {
      if (property === '_proxy' || property in target) {
        return false;
      }
      return Reflect.deleteProperty(target._proxy.raw, property);
    },
    has(target, property) {
      return (
        property === '_proxy' ||
        property === 'toJSON' ||
        property in target._proxy.raw ||
        property in target
      );
    },
    ownKeys(target) {
      return Reflect.ownKeys(target._proxy.raw);
    },
    getOwnPropertyDescriptor(target, property) {
      const descriptor = Reflect.getOwnPropertyDescriptor(target._proxy.raw, property);
      return descriptor ? {...descriptor, configurable: true} : undefined;
    }
  });
}

/** Return whether a wrapper prototype defines a resolved property or helper method. */
function hasPrototypeProperty(target: object, property: string): boolean {
  let prototype = Object.getPrototypeOf(target);
  while (prototype && prototype !== GLTFObjectIterator.prototype) {
    if (Object.prototype.hasOwnProperty.call(prototype, property)) {
      return true;
    }
    prototype = Object.getPrototypeOf(prototype);
  }
  return false;
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
