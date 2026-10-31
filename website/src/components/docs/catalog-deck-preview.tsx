import React, {useEffect, useId, useRef, useState} from 'react';
import type {Table} from 'apache-arrow';
import type {Deck} from '@deck.gl/core';
import type {DeckPanel} from '@deck.gl-community/widgets';
import {ExamplePanelHost} from './example-panel-host';

/** Renders a bounded GeoParquet sample in a DeckPanel using a shared Deck device. */
export function CatalogDeckPreview({table, bounds, overlay}: {table: Table; bounds?: number[]; overlay?: React.ReactNode}): React.JSX.Element {
  const root = useRef<HTMLCanvasElement>(null);
  const panelId = useId().replace(/:/g, '');
  const [panel, setPanel] = useState<DeckPanel>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    let cancelled = false;
    let deck: Deck<any> | undefined;
    setPanel(undefined);
    setError(undefined);
    void (async () => {
      try {
        const [{Deck, MapView, WebMercatorViewport}, {DeckPanel}, {GeoArrowLayer, getGeoArrowGeometryColumn}, {ScatterplotLayer}] = await Promise.all([
          import('@deck.gl/core'),
          import('@deck.gl-community/widgets'),
          import('@loaders.gl/deck-layers'),
          import('@deck.gl/layers')
        ]);
        if (cancelled || !root.current) return;
        let geometryColumn: string | undefined;
        try {
          geometryColumn = getGeoArrowGeometryColumn(table).geometryColumn;
        } catch {
          // Grid tables may instead store positions as longitude and latitude columns.
        }
        const longitudeField = table.schema.fields.find(field => /^(lon|longitude)$/i.test(field.name));
        const latitudeField = table.schema.fields.find(field => /^(lat|latitude)$/i.test(field.name));
        const longitudes = longitudeField && table.getChild(longitudeField.name);
        const latitudes = latitudeField && table.getChild(latitudeField.name);
        const points: Array<{position: [number, number]}> = [];
        if (!geometryColumn && longitudes && latitudes) {
          for (let index = 0; index < table.numRows; index++) {
            const longitude = longitudes.get(index);
            const latitude = latitudes.get(index);
            if (typeof longitude === 'number' && typeof latitude === 'number' && Number.isFinite(longitude) && Number.isFinite(latitude) && longitude >= -180 && longitude <= 180 && latitude >= -90 && latitude <= 90) points.push({position: [longitude, latitude]});
          }
        }
        if (!geometryColumn && !points.length) throw new Error('No supported geometry or longitude/latitude columns in this sample.');
        const canvas = root.current;
        const rootView = `${panelId}-root`;
        const view = `${panelId}-map`;
        let camera = {longitude: 0, latitude: 0, zoom: 1, bearing: 0, pitch: 0};
        if (bounds && bounds[0] < bounds[2] && bounds[1] < bounds[3] && bounds[1] > -85 && bounds[3] < 85) {
          const viewport = new WebMercatorViewport({width: 400, height: 300}).fitBounds([[bounds[0], bounds[1]], [bounds[2], bounds[3]]], {padding: 24});
          camera = {...camera, longitude: viewport.longitude, latitude: viewport.latitude, zoom: Math.min(viewport.zoom, 15)};
        }
        const scene = () => ({
          view: new MapView({id: view, controller: true}),
          viewState: camera,
          layers: [geometryColumn ? new GeoArrowLayer({
            id: `${panelId}-features`, data: table, geometryColumn,
            pointLayerProps: {getFillColor: [35, 145, 210, 180], radiusMinPixels: 3},
            pathLayerProps: {getColor: [255, 180, 40, 255], widthMinPixels: 1},
            solidPolygonLayerProps: {getFillColor: [35, 145, 210, 180]}, pickable: true
          }) : new ScatterplotLayer({id: `${panelId}-points`, data: points, getPosition: point => point.position, getFillColor: [35, 145, 210, 180], getRadius: 3, radiusUnits: 'pixels', pickable: true})],
          onViewStateChange: ({viewState}: any) => {
            camera = viewState;
            mapPanel.setProps({sceneProps: scene()});
          }
        });
        let mapPanel: DeckPanel;
        deck = new Deck({
          _canvases: [canvas],
          views: [new MapView({id: rootView, canvasId: canvas.id})],
          viewState: {[rootView]: camera}, layers: [],
          onLoad: () => {
            if (cancelled || !deck) return;
            mapPanel = new DeckPanel({id: `${panelId}-panel`, title: '', deck, sceneProps: scene(), height: 300});
            setPanel(mapPanel);
          },
          onError: (deckError: Error) => { if (!cancelled) setError(deckError.message); }
        });
      } catch (previewError) {
        if (!cancelled) setError(`Map preview unavailable: ${String(previewError)}`);
      }
    })();
    return () => { cancelled = true; deck?.finalize(); };
  }, [table, bounds, panelId]);

  return <div style={{position: 'relative'}}>
    <canvas ref={root} id={`${panelId}-canvas`} width={1} height={1} style={{position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none'}} />
    {error ? <p role="alert">{error}</p> : panel ? <ExamplePanelHost panel={panel} /> : <p role="status">Preparing map…</p>}
    {panel && overlay ? <div style={{position: 'absolute', top: 16, right: 12, zIndex: 2, padding: '4px 7px', borderRadius: 4, background: 'var(--ifm-background-color)', fontSize: 12}}>{overlay}</div> : null}
  </div>;
}
