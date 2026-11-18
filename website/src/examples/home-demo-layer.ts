import {SourceLayer} from '@loaders.gl/deck-layers';
import {COORDINATE_SYSTEM, I3SLoader} from '@loaders.gl/tiles-3d/i3s';

/** Creates the home page's I3S layer with its bundled content worker. */
export function createHomeDemoLayer(): SourceLayer {
  return new SourceLayer({
    data: 'https://tiles.arcgis.com/tiles/z2tnIkrLQ2BRzr6P/arcgis/rest/services/SanFrancisco_Bldgs/SceneServer/layers/0',
    loaders: [I3SLoader],
    loadOptions: {
      'i3s-content': {
        workerUrl: new URL(
          '../../../modules/tiles-3d/dist/i3s-content-worker.js',
          import.meta.url
        ).href
      },
      i3s: {coordinateSystem: COORDINATE_SYSTEM.LNGLAT_OFFSETS}
    }
  });
}
