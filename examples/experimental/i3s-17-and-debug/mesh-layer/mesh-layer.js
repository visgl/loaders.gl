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
    const {material, isDebugMode} = this.props;
    const shaders = super.getShaders();
    const modules = shaders.modules;
    if (material) {
      modules.push(pbr);
    }

    if (isDebugMode) {
      shaders.defines.INSTANCE_PICKING_MODE = 1;
    }
    return {...shaders, vs, fs};
  }

  initializeState() {
    super.initializeState();

    this.state.attributeManager.add({
      pickingColors: {
        type: GL.UNSIGNED_BYTE,
        size: 3,
        noAlloc: true,
        update: this.calculatePickingColors
      }
    });
  }

  draw({uniforms}) {
    if (!this.state.model) {
      return;
    }

    const {viewport} = this.context;
    const {sizeScale, coordinateSystem, _instanced, viewportIds} = this.props;

    if (!viewportIds.includes(viewport.id)) {
      return;
    }

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

    const model = new Model(
      this.context.gl,
      Object.assign({}, shaders, {
        id: this.props.id,
        geometry: getGeometry(mesh, true),
        defines: {...shaders.defines, ...materialParser?.defines},
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

  calculatePickingColors(attribute) {
    if (!this.props.mesh.attributes.featureIds) {
      return;
    }

    const featuresIds = this.props.mesh.attributes.featureIds.value;
    const value = new Uint8ClampedArray(featuresIds.length * attribute.size);

    for (let index = 0; index < featuresIds.length; index++) {
      const color = this.encodePickingColor(featuresIds[index]);

      value[index * 3] = color[0];
      value[index * 3 + 1] = color[1];
      value[index * 3 + 2] = color[2];
    }

    attribute.value = value;
  }
}

MeshLayer.layerName = 'MeshLayer';
