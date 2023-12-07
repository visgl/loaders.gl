// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {GLTFWithBuffers} from '../types/gltf-types';
import type {ParseGLTFOptions} from '../parsers/parse-gltf';

import type {
  GLTF,
  GLTFAccessor,
  GLTFBufferView,
  GLTFCamera,
  GLTFImage,
  GLTFMaterial,
  GLTFMesh,
  GLTFNode,
  GLTFSampler,
  GLTFScene,
  GLTFSkin,
  GLTFTexture
} from '../types/gltf-json-schema';

import type {
  GLTFPostprocessed,
  GLTFAccessorPostprocessed,
  GLTFBufferPostprocessed,
  GLTFBufferViewPostprocessed,
  GLTFCameraPostprocessed,
  GLTFImagePostprocessed,
  GLTFMaterialPostprocessed,
  GLTFMeshPostprocessed,
  GLTFNodePostprocessed,
  GLTFSamplerPostprocessed,
  GLTFScenePostprocessed,
  GLTFSkinPostprocessed,
  GLTFTexturePostprocessed,
  GLTFMeshPrimitivePostprocessed
} from '../types/gltf-postprocessed-schema';

import {assert} from '../utils/assert';
import {getAccessorArrayTypeAndLength} from '../gltf-utils/gltf-utils';

// This is a post processor for loaded glTF files
// The goal is to make the loaded data easier to use in WebGL applications
//
// Functions:
// * Resolve indexed arrays structure of glTF into a linked tree.
// * Translate stringified enum keys and values into WebGL constants.
// * Load images (optional)

// ENUM LOOKUP

const COMPONENTS = {
  SCALAR: 1,
  VEC2: 2,
  VEC3: 3,
  VEC4: 4,
  MAT2: 4,
  MAT3: 9,
  MAT4: 16
};

const BYTES = {
  5120: 1, // BYTE
  5121: 1, // UNSIGNED_BYTE
  5122: 2, // SHORT
  5123: 2, // UNSIGNED_SHORT
  5125: 4, // UNSIGNED_INT
  5126: 4 // FLOAT
};

const GL_SAMPLER = {
  // Sampler parameters
  TEXTURE_MAG_FILTER: 0x2800,
  TEXTURE_MIN_FILTER: 0x2801,
  TEXTURE_WRAP_S: 0x2802,
  TEXTURE_WRAP_T: 0x2803,

  // Sampler default values
  REPEAT: 0x2901,
  LINEAR: 0x2601,
  NEAREST_MIPMAP_LINEAR: 0x2702
};

const SAMPLER_PARAMETER_GLTF_TO_GL = {
  magFilter: GL_SAMPLER.TEXTURE_MAG_FILTER,
  minFilter: GL_SAMPLER.TEXTURE_MIN_FILTER,
  wrapS: GL_SAMPLER.TEXTURE_WRAP_S,
  wrapT: GL_SAMPLER.TEXTURE_WRAP_T
};

// When undefined, a sampler with repeat wrapping and auto filtering should be used.
// https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#texture
const DEFAULT_SAMPLER_PARAMETERS = {
  [GL_SAMPLER.TEXTURE_MAG_FILTER]: GL_SAMPLER.LINEAR,
  [GL_SAMPLER.TEXTURE_MIN_FILTER]: GL_SAMPLER.NEAREST_MIPMAP_LINEAR,
  [GL_SAMPLER.TEXTURE_WRAP_S]: GL_SAMPLER.REPEAT,
  [GL_SAMPLER.TEXTURE_WRAP_T]: GL_SAMPLER.REPEAT
};

function makeDefaultSampler(): GLTFSamplerPostprocessed {
  return {
    id: 'default-sampler',
    parameters: DEFAULT_SAMPLER_PARAMETERS
  };
}

function getBytesFromComponentType(componentType) {
  return BYTES[componentType];
}

function getSizeFromAccessorType(type) {
  return COMPONENTS[type];
}

