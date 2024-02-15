import React, {useEffect, useState} from 'react';
import {createRoot} from 'react-dom/client';

import {Map} from 'react-map-gl';
import maplibregl from 'maplibre-gl';

import DeckGL from '@deck.gl/react';
import {ViewState, MapController, FlyToInterpolator, PickingInfo} from '@deck.gl/core';

import {Tile3DLayer} from '@deck.gl/geo-layers';
import {COORDINATE_SYSTEM, I3SLoader, loadFeatureAttributes} from '@loaders.gl/i3s';
import {Tileset3D} from '@loaders.gl/tiles';
import {ControlPanel} from './components/control-panel';
import AttributesPanel from './components/attributes-panel';

export const EXAMPLES = {
  'San Francisco': {
    name: 'San Francisco',
    url: 'https://tiles.arcgis.com/tiles/z2tnIkrLQ2BRzr6P/arcgis/rest/services/SanFrancisco_Bldgs/SceneServer/layers/0'
  },
  'New York': {
    name: 'New York',
    url: 'https://tiles.arcgis.com/tiles/P3ePLMYs2RVChkJx/arcgis/rest/services/Buildings_NewYork_17/SceneServer/layers/0'
  }
};

export const TRANSITION_DURAITON = 4000;

const MAP_CONTROLLER = {
  type: MapController,
  maxPitch: 60,
  inertia: true,
  scrollZoom: {speed: 0.01, smooth: true},
  touchRotate: true,
  dragMode: false
};

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
  const tileSets: string[] = Object.keys(EXAMPLES);
  const [tilesetSelected, setTilesetSelected] = useState<string>(EXAMPLES['San Francisco'].url);
  const [viewState, setViewState] = useState<ViewState>(INITIAL_VIEW_STATE);
  const [flattenedSublayers, setFlattenedSublayers] = useState<
    {url: string; visibility: boolean}[]
  >([]);
  const [highlightedObjectIndex, setHighlightedObjectIndex] = useState<number>(-1);
  const [attributesObject, setAttributesObject] = useState(null);

  useEffect(() => {
    setFlattenedSublayers([{url: tilesetSelected, visibility: true}]);
  }, [tilesetSelected]);

  function onSelectTilesetHandler(item: string) {
    setTilesetSelected(EXAMPLES[item]?.url);
  }

  function onTilesetLoadHandler(tileset: Tileset3D) {
    const {zoom, cartographicCenter} = tileset;
    const [longitude, latitude] = cartographicCenter || [];
    const newViewState = {
      ...INITIAL_VIEW_STATE,
      zoom: zoom + 2,
      longitude,
      latitude,
      transitionDuration: TRANSITION_DURAITON,
      transitionInterpolator: new FlyToInterpolator()
    };
    setViewState(newViewState);
    handleCloseAttributesPanel();
  }

  function handleCloseAttributesPanel() {
    setHighlightedObjectIndex(-1);
    setAttributesObject(null);
  }

  function onClickHandler(info: PickingInfo) {
    if (!info.object || info.index < 0 || !info.layer) {
      setAttributesObject({});
      handleCloseAttributesPanel();
      return;
    }
    setHighlightedObjectIndex(info.index);
    loadFeatureAttributes(info.object, info.index).then((result) => {
      setAttributesObject(result);
    });
  }

  function renderLayers() {
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
            loadOptions,
            pickable: true,
            highlightedObjectIndex
          })
      );
    return layers;
  }

  function renderAttributesPanel() {
    const title = attributesObject?.NAME || attributesObject?.OBJECTID;
    return (
      <AttributesPanel
        title={title}
        attributesObject={attributesObject}
        handleClosePanel={handleCloseAttributesPanel}
        isControlPanelShown
      />
    );
  }

  return (
    <div style={{position: 'relative', height: '100%'}}>
      <DeckGL
        initialViewState={viewState}
        layers={renderLayers()}
        controller={MAP_CONTROLLER}
        onClick={onClickHandler}
      >
        <Map
          reuseMaps
          mapLib={maplibregl}
          mapStyle={'https://basemaps.cartocdn.com/gl/dark-matter-nolabels-gl-style/style.json'}
          preventStyleDiffing
          preserveDrawingBuffer
        />
      </DeckGL>
      <ControlPanel tileSets={tileSets} onSelectTileset={onSelectTilesetHandler} />
      {highlightedObjectIndex > -1 && renderAttributesPanel()}
    </div>
  );
}

export function renderToDOM(container) {
  createRoot(container).render(<App />);
}
