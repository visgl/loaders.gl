// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import React, {useEffect, useRef, useState} from 'react';
import type {DeckProps, MapViewState} from '@deck.gl/core';
import type MapView from '@arcgis/core/views/MapView.js';
import type ArcGISMapInstance from '@arcgis/core/Map.js';
import '@arcgis/core/assets/esri/themes/light/main.css';

/** Camera values shared with deck.gl; this host renders a two-dimensional map. */
export type ArcGISMapViewState = Pick<MapViewState, 'longitude' | 'latitude' | 'zoom'> &
  Partial<Pick<MapViewState, 'bearing' | 'minZoom' | 'maxZoom'>>;

/** Application-owned ArcGIS map and deck.gl overlay configuration. */
type ArcGISMapProperties = {
  /** Source or visualization layers rendered through DeckLayer. */
  layers: DeckProps['layers'];
  /** Requested camera, in deck.gl's 512-pixel Web Mercator zoom convention. */
  viewState: ArcGISMapViewState;
  /** Whether the public Esri light gray basemap and reference labels are visible. */
  showBasemap?: boolean;
  /** Position of native zoom and fullscreen controls, away from application panels. */
  controlPosition?: 'top-left' | 'top-right';
  /** Application tooltip callback forwarded to deck.gl. */
  getTooltip?: DeckProps['getTooltip'];
  /** Receives completed user navigation, without controlling every animation frame. */
  onViewStateChange?: (viewState: ArcGISMapViewState & {pitch: number}) => void;
  /** Receives SDK initialization, navigation and deck.gl rendering failures. */
  onError?: (error: Error) => void;
};

/** ArcGIS layer with the public deck.gl properties accessor. */
type ArcGISDeckLayer = __esri.Layer & {
  /** Properties forwarded to the deck.gl renderer. */
  deck: {
    /** Updates overlays and callbacks without recreating the MapView. */
    set(properties: Pick<DeckProps, 'layers' | 'getTooltip' | 'onError'>): void;
  };
};