class GLTFPostProcessor {
  baseUri: string = '';
  // @ts-expect-error
  jsonUnprocessed: GLTF;
  // @ts-expect-error
  json: GLTFPostprocessed;
  buffers: {
    arrayBuffer: ArrayBuffer;
    byteOffset: number;
    byteLength: number;
  }[] = [];
  images: any[] = [];

  postProcess(gltf: GLTFWithBuffers, options = {}) {
    const {json, buffers = [], images = []} = gltf;
    // @ts-expect-error
    const {baseUri = ''} = gltf;
    assert(json);

    this.baseUri = baseUri;
    this.buffers = buffers;
    this.images = images;
    this.jsonUnprocessed = json;

    this.json = this._resolveTree(gltf.json, options);

    return this.json;
  }

  // Convert indexed glTF structure into tree structure
  // cross-link index resolution, enum lookup, convenience calculations
  // eslint-disable-next-line complexity, max-statements
  _resolveTree(gltf: GLTF, options = {}): GLTFPostprocessed {
    // @ts-expect-error
    const json: GLTFPostprocessed = {...gltf};
    this.json = json;

    if (gltf.bufferViews) {
      json.bufferViews = gltf.bufferViews.map((bufView, i) => this._resolveBufferView(bufView, i));
    }
    if (gltf.images) {
      json.images = gltf.images.map((image, i) => this._resolveImage(image, i));
    }
    if (gltf.samplers) {
      json.samplers = gltf.samplers.map((sampler, i) => this._resolveSampler(sampler, i));
    }
    if (gltf.textures) {
      json.textures = gltf.textures.map((texture, i) => this._resolveTexture(texture, i));
    }
    if (gltf.accessors) {
      json.accessors = gltf.accessors.map((accessor, i) => this._resolveAccessor(accessor, i));
    }
    if (gltf.materials) {
      json.materials = gltf.materials.map((material, i) => this._resolveMaterial(material, i));
    }
    if (gltf.meshes) {
      json.meshes = gltf.meshes.map((mesh, i) => this._resolveMesh(mesh, i));
    }
    if (gltf.nodes) {
      json.nodes = gltf.nodes.map((node, i) => this._resolveNode(node, i));
      json.nodes = json.nodes.map((node, i) => this._resolveNodeChildren(node));
    }
    if (gltf.skins) {
      json.skins = gltf.skins.map((skin, i) => this._resolveSkin(skin, i));
    }
    if (gltf.scenes) {
      json.scenes = gltf.scenes.map((scene, i) => this._resolveScene(scene, i));
    }
    if (typeof this.json.scene === 'number' && json.scenes) {
      json.scene = json.scenes[this.json.scene];
    }

    return json;
  }

  getScene(index: number): GLTFScenePostprocessed {
    return this._get(this.json.scenes, index);
  }

  getNode(index: number): GLTFNodePostprocessed {
    return this._get(this.json.nodes, index);
  }

  getSkin(index: number): GLTFSkinPostprocessed {
    return this._get(this.json.skins, index);
  }

  getMesh(index: number): GLTFMeshPostprocessed {
    return this._get(this.json.meshes, index);
  }

  getMaterial(index: number): GLTFMaterialPostprocessed {
    return this._get(this.json.materials, index);
  }

  getAccessor(index: number): GLTFAccessorPostprocessed {
    return this._get(this.json.accessors, index);
  }

  getCamera(index: number): GLTFCameraPostprocessed {
    return this._get(this.json.cameras, index);
  }

  getTexture(index: number): GLTFTexturePostprocessed {
    return this._get(this.json.textures, index);
  }

  getSampler(index: number): GLTFSamplerPostprocessed {
    return this._get(this.json.samplers, index);
  }

  getImage(index: number): GLTFImagePostprocessed {
    return this._get(this.json.images, index);
  }

  getBufferView(index: number): GLTFBufferViewPostprocessed {
    return this._get(this.json.bufferViews, index);
  }

