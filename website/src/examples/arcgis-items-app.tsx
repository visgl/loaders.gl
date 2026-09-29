import React, {useEffect, useId, useRef, useState} from 'react';
import DeckGL from '@deck.gl/react';
import {GeoJsonLayer} from '@deck.gl/layers';
import {WebMercatorViewport} from '@deck.gl/core';
import {ArcGISIdentityManager} from '@esri/arcgis-rest-request';
import {load} from '@loaders.gl/core';
import {ArcGISFeatureServerSourceLoader} from '@loaders.gl/arcgis';
import {resolveArcGISItem} from '@loaders.gl/arcgis/items';
import type {ArcGISItemResolution} from '@loaders.gl/arcgis/items';
import {createArcGISCredential} from '@loaders.gl/arcgis/authentication';
import {createAuthenticatedFetch} from '@loaders.gl/loader-utils';
import type {Feature} from '@loaders.gl/schema';

/** Non-secret OAuth configuration survives only the redirect; tokens stay in memory. */
const CONFIGURATION_KEY = 'loaders-arcgis-oauth-configuration';
const PUBLIC_ITEM = '1bc3536f33374363b828e709b6f73597';

/** Resolves public/private service items and displays explicitly selected feature layers. */
export default function ArcGISItemsApp(): React.ReactElement {
  const [portal, setPortal] = useState('https://www.arcgis.com/sharing/rest');
  const [clientId, setClientId] = useState('');
  const [origins, setOrigins] = useState('https://www.arcgis.com, https://services2.arcgis.com');
  const [input, setInput] = useState(PUBLIC_ITEM);
  const [filter, setFilter] = useState('1=1');
  const [resolution, setResolution] = useState<ArcGISItemResolution | null>(null);
  const [selection, setSelection] = useState('');
  const [features, setFeatures] = useState<Feature[]>([]);
  const [viewState, setViewState] = useState({longitude: -85.75, latitude: 37.75, zoom: 6});
  const [session, setSession] = useState<ArcGISIdentityManager | null>(null);
  const [status, setStatus] = useState('Try the public item, or configure your own sign-in.');
  const [busy, setBusy] = useState(false);
  const controllerReference = useRef<AbortController | null>(null);
  const completedReference = useRef(false);
  const controlsId = useId();

  useEffect(() => {
    const parameters = new URLSearchParams(window.location.search);
    if (!completedReference.current && (parameters.has('code') || parameters.has('error'))) {
      completedReference.current = true;
      const configuration = sessionStorage.getItem(CONFIGURATION_KEY);
      if (configuration) {
        const saved = JSON.parse(configuration);
        setPortal(saved.portal); setClientId(saved.clientId); setOrigins(saved.origins); setInput(saved.input);
        setBusy(true); setStatus('Completing sign-in…');
        void ArcGISIdentityManager.completeOAuth2({...saved, popup: false, pkce: true}).then(identity => {
          setSession(identity); setStatus('Signed in. Resolve an item to choose a layer.');
        }).catch(() => setStatus('Sign-in failed. Check the registered redirect URL and portal configuration.')).finally(() => {
          sessionStorage.removeItem(CONFIGURATION_KEY);
          window.history.replaceState(null, '', window.location.pathname);
          setBusy(false);
        });
      }
    }
    return () => controllerReference.current?.abort();
  }, []);

  /** Starts Esri's browser PKCE flow using the current page as the registered callback. */
  async function signIn() {
    try {
      const configuration = {clientId, portal, redirectUri: `${window.location.origin}${window.location.pathname}`, origins, input};
      sessionStorage.setItem(CONFIGURATION_KEY, JSON.stringify(configuration));
      await ArcGISIdentityManager.beginOAuth2({...configuration, popup: false, pkce: true});
    } catch {
      setStatus('Unable to start sign-in. Check the client ID, portal and browser settings.');
    }
  }

  /** Creates one credential per explicitly trusted origin so server tokens are not shared. */
  function createTransport() {
    return createAuthenticatedFetch({credentials: session ? origins.split(',').map(origin => createArcGISCredential({
      origins: [origin.trim()], token: async ({url, reason}) => {
        if (reason === 'refresh') await session.refreshCredentials();
        return session.getToken(url);
      }
    })) : []});
  }

  /** Resolves the item and, on demand, loads a bounded feature query into deck.gl. */
  async function loadItem(display: boolean) {
    controllerReference.current?.abort();
    const controller = new AbortController(); controllerReference.current = controller;
    setBusy(true); setFeatures([]); setStatus(display ? 'Loading selected layer…' : 'Resolving portal item…');
    if (!display) { setResolution(null); setSelection(''); }
    try {
      const transport = createTransport();
      const item = await resolveArcGISItem(input, {portalUrl: portal, fetch: transport, signal: controller.signal,
        ...(display ? {layerId: selection === 'root' ? null : Number(selection)} : {})});
      if (controller.signal.aborted) return;
      setResolution(item);
      if (!display) { setStatus('Choose a layer or table. Root services and scenes can be inspected here; this map displays feature queries.'); return; }
      const selected = item.selectedLayer!;
      if (!/\/(FeatureServer|MapServer)\/\d+$/i.test(selected.url)) {
        setStatus('Metadata resolved. Use the matching service example to render this service type.'); return;
      }
      const source = await load(selected.url, ArcGISFeatureServerSourceLoader, {core: {fetch: transport}});
      const result = await source.queryFeatures({query: {where: filter}, maxFeatures: 5000, signal: controller.signal});
      if (controller.signal.aborted) return;
      setFeatures(result.data.features);
      const extent = item.item.extent;
      if (extent?.length === 2 && extent.flat().every(Number.isFinite)) {
        const viewport = new WebMercatorViewport({width: 800, height: 400}).fitBounds(extent as [[number, number], [number, number]], {padding: 30, maxZoom: 15});
        setViewState({longitude: viewport.longitude, latitude: viewport.latitude, zoom: viewport.zoom});
      }
      setStatus(`${result.loaded} records. ${result.complete ? 'Complete for this query.' : `Partial: ${result.reason}.`} ${selected.kind === 'table' ? 'Nonspatial rows are shown below.' : ''}`);
    } catch {
      if (controllerReference.current === controller) setStatus(controller.signal.aborted ? 'Cancelled.' : 'Unable to load. Check item type, access, trusted origins, query and CORS. Sign in again if a server token was revoked.');
    } finally {
      if (controllerReference.current === controller) setBusy(false);
    }
  }

  /** Revokes the in-memory session and clears private content from the display. */
  async function signOut() {
    controllerReference.current?.abort(); setFeatures([]); setResolution(null); setSelection('');
    const identity = session; setSession(null);
    try { await identity?.signOut(); setStatus('Signed out.'); }
    catch { setStatus('Local session cleared; server token revocation failed.'); }
  }

  return <section aria-label="ArcGIS item explorer" style={{height: '100%', overflow: 'auto', background: '#f4f7fb', color: '#172842'}}>
    <div style={{padding: 16, display: 'grid', gap: 8}}>
      <strong>Bring your ArcGIS content</strong>
      <details><summary>Configure sign-in {session ? '(signed in)' : '(optional for public data)'}</summary>
        <p>Register this exact redirect URL: <code>{`${window.location.origin}${window.location.pathname}`}</code>. Tokens stay in memory.</p>
        <label>Portal REST URL <input aria-label="Portal REST URL" value={portal} onChange={event => setPortal(event.target.value)} disabled={!!session || busy} /></label>{' '}
        <label>OAuth client ID <input value={clientId} onChange={event => setClientId(event.target.value)} disabled={!!session || busy} /></label>
        <p><label>Trusted token origins (comma separated) <input style={{width: '100%'}} value={origins} onChange={event => setOrigins(event.target.value)} disabled={busy} /></label></p>
        <button type="button" disabled={busy || (!session && !clientId)} onClick={() => void (session ? signOut() : signIn())}>{session ? 'Sign out' : 'Sign in with ArcGIS'}</button>
      </details>
      <label htmlFor={`${controlsId}-item`}>Item ID or item URL</label>
      <input id={`${controlsId}-item`} value={input} onChange={event => {setInput(event.target.value); setResolution(null); setSelection(''); setFeatures([]);}} disabled={busy} />
      <div style={{display: 'flex', gap: 8, flexWrap: 'wrap'}}>
        <button type="button" disabled={busy} onClick={() => void loadItem(false)}>Resolve item</button>
        <select aria-label="Layer or table" value={selection} onChange={event => setSelection(event.target.value)} disabled={busy || !resolution}>
          <option value="">Choose layer or table</option>
          {resolution?.layers.map(layer => <option key={String(layer.id)} value={layer.id === null ? 'root' : layer.id}>{layer.name} ({layer.kind})</option>)}
        </select>
        <input aria-label="ArcGIS SQL filter" value={filter} onChange={event => setFilter(event.target.value)} disabled={busy} />
        <button type="button" disabled={busy || !selection} onClick={() => void loadItem(true)}>Load selection</button>
        <button type="button" disabled={!busy} onClick={() => controllerReference.current?.abort()}>Cancel</button>
      </div>
      <div role="status">{status}</div>
      {resolution && <details><summary>{resolution.item.title} · metadata and fields</summary>
        <p>{resolution.item.description}</p><p>Attribution: {resolution.item.accessInformation || resolution.service.copyrightText || 'Not supplied by publisher'}</p>
        <pre style={{maxHeight: 160}}>{JSON.stringify(resolution.selectedLayer?.metadata || resolution.service, null, 2)}</pre>
      </details>}
    </div>
    <div style={{height: 330, position: 'relative', background: '#152b46'}}>
      <DeckGL initialViewState={viewState} controller layers={[new GeoJsonLayer({id: 'arcgis-item-features', data: features, pickable: true, getLineColor: [87, 224, 194], getFillColor: [87, 224, 194, 160], lineWidthMinPixels: 2, pointRadiusMinPixels: 4})]} getTooltip={({object}) => object ? {text: JSON.stringify(object.properties)} : null} />
    </div>
    {features.some(feature => !feature.geometry) && <pre style={{maxHeight: 160}}>{JSON.stringify(features.slice(0, 10).map(feature => feature.properties), null, 2)}</pre>}
    <small style={{display: 'block', padding: 12}}>Source: {resolution?.item.accessInformation || resolution?.service.copyrightText || 'Attribution not supplied'}. At most 5,000 records. Item extent sets the initial view. Metadata descriptions are displayed as text. No Web Map or Web Scene composition.</small>
  </section>;
}
