import {SimpleMeshLayer} from '@deck.gl/mesh-layers';
import GL from '@luma.gl/constants';
import vs from './simple-mesh-layer-vertex.glsl';
import fs from './simple-mesh-layer-fragment.glsl';
export default class MeshLayer extends SimpleMeshLayer {
  getShaders() {
    const shaders = super.getShaders();
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

  calculatePickingColors(attribute) {
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