  getBuffer(index: number): GLTFBufferPostprocessed {
    return this._get(this.json.buffers, index);
  }

  _get<T>(array: T[] | undefined, index: number): T {
    // check if already resolved
    if (typeof index === 'object') {
      return index;
    }
    const object = array && array[index];
    if (!object) {
      console.warn(`glTF file error: Could not find ${array}[${index}]`); // eslint-disable-line
    }
    return object as T;
  }

  // PARSING HELPERS

  _resolveScene(scene: GLTFScene, index: number): GLTFScenePostprocessed {
    return {
      ...scene,
      // @ts-ignore
      id: scene.id || `scene-${index}`,
      nodes: (scene.nodes || []).map((node) => this.getNode(node))
    };
  }

  _resolveNode(gltfNode: GLTFNode, index: number): GLTFNodePostprocessed {
    // @ts-expect-error
    const node: GLTFNodePostprocessed = {
      ...gltfNode,
      // @ts-expect-error id could already be present, glTF standard does not prevent it
      id: gltfNode?.id || `node-${index}`
    };
    if (gltfNode.mesh !== undefined) {
      node.mesh = this.getMesh(gltfNode.mesh);
    }
    if (gltfNode.camera !== undefined) {
      node.camera = this.getCamera(gltfNode.camera);
    }
    if (gltfNode.skin !== undefined) {
      node.skin = this.getSkin(gltfNode.skin);
    }

    // TODO deprecated - Delete in v4.0?
    // @ts-expect-error node.meshes does not seem to be part of the GLTF standard
    if (gltfNode.meshes !== undefined && gltfNode.meshes.length) {
      // @ts-expect-error
      node.mesh = gltfNode.meshes.reduce(
        (accum, meshIndex) => {
          const mesh = this.getMesh(meshIndex);
          accum.id = mesh.id;
          accum.primitives = accum.primitives.concat(mesh.primitives);
          return accum;
        },
        {primitives: []}
      );
    }

    return node;
  }

  _resolveNodeChildren(node: GLTFNodePostprocessed): GLTFNodePostprocessed {
    if (node.children) {
      // @ts-expect-error node.children are numbers at this stage
      node.children = node.children.map((child) => this.getNode(child));
    }
    return node;
  }

  _resolveSkin(gltfSkin: GLTFSkin, index: number): GLTFSkinPostprocessed {
    const inverseBindMatrices =
      typeof gltfSkin.inverseBindMatrices === 'number'
        ? this.getAccessor(gltfSkin.inverseBindMatrices)
        : undefined;

    return {
      ...gltfSkin,
      id: gltfSkin.id || `skin-${index}`,
      inverseBindMatrices
    };
  }

  _resolveMesh(gltfMesh: GLTFMesh, index: number): GLTFMeshPostprocessed {
    const mesh: GLTFMeshPostprocessed = {
      ...gltfMesh,
      id: gltfMesh.id || `mesh-${index}`,
      primitives: []
    };
    if (gltfMesh.primitives) {
      mesh.primitives = gltfMesh.primitives.map((gltfPrimitive) => {
        const primitive: GLTFMeshPrimitivePostprocessed = {
          ...gltfPrimitive,
          attributes: {},
          indices: undefined,
          material: undefined
        };
        const attributes = gltfPrimitive.attributes;
        for (const attribute in attributes) {
          primitive.attributes[attribute] = this.getAccessor(attributes[attribute]);
        }
        if (gltfPrimitive.indices !== undefined) {
          primitive.indices = this.getAccessor(gltfPrimitive.indices);
        }
        if (gltfPrimitive.material !== undefined) {
          primitive.material = this.getMaterial(gltfPrimitive.material);
        }
        return primitive;
      });
    }
    return mesh;
  }

