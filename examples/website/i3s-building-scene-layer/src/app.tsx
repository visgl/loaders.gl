import React, {useEffect, useState} from 'react';
import {createRoot} from 'react-dom/client';

import {Map} from 'react-map-gl';
import maplibregl from 'maplibre-gl';

import DeckGL from '@deck.gl/react';
import {
  ViewState,
  MapController,
  FlyToInterpolator,
  MapView,
  WebMercatorViewport
} from '@deck.gl/core';

import {Tile3DLayer} from '@deck.gl/geo-layers';
import {
  BuildingSceneSublayer,
  COORDINATE_SYSTEM,
  I3SBuildingSceneLayerLoader,
  I3SLoader
} from '@loaders.gl/i3s';
import {load} from '@loaders.gl/core';
import {Sublayer, buildSublayersTree} from './helpers/sublayers';
import {Tileset3D} from '@loaders.gl/tiles';
import {getLonLatWithElevationOffset} from './utils/elevation-utils';
import {BuildingExplorer} from './components/building-explorer';

const TILESET_URL =
  'https://tiles.arcgis.com/tiles/cFEFS0EWrhfDeVw9/arcgis/rest/services/Turanga_Library/SceneServer/layers/0';

export const TRANSITION_DURAITON = 4000;

const MAP_CONTROLLER = {
  type: MapController,
  maxPitch: 60,
  inertia: true,
  scrollZoom: {speed: 0.01, smooth: true},
  touchRotate: true,
  dragMode: false
};

const MAIN_VIEW = new MapView({
  id: 'main',
  controller: {
    inertia: true
  },
  farZMultiplier: 2.02
});

const INITIAL_VIEW_STATE = {
  longitude: -120,
  latitude: 34,
  pitch: 45,
  maxPitch: 90,
  bearing: 0,
  minZoom: 2,
  maxZoom: 30,
  zoom: 14.5
};

export default function App() {
  const [viewState, setViewState] = useState<ViewState>(INITIAL_VIEW_STATE);
  const [flattenedSublayers, setFlattenedSublayers] = useState<BuildingSceneSublayer[]>([]);
  const [sublayers, setSublayers] = useState<Sublayer[]>([]);
  const [needTransitionToTileset, setNeedTransitionToTileset] = useState<boolean>(true);
  let currentViewport: WebMercatorViewport = null;

  useEffect(() => {
    /**
     * Tries to get Building Scene Layer sublayer urls if exists.
     * @param {string} tilesetUrl
     */
    const getFlattenedSublayers = async (tilesetUrl: string): Promise<void> => {
      try {
        const tileset = await load(tilesetUrl, I3SBuildingSceneLayerLoader);
        const sublayersTree = buildSublayersTree(tileset.header.sublayers);
        const childSublayers = sublayersTree?.sublayers || [];
        for (const sublayer of childSublayers) {
          sublayer.visibility = true;
        }
        setSublayers(childSublayers);
        const sublayers = tileset?.sublayers.filter((sublayer) => sublayer.name !== 'Overview');
        setFlattenedSublayers(sublayers);
      } catch (e) {
        setFlattenedSublayers([{url: tilesetUrl, visibility: true} as BuildingSceneSublayer]);
      }
    };
    getFlattenedSublayers(TILESET_URL);
  }, []);

  const onTilesetLoadHandler = (tileset: Tileset3D) => {
    if (needTransitionToTileset) {
      const {zoom, cartographicCenter} = tileset;
      const [longitude, latitude] = cartographicCenter || [];
      const viewport = currentViewport;
      const {pitch, bearing} = viewState;
      const [pLongitude, pLatitude] = getLonLatWithElevationOffset(
        0,
        pitch,
        bearing,
        longitude,
        latitude,
        viewport
      );

      const newViewState = {
        ...viewState,
        zoom: zoom + 2,
        longitude: pLongitude,
        latitude: pLatitude,
        transitionDuration: TRANSITION_DURAITON,
        transitionInterpolator: new FlyToInterpolator()
      };
      setViewState(newViewState);
      setNeedTransitionToTileset(false);
    }
  };

  const onViewStateChangeHandler = ({viewState}) => {
    setViewState(viewState);
  };

  const updateSublayerVisibility = (sublayer: Sublayer) => {
    if (sublayer.layerType === '3DObject') {
      const flattenedSublayer = flattenedSublayers.find(
        (fSublayer) => fSublayer.id === sublayer.id
      );
      if (flattenedSublayer) {
        flattenedSublayer.visibility = sublayer.visibility;
        setFlattenedSublayers([...flattenedSublayers]);
      }
    } else if (sublayer.layerType === 'group') {
      const sublayerGroup = sublayers.find((gSublayer) => gSublayer.id === sublayer.id);
      if (sublayerGroup) {
        sublayerGroup.expanded = sublayer.expanded;
        setSublayers([...sublayers]);
      }
    }
  };

  const renderLayers = () => {
    const loadOptions = {i3s: {coordinateSystem: COORDINATE_SYSTEM.LNGLAT_OFFSETS}};

    const layers = flattenedSublayers
      .filter((sublayer) => sublayer.visibility)
      .map(
        (sublayer) =>
          new Tile3DLayer({
            id: `tile-layer-${sublayer.id}`,
            data: sublayer.url,
            loader: I3SLoader,
            onTilesetLoad: onTilesetLoadHandler,
            //onTileLoad: () => this._updateStatWidgets(),
            //onTileUnload: () => this._updateStatWidgets(),
            loadOptions
          })
      );

    return layers;
  };

  return (
    <div style={{position: 'relative', height: '100%'}}>
      <DeckGL
        layers={renderLayers()}
        viewState={viewState}
        views={[MAIN_VIEW]}
        onViewStateChange={onViewStateChangeHandler}
        controller={MAP_CONTROLLER}
        glOptions={{
          preserveDrawingBuffer: true
        }}
      >
        {({viewport}) => {
          currentViewport = viewport;
        }}

        <Map
          reuseMaps
          mapLib={maplibregl}
          mapStyle={'https://basemaps.cartocdn.com/gl/dark-matter-nolabels-gl-style/style.json'}
          preventStyleDiffing
          preserveDrawingBuffer
        />
      </DeckGL>
      {sublayers?.length ? (
        <BuildingExplorer
          sublayers={sublayers}
          isShown
          onUpdateSublayerVisibility={updateSublayerVisibility}
        />
      ) : null}
      <div
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          background: 'rgba(0,0,0,0.3)',
          color: 'white',
          padding: 7
        }}
      >
        Advanced I3S BSL example available at{' '}
        <a
          style={{color: 'white', textDecoration: 'underline'}}
          href="https://i3s.loaders.gl/viewer?tileset=turanga-library"
        >
          I3S Explorer
        </a>
      </div>
    </div>
  );
}

export function renderToDOM(container) {
  createRoot(container).render(<App />);
}
