// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Example} from './components/example-panel';

export const LOADERS_URI = 'https://raw.githubusercontent.com/visgl/loaders.gl/master';

export const INITIAL_CATEGORY_NAME = 'WMS';
export const INITIAL_EXAMPLE_NAME = 'OpenStreetMap WMS (Terrestris)';

export const EXAMPLES: Record<string, Record<string, Example>> = {
  WMS: {
    'OpenStreetMap WMS (Terrestris)': {
      // const imageUrl = 'https://ows.terrestris.de/osm/service?width={width}&height={height}&bbox={bounds[0]},{bounds[1]},{bounds[2]},{bounds[3]}&srs=EPSG:4326&format=image%2Fpng&request=GetMap&service=WMS&styles=&transparent=TRUE&version=1.1.1&layers=OSM-WMS';
      // TODO: change in the URL 'srs=EPSG:4326' to 'srs=EPSG:900913'
      // once we can change the TileLayer bounds from lat/lon to web mercator coordinates
      type: 'wms',
      url: 'https://ows.terrestris.de/osm/service',
      description: 'OpenStreetMap rendered, updated weekly, covering the entire globe. Copyright OpenStreetMap.',
      layers: ['OSM-WMS'],
      viewState: {}
    },
    'NOAA Composite Reflectivity WMS': {
      type: 'wms',
      url: 'https://opengeo.ncep.noaa.gov/geoserver/conus/conus_cref_qcd/ows',
      description: 'Radar precipitation data covering the contiguous US. Quality Controlled 1km x 1km CONUS Radar Composite Reflectivity. This data is provided Multi-Radar-Multi-Sensor (MRMS) algorithm.',
      layers: ['conus_cref_qcd'],
      viewState: {}
    },
    'NASA Global Imagery Browse Services for EOSDIS': {
      type: 'wms',
      url: 'https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi',
      description: 'Over 1,000 NASA satellite imagery products, covering every part of the world. Most imagery is updated daily—available within a few hours after satellite observation, and some products span almost 30 years.',
      layers: ['Lightning'],
      viewState: {zoom: 3}
    },
    '3DEP Elevation Index': {
      type: 'wms',
      url: 'https://index.nationalmap.gov/arcgis/services/3DEPElevationIndex/MapServer/WMSServer',
      layers: ['23'], 
      viewState: {longitude: -100, latitude: 55, zoom: 3},
      layerProps: {
        opacity: 0.5
      }
    },
    'NASA': {
      type: 'wms',
      url: 'https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi',
      layers: ['Land Cover'], 
      viewState: {longitude: -100, latitude: 55, zoom: 3},
      layerProps: {
        opacity: 0.5
      }
    },
    
    /*
    'Canadian Weather': {
      type: 'wms',
      url: 'https://geo.weather.gc.ca/geomet',
      layers: ['GDPS.ETA_TT'], // 'RDPS.CONV_KINDEX.PT3H'],
      viewState: {longitude: -100, latitude: 55, zoom: 3},
      opacity: 0.5
    },
    'Deutscher Wetterdienst': {
      type: 'wms',
      url: 'https://maps.dwd.de/geoserver/dwd/wms',
      layers: ['Cwam_reg025_fd_sl_DD10M'],
      viewState: {longitude: 16, latitude: 54, zoom: 3.6},
      opacity: 0.5
    },
    */
    'Trigger Error (No Layer)': {
      type: 'wms',
      url: 'https://geo.weather.gc.ca/geomet',
      layers: [],
      viewState: {longitude: -100, latitude: 55, zoom: 3}
    },
  },
  'ArcGIS Image Server': {
    'NLCD Land Cover 2001': {
      type: 'arcgis-image-server',
      url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/NLCDLandCover2001/ImageServer',
      description: 'ArcGIS sample imagery service rendered through loaders.gl ImageSourceLayer.',
      viewState: {longitude: -96, latitude: 38.5, zoom: 4},
      layerProps: {
        opacity: 0.75
      }
    },
  },
  'ArcGIS Feature Server': {
    'Kentucky Bicycle Routes FeatureServer': {
      type: 'arcgis-feature-server',
      url: 'https://services2.arcgis.com/CcI36Pduqd0OR4W9/ArcGIS/rest/services/Bicycle_Routes_Public/FeatureServer/0',
      description: 'ArcGIS FeatureServer viewport queries rendered through loaders.gl VectorSourceLayer.',
      layers: ['0'],
      viewState: {longitude: -85.75, latitude: 37.75, zoom: 6},
      layerProps: {
        pickable: true,
        stroked: true,
        filled: false,
        lineWidthMinPixels: 4,
        lineWidthMaxPixels: 8,
        getLineColor: [0, 80, 255, 220]
      }
    }
  },
  WFS: {
    'Redon Reuse Sites': {
      type: 'wfs',
      url: 'https://geobretagne.fr/geoserver/ows',
      description: 'GeoServer WFS features queried by viewport and rendered through loaders.gl VectorSourceLayer.',
      layers: ['caredon:acteur_reemploi_redon_agglo'],
      viewState: {longitude: -2.2, latitude: 47.65, zoom: 9},
      layerProps: {
        pickable: true,
        pointType: 'circle',
        stroked: true,
        filled: true,
        pointRadiusMinPixels: 14,
        pointRadiusMaxPixels: 22,
        getPointRadius: 10,
        lineWidthMinPixels: 3,
        lineWidthMaxPixels: 6,
        getLineColor: [255, 255, 255, 255],
        getFillColor: [220, 30, 30, 230]
      }
    }
  }
};
