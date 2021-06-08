/* global mapboxgl */ // Imported via <script> tag
import Mapbox3DTilesLayer from './mapbox-3d-tiles-layer/mapbox-3d-tiles-layer';

// TODO - Add your mapbox token here
mapboxgl.accessToken = process.env.MapboxAccessToken; // eslint-disable-line

const BASE_TILESET_URL = 'https://raw.githubusercontent.com/uber-common/deck.gl-data/master';
const ROTTERDAM_TILESET_URL = `${BASE_TILESET_URL}/3d-tiles/geodan/rotterdam/tileset.json`;
const AHN_TILESET_URL = `${BASE_TILESET_URL}/3d-tiles/geodan/ahn/tileset.json`;

// Load the mapbox map
const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/dark-v10?optimize=true',
  center: [4.48732, 51.90217],
  zoom: 14.3,
  bearing: 0,
  pitch: 45,
  hash: true
});

map.on('style.load', function () {
  const rotterdam = new Mapbox3DTilesLayer({
    id: 'rotterdam',
    url: ROTTERDAM_TILESET_URL,
    color: 0x0033aa,
    opacity: 0.5
  });
  map.addLayer(rotterdam, 'waterway-label');

  const ahn = new Mapbox3DTilesLayer({
    id: 'ahn',
    url: AHN_TILESET_URL,
    color: 0x007722,
    opacity: 1.0,
    pointsize: 1.0
  });
  map.addLayer(ahn, 'rotterdam');
});
