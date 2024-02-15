import React, {useEffect, useState} from 'react';
import {createRoot} from 'react-dom/client';

import {Map} from 'react-map-gl';
import maplibregl from 'maplibre-gl';

import DeckGL from '@deck.gl/react';
import {ViewState, MapController, FlyToInterpolator} from '@deck.gl/core';

import {DataDrivenTile3DLayer} from '@deck.gl-community/layers';
import {
  BuildingSceneSublayer,
  COORDINATE_SYSTEM,
  I3SBuildingSceneLayerLoader,
  I3SLoader
} from '@loaders.gl/i3s';
import {fetchFile, load} from '@loaders.gl/core';
import {Sublayer, buildSublayersTree} from './helpers/sublayers';
import {Tileset3D} from '@loaders.gl/tiles';
import {BuildingExplorer} from './components/building-explorer';
import {filterTile} from '@deck.gl-community/layers';

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
  const [buildingLevels, setBuildingLevels] = useState<string | number>(['All']);
  const [filtersByAttribute, setFiltersByAttribute] = useState<{
    attributeName: string;
    value: number;
  } | null>(null);

  useEffect(() => {
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
    const getBSLStatisticsSummary = async (tilesetUrl: string): Promise<void> => {
      try {
        let dataResponse = await fetchFile(tilesetUrl);
        let data = JSON.parse(await dataResponse.text());
        if (data && data.statisticsHRef) {
          dataResponse = await fetchFile(tilesetUrl + '/' + data.statisticsHRef);
          data = JSON.parse(await dataResponse.text());
          if (data?.summary?.length > 0) {
            for (const attrStats of data?.summary) {
              if (attrStats.fieldName === 'BldgLevel') {
                const bldgLevels = attrStats.mostFrequentValues.sort();
                setBuildingLevels(['All', ...bldgLevels]);
                break;
              }
            }
          }
        }
      } catch (e) {
        //do nothing
      }
    };

    getFlattenedSublayers(TILESET_URL);
    getBSLStatisticsSummary(TILESET_URL);
  }, []);

  const onSelectHandler = (item: string) => {
    const itemValue = parseInt(item);
    if (item === 'All') {
      setFiltersByAttribute(null);
    } else if (!isNaN(itemValue)) {
      setFiltersByAttribute({attributeName: 'BldgLevel', value: itemValue});
    }
  };

  const onTilesetLoadHandler = (tileset: Tileset3D) => {
    if (needTransitionToTileset) {
      const {zoom, cartographicCenter} = tileset;
      const [longitude, latitude] = cartographicCenter || [];

      const newViewState = {
        ...viewState,
        zoom: zoom + 2,
        longitude,
        latitude,
        transitionDuration: TRANSITION_DURAITON,
        transitionInterpolator: new FlyToInterpolator()
      };
      setViewState(newViewState);
      setNeedTransitionToTileset(false);
    }
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
          new DataDrivenTile3DLayer({
            id: `tile-layer-${sublayer.id}`,
            data: sublayer.url,
            loader: I3SLoader,
            onTilesetLoad: onTilesetLoadHandler,
            loadOptions,
            filtersByAttribute,
            filterTile
          })
      );

    return layers;
  };

  return (
    <div style={{position: 'relative', height: '100%'}}>
      <DeckGL initialViewState={viewState} layers={renderLayers()} controller={MAP_CONTROLLER}>
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
          isShown
          sublayers={sublayers}
          buildingLevels={buildingLevels}
          onSelect={onSelectHandler}
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
