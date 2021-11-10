// Merge this component back to @deck.gl when it is moved on version 8
import {COORDINATE_SYSTEM} from '@deck.gl/core';
import {Tile3DLayer} from '@deck.gl/geo-layers';
import {Geometry} from '@luma.gl/core';
import GL from '@luma.gl/constants';
import {default as _MeshLayer} from './mesh-layer/mesh-layer';

const SINGLE_DATA = [0];

export default class Tile3DLayerTmp extends Tile3DLayer {
  _makeSimpleMeshLayer(tileHeader, oldLayer) {
    const content = tileHeader.content;
    const {attributes, indices, modelMatrix, cartographicOrigin, coordinateSystem = COORDINATE_SYSTEM.METER_OFFSETS, material, featureIds} = content;
    const {_getMeshColor} = this.props;

    const geometry =
      (oldLayer && oldLayer.props.mesh) ||
      new Geometry({
        drawMode: GL.TRIANGLES,
        attributes: getMeshGeometry(attributes),
        indices
      });

    const SubLayerClass = this.getSubLayerClass('mesh', _MeshLayer);

    return new SubLayerClass(
      this.getSubLayerProps({
        id: 'mesh'
      }),
      {
        id: `${this.id}-mesh-${tileHeader.id}`,
        tile: tileHeader,
        mesh: geometry,
        data: SINGLE_DATA,
        getColor: _getMeshColor(tileHeader),
        pbrMaterial: material,
        modelMatrix,
        coordinateOrigin: cartographicOrigin,
        coordinateSystem,
        featureIds,
        _offset: 0
      }
    );
  }
}

function getMeshGeometry(contentAttributes) {
  const attributes = {};
  attributes.positions = {
    ...contentAttributes.positions,
    value: new Float32Array(contentAttributes.positions.value)
  };
  if (contentAttributes.normals) {
    attributes.normals = contentAttributes.normals;
  }
  if (contentAttributes.texCoords) {
    attributes.texCoords = contentAttributes.texCoords;
  }
  if (contentAttributes.colors) {
    attributes.colors = contentAttributes.colors;
  }
  if (contentAttributes.uvRegions) {
    attributes.uvRegions = contentAttributes.uvRegions;
  }
  return attributes;
}
