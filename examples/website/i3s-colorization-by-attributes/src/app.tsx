import React, {useEffect, useState} from 'react';
import {createRoot} from 'react-dom/client';

import {Map} from 'react-map-gl';
import maplibregl from 'maplibre-gl';

import DeckGL from '@deck.gl/react';
import {ViewState, FlyToInterpolator} from '@deck.gl/core';

import {DataDrivenTile3DLayer, colorizeTile} from '@deck.gl-community/layers';

import {COORDINATE_SYSTEM, I3SLoader} from '@loaders.gl/i3s';
import {Tileset3D} from '@loaders.gl/tiles';
import {ControlPanel} from './components/control-panel';
import {AttributeData, ColorsByAttribute} from './types';
import {ColorizationPanel} from './components/colorization-panel';
import {
  COLORIZE_MODES,
  COLORS_BY_ATTRIBUTE,
  EXAMPLES,
  INITIAL_VIEW_STATE,
  MAP_CONTROLLER,
  TRANSITION_DURAITON
} from './constants';
import {getNumericAttributeInfo} from './utils/fetch-attributes-data';

export default function App() {
  const tileSets: string[] = Object.keys(EXAMPLES);
  const [tilesetSelected, setTilesetSelected] = useState<string>(tileSets[0]);
  const [viewState, setViewState] = useState<ViewState>(INITIAL_VIEW_STATE);
  const [attributesObject, setAttributesObject] = useState<Record<string, AttributeData>>({});
  const [colorizeParams, setColorizeParams] = useState<{mode: string; attributeName: string}>({
    mode: COLORIZE_MODES[0],
    attributeName: ''
  });
  const [colorsByAttribute, setColorsByAttribute] = useState<ColorsByAttribute | null>(null);

  function onSelectTilesetHandler(item: string) {
    setTilesetSelected(item);
  }

  useEffect(() => {
    if (colorizeParams.mode !== 'none' && colorizeParams.attributeName !== '') {
      setColorsByAttribute({
        attributeName: colorizeParams.attributeName,
        minValue: attributesObject[colorizeParams.attributeName]?.min || 0,
        maxValue: attributesObject[colorizeParams.attributeName]?.max || 0,
        minColor: COLORS_BY_ATTRIBUTE.min.rgba,
        maxColor: COLORS_BY_ATTRIBUTE.max.rgba,
        mode: colorizeParams.mode
      });
    } else {
      setColorsByAttribute(null);
    }
  }, [colorizeParams]);

  function getAttributes(tileset: Tileset3D) {
    const promises: Promise<AttributeData | null>[] = [];
    for (const attribute of tileset.tileset?.statisticsInfo) {
      promises.push(
        getNumericAttributeInfo(tileset.tileset?.basePath, attribute.href, attribute.name)
      );
    }
    Promise.allSettled(promises).then((results) => {
      const attributes: Record<string, AttributeData> = {};
      for (const result of results) {
        if (result.status === 'fulfilled' && result.value && result.value.name) {
          attributes[result.value.name] = {min: result.value.min, max: result.value.max};
        }
      }
      if (Object.keys(attributes).length > 0) {
        setAttributesObject(attributes);
        setColorizeParams({...colorizeParams, attributeName: Object.keys(attributes)[0]});
      }
    });
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
    getAttributes(tileset);
  }

  function onColorizeModeSelectHandler(mode: string) {
    setColorizeParams({...colorizeParams, mode});
  }

  function onAttributeSelectHandler(attributeName: string) {
    setColorizeParams({...colorizeParams, attributeName});
  }

  function renderLayers() {
    const loadOptions = {i3s: {coordinateSystem: COORDINATE_SYSTEM.LNGLAT_OFFSETS}};
    const layers = new DataDrivenTile3DLayer({
      data: EXAMPLES[tilesetSelected].url,
      loader: I3SLoader,
      onTilesetLoad: onTilesetLoadHandler,
      loadOptions,
      colorsByAttribute,
      customizeColors: colorizeTile
    });

    return layers;
  }

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
      <ControlPanel tileSets={tileSets} onSelectTileset={onSelectTilesetHandler} />
      <ColorizationPanel
        colorizeModes={COLORIZE_MODES}
        colorizeAttributes={attributesObject}
        onSelectColorizeMode={onColorizeModeSelectHandler}
        onSelectAttribute={onAttributeSelectHandler}
      />
    </div>
  );
}

export function renderToDOM(container) {
  createRoot(container).render(<App />);
}