  _resolveMaterial(gltfMaterial: GLTFMaterial, index: number): GLTFMaterialPostprocessed {
    // @ts-expect-error
    const material: GLTFMaterialPostprocessed = {
      ...gltfMaterial,
      // @ts-expect-error
      id: gltfMaterial.id || `material-${index}`
    };
    if (material.normalTexture) {
      material.normalTexture = {...material.normalTexture};
      material.normalTexture.texture = this.getTexture(material.normalTexture.index);
    }
    if (material.occlusionTexture) {
      material.occlusionTexture = {...material.occlusionTexture};
      material.occlusionTexture.texture = this.getTexture(material.occlusionTexture.index);
    }
    if (material.emissiveTexture) {
      material.emissiveTexture = {...material.emissiveTexture};
      material.emissiveTexture.texture = this.getTexture(material.emissiveTexture.index);
    }
    if (!material.emissiveFactor) {
      material.emissiveFactor = material.emissiveTexture ? [1, 1, 1] : [0, 0, 0];
    }

    if (material.pbrMetallicRoughness) {
      material.pbrMetallicRoughness = {...material.pbrMetallicRoughness};
      const mr = material.pbrMetallicRoughness;
      if (mr.baseColorTexture) {
        mr.baseColorTexture = {...mr.baseColorTexture};
        mr.baseColorTexture.texture = this.getTexture(mr.baseColorTexture.index);
      }
      if (mr.metallicRoughnessTexture) {
        mr.metallicRoughnessTexture = {...mr.metallicRoughnessTexture};
        mr.metallicRoughnessTexture.texture = this.getTexture(mr.metallicRoughnessTexture.index);
      }
    }
    return material;
  }

  _resolveAccessor(gltfAccessor: GLTFAccessor, index: number): GLTFAccessorPostprocessed {
    // Look up enums
    const bytesPerComponent = getBytesFromComponentType(gltfAccessor.componentType);
    const components = getSizeFromAccessorType(gltfAccessor.type);
    const bytesPerElement = bytesPerComponent * components;

    const accessor: GLTFAccessorPostprocessed = {
      ...gltfAccessor,
      // @ts-expect-error
      id: gltfAccessor.id || `accessor-${index}`,
      bytesPerComponent,
      components,
      bytesPerElement,
      value: undefined!,
      bufferView: undefined!,
      sparse: undefined!
    };
    if (gltfAccessor.bufferView !== undefined) {
      // Draco encoded meshes don't have bufferView
      accessor.bufferView = this.getBufferView(gltfAccessor.bufferView);
    }

    // Create TypedArray for the accessor
    // Note: The canonical way to instantiate is to ignore this array and create
    // WebGLBuffer's using the bufferViews.
    if (accessor.bufferView) {
      const buffer = accessor.bufferView.buffer;
      const {ArrayType, byteLength} = getAccessorArrayTypeAndLength(accessor, accessor.bufferView);
      const byteOffset =
        (accessor.bufferView.byteOffset || 0) + (accessor.byteOffset || 0) + buffer.byteOffset;
      let cutBuffer = buffer.arrayBuffer.slice(byteOffset, byteOffset + byteLength);
      if (accessor.bufferView.byteStride) {
        cutBuffer = this._getValueFromInterleavedBuffer(
          buffer,
          byteOffset,
          accessor.bufferView.byteStride,
          accessor.bytesPerElement,
          accessor.count
        );
      }
      accessor.value = new ArrayType(cutBuffer);
    }

    return accessor;
  }

  /**
   * Take values of particular accessor from interleaved buffer
   * various parts of the buffer
   * @param buffer
   * @param byteOffset
   * @param byteStride
   * @param bytesPerElement
   * @param count
   * @returns
   */
  _getValueFromInterleavedBuffer(
    buffer,
    byteOffset: number,
    byteStride: number,
    bytesPerElement: number,
    count: number
  ): ArrayBufferLike {
    const result = new Uint8Array(count * bytesPerElement);
    for (let i = 0; i < count; i++) {
      const elementOffset = byteOffset + i * byteStride;
      result.set(
        new Uint8Array(buffer.arrayBuffer.slice(elementOffset, elementOffset + bytesPerElement)),
        i * bytesPerElement
      );
    }
    return result.buffer;
  }

