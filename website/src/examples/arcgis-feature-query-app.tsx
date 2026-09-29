import React, {useEffect, useId, useRef, useState} from 'react';
import DeckGL from '@deck.gl/react';
import {GeoJsonLayer} from '@deck.gl/layers';
import {load} from '@loaders.gl/core';
import {ArcGISFeatureServerSourceLoader} from '@loaders.gl/arcgis';
import type {ArcGISFeatureQueryProgress} from '@loaders.gl/arcgis';
import type {Feature} from '@loaders.gl/schema';

/** Existing public gallery dataset; all records come from the live service. */
const SERVICE_URL = 'https://services2.arcgis.com/CcI36Pduqd0OR4W9/ArcGIS/rest/services/Bicycle_Routes_Public/FeatureServer/0';

/** Demonstrates progressive complete-query retrieval, explicit limits and cancellation. */
export default function ArcGISFeatureQueryApp(): React.ReactElement {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [progress, setProgress] = useState<ArcGISFeatureQueryProgress | null>(null);
  const [status, setStatus] = useState('Choose a filter and load the routes.');
  const [filter, setFilter] = useState('1=1');
  const [maximumFeatures, setMaximumFeatures] = useState(5000);
  const [loading, setLoading] = useState(false);
  const controllerReference = useRef<AbortController | null>(null);
  const controlsId = useId();
  useEffect(() => () => controllerReference.current?.abort(), []);

  /** Starts a fresh query, retaining already rendered pages if the user cancels. */
  async function loadFeatures() {
    controllerReference.current?.abort();
    const controller = new AbortController();
    controllerReference.current = controller;
    setFeatures([]); setProgress(null); setLoading(true); setStatus('Loading layer metadata and count…');
    try {
      const source = await load(SERVICE_URL, ArcGISFeatureServerSourceLoader);
      const collected: Feature[] = [];
      for await (const page of source.queryFeaturePages({
        query: {where: filter}, pageSize: 100, maxFeatures: maximumFeatures,
        signal: controller.signal
      })) {
        collected.push(...page.data.features);
        setFeatures([...collected]);
        setProgress(page);
        setStatus(page.complete ? 'Complete for this query at retrieval time.' :
          page.reason === 'loading' ? 'Loading more routes…' :
            `Partial result: ${page.reason === 'feature-limit' ? 'the chosen record limit was reached' : 'the service could not establish completeness'}.`);
      }
    } catch (error) {
      if (controllerReference.current !== controller) return;
      setStatus(controller.signal.aborted ? 'Cancelled. Visible routes are a partial result.' :
        `Unable to complete the query: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      if (controllerReference.current === controller) setLoading(false);
    }
  }

  return (
    <section aria-label="Progressive ArcGIS feature query" style={{height: '100%', display: 'flex', flexDirection: 'column', background: '#f4f7fb', color: '#172842'}}>
      <div style={{padding: '12px 16px'}}>
        <strong>Kentucky bicycle routes · live ArcGIS features</strong>
        <div style={{display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8, alignItems: 'center'}}>
          <label htmlFor={`${controlsId}-filter`}>Filter</label>
          <input id={`${controlsId}-filter`} aria-label="ArcGIS SQL filter" value={filter} onChange={event => setFilter(event.target.value)} style={{width: 140}} />
          <label htmlFor={`${controlsId}-limit`}>Record limit</label>
          <select id={`${controlsId}-limit`} value={maximumFeatures} onChange={event => setMaximumFeatures(Number(event.target.value))}>
            <option value={100}>100</option><option value={5000}>5,000</option><option value={20000}>20,000</option>
          </select>
          <button type="button" onClick={() => void loadFeatures()}>{loading ? 'Restart query' : 'Load routes'}</button>
          <button type="button" disabled={!loading} onClick={() => controllerReference.current?.abort()}>Cancel</button>
        </div>
        <div role="status" aria-live="polite" style={{marginTop: 8}}>
          {progress ? `${progress.loaded.toLocaleString()} / ${progress.expectedCount?.toLocaleString()} records · ${progress.pages} pages. ` : ''}{status}
        </div>
      </div>
      <div style={{position: 'relative', flex: 1, minHeight: 220, background: '#152b46'}}>
        <DeckGL initialViewState={{longitude: -85.75, latitude: 37.75, zoom: 6}} controller
          layers={[new GeoJsonLayer({id: 'arcgis-query-routes', data: features, pickable: true,
            getLineColor: [87, 224, 194], lineWidthMinPixels: 3,
            getFillColor: [87, 224, 194, 150], pointRadiusMinPixels: 4})]}
          getTooltip={({object}) => object ? {text: Object.entries(object.properties || {}).slice(0, 5).map(([name, value]) => `${name}: ${value}`).join('\n')} : null}
        />
      </div>
      <small style={{padding: '8px 16px'}}>Source: Kentucky Bicycle Routes Public, hosted on ArcGIS. Counts can change while loading. Pan, zoom, or hover over a route. No simulated fallback.</small>
    </section>
  );
}
