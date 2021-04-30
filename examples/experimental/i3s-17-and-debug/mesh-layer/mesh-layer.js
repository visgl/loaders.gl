import {log} from '@deck.gl/core';
import {SimpleMeshLayer} from '@deck.gl/mesh-layers';
import GL from '@luma.gl/constants';
import {pbr} from '@luma.gl/shadertools';
import {Model, Geometry} from '@luma.gl/core';
import vs from './simple-mesh-layer-vertex.glsl';
import fs from './simple-mesh-layer-fragment.glsl';
import GLTFMaterialParser from '../luma/gltf-material-parser';
import {shouldComposeModelMatrix} from './matrix';

function validateGeometryAttributes(attributes, useMeshColors) {
  const hasColorAttribute = attributes.COLOR_0 || attributes.colors;
  const useColorAttribute = hasColorAttribute && useMeshColors;
  if (!useColorAttribute) {
    attributes.colors = {constant: true, value: new Float32Array([1, 1, 1])};
  }
  log.assert(
    attributes.positions || attributes.POSITION,
    'no "postions" or "POSITION" attribute in mesh'
  );
}

/*
 * Convert mesh data into geometry
 * @returns {Geometry} geometry
 */
function getGeometry(data, useMeshColors) {
  if (data.attributes) {
    validateGeometryAttributes(data.attributes, useMeshColors);
    if (data instanceof Geometry) {
      return data;
    }
    return new Geometry(data);
  } else if (data.positions || data.POSITION) {
    validateGeometryAttributes(data, useMeshColors);
    return new Geometry({
      attributes: data
    });
  }
  throw Error('Invalid mesh');
}

export default class MeshLayer extends SimpleMeshLayer {
  getShaders() {
    const {material} = this.props;
    const shaders = super.getShaders();
    const modules = shaders.modules;

    if (material) {
      modules.push(pbr);
    }

    return {...shaders, vs, fs};
  }

  initializeState() {
    const {pickFeatures, segmentationData} = this.props;
    super.initializeState();

    if (pickFeatures && segmentationData) {
      this.state.attributeManager.add({
        segmentationPickingColors: {
          type: GL.UNSIGNED_BYTE,
          size: 3,
          noAlloc: true,
          update: this.calculateSegmentationPickingColors
        }
      });
    }
  }

  updateState({props, oldProps, changeFlags}) {
    super.updateState({props, oldProps, changeFlags});
    if (props.material !== oldProps.material) {
      this.setMaterial(props.material);
    }
  }

  draw({uniforms}) {
    if (!this.state.model) {
      return;
    }

    const {viewport} = this.context;
    const {sizeScale, coordinateSystem, _instanced} = this.props;
    this.state.model.draw({
      uniforms: Object.assign({}, uniforms, {
        sizeScale,
        composeModelMatrix: !_instanced || shouldComposeModelMatrix(viewport, coordinateSystem),
        flatShading: !this.state.hasNormals,
        // Needed for PBR (TODO: find better way to get it)
        // eslint-disable-next-line camelcase
        u_Camera: this.state.model.getUniforms().project_uCameraPosition
      })
    });
  }

  getModel(mesh) {
    const {pickFeatures, segmentationData} = this.props;
    let materialParser = null;
    if (this.props.material) {
      const material = this.props.material;
      const unlit = Boolean(
        material.pbrMetallicRoughness && material.pbrMetallicRoughness.baseColorTexture
      );
      materialParser = new GLTFMaterialParser(this.context.gl, {
        attributes: {NORMAL: mesh.attributes.normals, TEXCOORD_0: mesh.attributes.texCoords},
        material: {unlit, ...material},
        pbrDebug: false,
        imageBasedLightingEnvironment: null,
        lights: true,
        useTangents: false
      });
    }

    const shaders = this.getShaders();

    const customDefines = {};
    if (mesh.attributes.uvRegions) {
      customDefines.HAS_UV_REGION = 1;
    }

    const model = new Model(
      this.context.gl,
      Object.assign({}, shaders, {
        id: this.props.id,
        geometry: getGeometry(mesh, true),
        defines: {...shaders.defines, ...materialParser?.defines, ...customDefines},
        parameters: materialParser?.parameters,
        isInstanced: true
      })
    );

    const {texture} = this.props;
    const {emptyTexture} = this.state;
    if (materialParser) {
      model.setUniforms(materialParser.uniforms);
    } else {
      model.setUniforms({
        sampler: texture || emptyTexture,
        hasTexture: Boolean(texture)
      });
    }

    model.setUniforms({
      // eslint-disable-next-line camelcase
      u_pickSegmentation: Boolean(pickFeatures && segmentationData)
    });

    return model;
  }

  setTexture(texture) {
    if (!this.props.material) {
      const {emptyTexture, model} = this.state;

      if (model) {
        // props.mesh may not be ready at this time.
        // The sampler will be set when `getModel` is called
        model.setUniforms({
          sampler: texture || emptyTexture,
          hasTexture: Boolean(texture)
        });
      }
    }
  }

  setMaterial(material) {
    if (!material) {
      return;
    }
    const {model} = this.state;
    if (model) {
      const unlit = Boolean(
        material.pbrMetallicRoughness && material.pbrMetallicRoughness.baseColorTexture
      );
      const {mesh} = this.props;
      const materialParser = new GLTFMaterialParser(this.context.gl, {
        attributes: {NORMAL: mesh.attributes.normals, TEXCOORD_0: mesh.attributes.texCoords},
        material: {unlit, ...material},
        pbrDebug: false,
        imageBasedLightingEnvironment: null,
        lights: true,
        useTangents: false
      });

      model.setUniforms(materialParser.uniforms);
    }
  }

  calculateSegmentationPickingColors(attribute) {
    const {segmentationData} = this.props;

    if (!segmentationData) {
      return;
    }

    const value = new Uint8ClampedArray(segmentationData.length * attribute.size);

    for (let index = 0; index < segmentationData.length; index++) {
      const color = this.encodePickingColor(segmentationData[index]);

      value[index * 3] = color[0];
      value[index * 3 + 1] = color[1];
      value[index * 3 + 2] = color[2];
    }

    attribute.value = value;
  }
}

MeshLayer.layerName = 'MeshLayer';
