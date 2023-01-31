/*
 * https://deck.gl/docs/api-reference/layers/bitmap-layer
 */
import {Deck} from '@deck.gl/core/typed';
import {BitmapLayer} from '@deck.gl/layers/typed';
import {ImageryLayer} from './imagery-layer';


let timeoutId;
const debounce = (fn, ms = 500) => {
  clearTimeout(timeoutId);
  timeoutId = setTimeout(() => fn(), ms);
};

const deckInstance = new Deck({
  initialViewState: {
    longitude: -122.4,
    latitude: 37.74,
    zoom: 9,
    minZoom: 3,
    maxZoom: 20,
    pitch: 0,
    bearing: 0
  },
  controller: true,
  layers: [
    new ImageryLayer({serviceUrl: 'https://ows.terrestris.de/osm/service'})
  ],

  // onLoad() {
  //   updateBitmapLayer(deckInstance, 'onload');
  // },

  // onViewStateChange({viewState}) {
  //   debounce(() => updateBitmapLayer(deckInstance, "onViewStateChange(debounce)"));
  //   return viewState;
  // },

  // onResize() {
  //   debounce(() => updateBitmapLayer(deckInstance, 'onResize(debounced)'));
  // }
});

// function updateBitmapLayer(deckInstance, reason) {
//   const viewports = deckInstance.getViewports();
//   if (viewports.length < 0) {
//     return;
//   }

//   const viewport = viewports[0];
//   const bounds = viewport.getBounds();
//   const { width, height } = viewport;

//   console.log(reason, {bounds, width, height});

//   // TODO: change in the URL `srs=EPSG:4326` to `srs=EPSG:900913` 
//   // once we can change the TileLayer bounds from lat/lon to web mercator coordinates
//   // const imageUrl = `https://ows.terrestris.de/osm/service?width=${width}&height=${height}&bbox=${bounds[0]},${bounds[1]},${bounds[2]},${bounds[3]}&srs=EPSG:4326&format=image%2Fpng&request=GetMap&service=WMS&styles=&transparent=TRUE&version=1.1.1&layers=OSM-WMS`;
//   const imageUrl = wmsService ? wmsService.getMapURL({width, height, bbox: bounds, layers: 'OSM-WMS'}) : url;

//   const layer = new BitmapLayer({
//     id: "WMSImageryLayer",
//     bounds: bounds,
//     image: imageUrl,
//     opacity: 0.5
//   });

//   // deckInstance.setProps({ layers: [layer] });
// }