  _resolveTexture(gltfTexture: GLTFTexture, index: number): GLTFTexturePostprocessed {
    return {
      ...gltfTexture,
      // @ts-expect-error id could already be present, glTF standard does not prevent it
      id: gltfTexture.id || `texture-${index}`,
      sampler:
        typeof gltfTexture.sampler === 'number'
          ? this.getSampler(gltfTexture.sampler)
          : makeDefaultSampler(),
      source: typeof gltfTexture.source === 'number' ? this.getImage(gltfTexture.source) : undefined
    };
  }

  _resolveSampler(gltfSampler: GLTFSampler, index: number): GLTFSamplerPostprocessed {
    const sampler: GLTFSamplerPostprocessed = {
      // @ts-expect-error id could already be present, glTF standard does not prevent it
      id: gltfSampler.id || `sampler-${index}`,
      ...gltfSampler,
      parameters: {}
    };
    // Map textual parameters to GL parameter values
    for (const key in sampler) {
      const glEnum = this._enumSamplerParameter(key);
      if (glEnum !== undefined) {
        sampler.parameters[glEnum] = sampler[key];
      }
    }
    return sampler;
  }

  _enumSamplerParameter(key: string): number {
    return SAMPLER_PARAMETER_GLTF_TO_GL[key];
  }

  _resolveImage(gltfImage: GLTFImage, index: number): GLTFImagePostprocessed {
    const image: GLTFImagePostprocessed = {
      ...gltfImage,
      // @ts-expect-error id could already be present, glTF standard does not prevent it
      id: gltfImage.id || `image-${index}`,
      image: null!,
      bufferView:
        gltfImage.bufferView !== undefined ? this.getBufferView(gltfImage.bufferView) : undefined
    };

    // Check if image has been preloaded by the GLTFLoader
    // If so, link it into the JSON and drop the URI
    const preloadedImage = this.images[index];
    if (preloadedImage) {
      image.image = preloadedImage;
    }

    return image;
  }

  _resolveBufferView(gltfBufferView: GLTFBufferView, index: number): GLTFBufferViewPostprocessed {
    const bufferIndex = gltfBufferView.buffer;
    const arrayBuffer = this.buffers[bufferIndex].arrayBuffer;
    // Add offset of buffer, then offset of buffer view
    let byteOffset = this.buffers[bufferIndex].byteOffset || 0;
    if (gltfBufferView.byteOffset) {
      byteOffset += gltfBufferView.byteOffset;
    }

    const bufferView: GLTFBufferViewPostprocessed = {
      // // @ts-expect-error id could already be present, glTF standard does not prevent it
      id: `bufferView-${index}`,
      ...gltfBufferView,
      // ...this.buffers[bufferIndex],
      buffer: this.buffers[bufferIndex],
      data: new Uint8Array(arrayBuffer, byteOffset, gltfBufferView.byteLength)
    };

    return bufferView;
  }

  _resolveCamera(gltfCamera: GLTFCamera, index): GLTFCameraPostprocessed {
    const camera: GLTFCameraPostprocessed = {
      ...gltfCamera,
      // @ts-expect-error id could already be present, glTF standard does not prevent it
      id: gltfCamera.id || `camera-${index}`
    };

    // TODO - create 4x4 matrices
    if (camera.perspective) {
      // camera.matrix = createPerspectiveMatrix(camera.perspective);
    }
    if (camera.orthographic) {
      // camera.matrix = createOrthographicMatrix(camera.orthographic);
    }
    return camera;
  }
}

export function postProcessGLTF(
  gltf: GLTFWithBuffers,
  options?: ParseGLTFOptions
): GLTFPostprocessed {
  return new GLTFPostProcessor().postProcess(gltf, options);
}
