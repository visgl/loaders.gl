import {GeoPackageLoader} from '@loaders.gl/geopackage';
import {FlatGeobufWorkerLoader} from '@loaders.gl/flatgeobuf';

  
export const INITIAL_EXAMPLE_NAME = 'Vancouver';

export const INITIAL_MAP_STYLE = 'https://basemaps.cartocdn.com/gl/positron-nolabels-gl-style/style.json';


export const LOADERS = {
  'GeoPackage': GeoPackageLoader,
  'FlatGeobuf': FlatGeobufWorkerLoader
}

export const EXAMPLES = {
  GeoPackage: {
    'Vancouver': {
        data: 'https://raw.githubusercontent.com/visgl/deck.gl-data/master/examples/geojson/vancouver-blocks.json'
      }
  },
  FlatGeobuf: {
    'Vancouver': {
      data: 'https://raw.githubusercontent.com/visgl/deck.gl-data/master/examples/geojson/vancouver-blocks.json'
    }
  }
}