/** Hosts loaders.gl overlays in an ArcGIS MapView using @deck.gl/arcgis. */
export default function ArcGISMap(properties: ArcGISMapProperties): React.ReactElement {
  const containerReference = useRef<HTMLDivElement | null>(null);
  const viewReference = useRef<MapView | null>(null);
  const layerReference = useRef<ArcGISDeckLayer | null>(null);
  const propertiesReference = useRef(properties);
  propertiesReference.current = properties;
  const [message, setMessage] = useState<string | null>('Loading ArcGIS basemap…');

  useEffect(() => {
    let disposed = false;
    let view: MapView | null = null;
    let map: ArcGISMapInstance | null = null;
    let navigationHandle: {remove(): void} | null = null;
    let fullscreen: __esri.Fullscreen | null = null;

    /** Loads the browser SDK after mount so server rendering never initializes ArcGIS. */
    async function initializeMap() {
      try {
        const [mapModule, viewModule, tileModule, reactiveUtils, fullscreenModule, deckModule] =
          await Promise.all([
            import('@arcgis/core/Map.js'),
            import('@arcgis/core/views/MapView.js'),
            import('@arcgis/core/layers/support/TileInfo.js'),
            import('@arcgis/core/core/reactiveUtils.js'),
            import('@arcgis/core/widgets/Fullscreen.js'),
            import('@deck.gl/arcgis')
          ]);
        const container = containerReference.current;
        if (disposed || !container) return;
        const configuration = propertiesReference.current;
        const layer = new deckModule.DeckLayer({
          title: 'loaders.gl visualization'
        }) as ArcGISDeckLayer;
        layerReference.current = layer;
        applyDeckProps(layer, configuration);
        map = new mapModule.default({basemap: 'gray-vector', layers: [layer]});
        view = new viewModule.default({
          container,
          map,
          center: [configuration.viewState.longitude, configuration.viewState.latitude],
          zoom: Math.floor(configuration.viewState.zoom),
          rotation: -(configuration.viewState.bearing || 0),
          spatialReference: {wkid: 3857},
          // Explicit 512-pixel LODs match DeckLayer's feature tiling scheme, including when hidden.
          constraints: {
            lods: tileModule.default.create({size: 512, numLODs: 24}).lods,
            snapToZoom: true,
            minZoom: configuration.viewState.minZoom ?? 0,
            maxZoom: configuration.viewState.maxZoom ?? 20
          },
          ui: {components: ['zoom', 'attribution']}
        });
        viewReference.current = view;
        await view.when();
        if (disposed) return;
        applyDeckProps(layer, propertiesReference.current);
        applyBasemapVisibility(map, propertiesReference.current.showBasemap !== false);
        synchronizeCamera(view, propertiesReference.current);
        const position = configuration.controlPosition || 'top-right';
        view.ui.move('zoom', position);
        fullscreen = new fullscreenModule.default({view, element: container.parentElement});
        view.ui.add(fullscreen, position);
        const activeView = view;
        navigationHandle = reactiveUtils.watch(
          () => activeView.stationary,
          stationary => {
            const {longitude, latitude} = activeView.center;
            if (!stationary || longitude == null || latitude == null) return;
            propertiesReference.current.onViewStateChange?.({
              longitude,
              latitude,
              zoom: activeView.zoom,
              bearing: -activeView.rotation,
              pitch: 0
            });
          }
        );
        setMessage(null);
      } catch (error) {
        if (disposed) return;
        const failure = error instanceof Error ? error : new Error(String(error));
        setMessage(`Unable to load the ArcGIS map: ${failure.message}`);
        propertiesReference.current.onError?.(failure);
      }
    }

    void initializeMap();
    return () => {
      disposed = true;
      navigationHandle?.remove();
      fullscreen?.destroy();
      if (view) view.map = null;
      view?.destroy();
      map?.destroy();
      viewReference.current = null;
      layerReference.current = null;
    };
  }, []);

  useEffect(() => {
    const layer = layerReference.current;
    if (layer) applyDeckProps(layer, properties);
  }, [properties.layers, properties.getTooltip, properties.onError]);

  useEffect(() => {
    const view = viewReference.current;
    if (view?.map) applyBasemapVisibility(view.map, properties.showBasemap !== false);
  }, [properties.showBasemap]);

  useEffect(() => {
    const view = viewReference.current;
    if (view?.ready) synchronizeCamera(view, propertiesReference.current);
  }, [
    properties.viewState.longitude,
    properties.viewState.latitude,
    properties.viewState.zoom,
    properties.viewState.bearing
  ]);

  return (
    <>
      <div
        ref={containerReference}
        aria-label="ArcGIS basemap and deck.gl visualization"
        style={{position: 'absolute', inset: 0, background: '#edf0f2'}}
      />
      {message && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'absolute',
            bottom: 40,
            left: 12,
            right: 12,
            zIndex: 1,
            padding: 8,
            background: 'rgba(255,255,255,0.94)',
            color: '#172842',
            pointerEvents: 'none'
          }}
        >
          {message}
        </div>
      )}
    </>
  );
}

/** Updates deck.gl rendering properties through the integration's public accessor. */
function applyDeckProps(layer: ArcGISDeckLayer, properties: ArcGISMapProperties): void {
  layer.deck.set({
    layers: properties.layers,
    getTooltip: properties.getTooltip,
    onError: properties.onError
  });
}

/** Hides both basemap geometry and labels while preserving its LODs and attribution widget. */
function applyBasemapVisibility(map: ArcGISMapInstance, visible: boolean): void {
  map.basemap?.baseLayers.forEach(layer => {
    layer.visible = visible;
  });
  map.basemap?.referenceLayers.forEach(layer => {
    layer.visible = visible;
  });
}

/** Applies explicit camera requests without resetting the view on layer or status changes. */
function synchronizeCamera(view: MapView, properties: ArcGISMapProperties): void {
  const {longitude, latitude, zoom, bearing = 0} = properties.viewState;
  // Integer levels keep programmatic fits inside the supported DeckLayer/MapView LOD alignment.
  const targetZoom = Math.floor(zoom);
  const {longitude: currentLongitude, latitude: currentLatitude} = view.center;
  if (
    currentLongitude != null &&
    currentLatitude != null &&
    Math.abs(currentLongitude - longitude) < 1e-7 &&
    Math.abs(currentLatitude - latitude) < 1e-7 &&
    Math.abs(view.zoom - targetZoom) < 1e-7 &&
    Math.abs(view.rotation + bearing) < 1e-7
  )
    return;
  void view
    .goTo({center: [longitude, latitude], zoom: targetZoom, rotation: -bearing}, {animate: false})
    .catch(error => {
      if (error?.name !== 'AbortError') properties.onError?.(error);
    });
}
