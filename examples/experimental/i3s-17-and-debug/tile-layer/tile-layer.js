import GL from '@luma.gl/constants';
import {Geometry} from '@luma.gl/core';
import {COORDINATE_SYSTEM} from '@deck.gl/core';
import {Tile3DLayer} from '@deck.gl/geo-layers';
import {log} from '@deck.gl/core';
import MeshLayer from '../mesh-layer/mesh-layer';

const SINGLE_DATA = [0];

// Use our custom MeshLayer
export default class TileLayer extends Tile3DLayer {
  initializeState() {
    if ('onTileLoadFail' in this.props) {
      log.removed('onTileLoadFail', 'onTileError')();
    }

    this.state = {
      layerMap: {},
      tileset3d: null
    };
  }

  // Method is taken from the base class https://github.com/visgl/deck.gl/blob/15b65748adacb96d3d9d5ce0515fe785c1318167/modules/geo-layers/src/tile-3d-layer/tile-3d-layer.js#L128
  _updateTileset(tileset3d) {
    // OLD CODE
    // const {timeline, viewport} = this.context;
    // if (!timeline || !viewport || !tileset3d) {
    //   return;
    // }
    // const frameNumber = tileset3d.update(viewport);

    // NEW CODE START
    const {timeline, deck} = this.context;
    const viewports = deck.viewManager.getViewports();
    if (!timeline || !viewports || !tileset3d) {
      return;
    }

    const frameNumber = tileset3d.update(viewports);
    // NEW CODE END

    const tilesetChanged = this.state.frameNumber !== frameNumber;
    if (tilesetChanged) {
      this.setState({frameNumber});
    }
  }

  _makeSimpleMeshLayer(tileHeader, oldLayer) {
    const content = tileHeader.content;
    const {
      attributes,
      indices,
      modelMatrix,
      cartographicOrigin,
      texture,
      material,
      featureIds,
      // Remove segmentationData after i3s-content-worker will be published
      segmentationData
    } = content;
    const {pickable, autoHighlight, pickFeatures, wireframe, getMeshColor} = this.props;

    const geometry =
      (oldLayer && oldLayer.props.mesh) ||
      new Geometry({
        drawMode: GL.TRIANGLES,
        attributes: getMeshGeometry(attributes),
        indices
      });

    return new MeshLayer(
      this.getSubLayerProps({
        id: 'mesh'
      }),
      {
        id: `${this.id}-mesh-${tileHeader.id}`,
        viewportIds: tileHeader.viewportIds,
        mesh: geometry,
        data: SINGLE_DATA,
        getPosition: [0, 0, 0],
        getColor: getMeshColor ? getMeshColor(tileHeader) : [255, 255, 255],
        texture,
        material,
        modelMatrix,
        coordinateOrigin: cartographicOrigin,
        coordinateSystem: COORDINATE_SYSTEM.METER_OFFSETS,
        pickable,
        autoHighlight,
        highlightColor: [0, 0, 255, 150],
        wireframe,
        pickFeatures,
        // Remove segmentationData after i3s-content-worker will be published
        featureIds: featureIds || segmentationData
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
  if (contentAttributes.uvRegions) {
    attributes.uvRegions = contentAttributes.uvRegions;
  }
  if (contentAttributes.colors) {
    attributes.colors = contentAttributes.colors;
  }
  if (contentAttributes.featureIds) {
    attributes.featureIds = contentAttributes.featureIds;
  }
  return attributes;
}
