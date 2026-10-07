import {SourceLayer} from '@loaders.gl/deck-layers';
import {COORDINATE_SYSTEM, I3SLoader} from '@loaders.gl/i3s';
import {I3SMeshExtension} from '../../../examples/website/i3s-slpk/src/i3s-mesh-extension';

/** Mesh material compatibility shared with the I3S archive viewer. */
const I3S_MESH_EXTENSION = new I3SMeshExtension();

/** Creates the home page's I3S layer with the shared material shader fix. */
export function createHomeDemoLayer(): SourceLayer {
  return new SourceLayer({
    data: 'https://tiles.arcgis.com/tiles/z2tnIkrLQ2BRzr6P/arcgis/rest/services/SanFrancisco_Bldgs/SceneServer/layers/0',
    loaders: [I3SLoader],
    loadOptions: {
      i3s: {coordinateSystem: COORDINATE_SYSTEM.LNGLAT_OFFSETS}
    },
    _subLayerProps: {
      'tile-3d': {_subLayerProps: {mesh: {extensions: [I3S_MESH_EXTENSION]}}}
    }
  });
}
