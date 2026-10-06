import React, {useEffect, useId, useMemo, useRef, useState} from 'react';
import ArcGISMap from '../../../examples/website/shared/arcgis-map';
import {GeoJsonLayer} from '@deck.gl/layers';
import {WebMercatorViewport} from '@deck.gl/core';
import {ArcGISIdentityManager} from '@esri/arcgis-rest-request';
import {load} from '@loaders.gl/core';
import {ARCGIS_LOADERS, ArcGISFeatureServerSourceLoader} from '@loaders.gl/arcgis';
import {SourceLayer} from '@loaders.gl/deck-layers';
import type {SourceLayerProps} from '@loaders.gl/deck-layers';
import {resolveArcGISItem} from '@loaders.gl/arcgis/items';
import {ArcGISAuthentication} from '@loaders.gl/arcgis/authentication';
import type {ArcGISItemLayer, ArcGISItemResolution} from '@loaders.gl/arcgis/items';
import type {Feature} from '@loaders.gl/schema';

/** Public configuration shared only with a same-origin OAuth callback popup. */
type OAuthWindow = Window & {
  /** Configuration for the currently open popup; never contains tokens or item input. */
  arcgisExampleOAuth?: {
    /** Registered public OAuth client identifier. */
    clientId: string;
    /** User-configured portal REST endpoint. */
    portal: string;
    /** Registered same-origin callback page. */
    redirectUri: string;
  };
};
/** ArcGIS Online portal used by the curated public examples. */
const PUBLIC_PORTAL = 'https://www.arcgis.com/sharing/rest';
/** Public service items with renderers available in this explorer. */
const PUBLIC_ITEMS = [
  {
    id: '1bc3536f33374363b828e709b6f73597',
    layerId: 0,
    name: 'Kentucky bicycle routes · Features',
    description:
      'Explore bicycle routes from the Kentucky Transportation Cabinet. Click a route to inspect its attributes.'
  },
  {
    id: '10df2279f9684e4a9f6a7f08febac2a9',
    layerId: null,
    name: 'World imagery · Map tiles',
    description:
      'Preview Esri’s World Imagery service, then zoom in to explore satellite and aerial imagery.'
  },
  {
    id: '50718a2089964ebe9b05d43c1381d217',
    layerId: null,
    name: 'US land cover, 2001 · Imagery',
    description:
      'Preview the historical NLCD 2001 land-cover raster from Esri’s public sample server.'
  },
  {
    id: '274684d7a9d74ca4b87f529776feb3a2',
    layerId: null,
    name: 'World basemap · Vector tiles',
    description:
      'Explore vector tile geometry with application styling. Publisher colors, labels and symbols are not reproduced.'
  }
] as const;

/** Resolves public/private service items and previews explicitly selected layers and services. */
export default function ArcGISItemsApp(): React.ReactElement {
  const [portal, setPortal] = useState(PUBLIC_PORTAL);
  const [clientId, setClientId] = useState('');
  const [origins, setOrigins] = useState('https://www.arcgis.com, https://services2.arcgis.com');
  const [input, setInput] = useState<string>(PUBLIC_ITEMS[0].id);
  const [filter, setFilter] = useState('1=1');
  const [resolution, setResolution] = useState<ArcGISItemResolution | null>(null);
  const [selection, setSelection] = useState('');
  const [sourcePreview, setSourcePreview] = useState<SourceLayerProps | null>(null);
  const [inspectedProperties, setInspectedProperties] = useState<Record<string, unknown> | null>(
    null
  );
  const [collapsed, setCollapsed] = useState(false);
  const [opacity, setOpacity] = useState(0.85);
  const [showBasemap, setShowBasemap] = useState(true);
  const mapContainerReference = useRef<HTMLElement | null>(null);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [viewState, setViewState] = useState({longitude: -85.75, latitude: 37.75, zoom: 6});
  const [session, setSession] = useState<ArcGISIdentityManager | null>(null);
  const [status, setStatus] = useState('Try the public item, or configure your own sign-in.');
  const [busy, setBusy] = useState(false);
  const controllerReference = useRef<AbortController | null>(null);
  const completedReference = useRef(false);
  const controlsId = useId();
  const isPublicPortal = portal.replace(/\/+$/, '') === PUBLIC_PORTAL;
  const publicItem = isPublicPortal ? PUBLIC_ITEMS.find(item => item.id === input) : undefined;
  const previewLayer = useMemo(
    () => (sourcePreview ? new SourceLayer({...sourcePreview, opacity}) : null),
    [sourcePreview, opacity]
  );
  const tableRows = features.filter(feature => !feature.geometry).slice(0, 50);
  const tableColumns = [
    ...new Set(tableRows.flatMap(feature => Object.keys(feature.properties || {})))
  ].slice(0, 12);

  useEffect(() => {
    const parameters = new URLSearchParams(window.location.search);
    if (!completedReference.current && (parameters.has('code') || parameters.has('error'))) {
      completedReference.current = true;
      let configuration: OAuthWindow['arcgisExampleOAuth'];
      try {
        configuration = (window.opener as OAuthWindow | null)?.arcgisExampleOAuth;
      } catch {
        /* Only same-origin openers are permitted. */
      }
      if (configuration) {
        setStatus('Completing sign-in in the original window…');
        const callbackOptions = {...configuration, popup: true, pkce: true};
        void Promise.resolve()
          .then(() => ArcGISIdentityManager.completeOAuth2(callbackOptions))
          .catch(() =>
            setStatus('Sign-in failed. Close this popup and try again in the original window.')
          );
      } else {
        setStatus(
          'No active sign-in window. Close this callback and start sign-in from the example.'
        );
      }
    }
    if (!parameters.has('code') && !parameters.has('error')) {
      void loadItem(true, PUBLIC_ITEMS[0].layerId);
    }
    return () => {
      controllerReference.current?.abort();
      delete (window as OAuthWindow).arcgisExampleOAuth;
    };
  }, []);

  /** Starts Esri's browser PKCE flow using the current page as the registered callback. */
  async function signIn() {
    const configuration = {
      clientId,
      portal,
      redirectUri: `${window.location.origin}${window.location.pathname}`
    };
    const parentWindow = window as OAuthWindow;
    if (parentWindow.arcgisExampleOAuth) {
      setStatus(
        'A sign-in is already active. Finish it in the popup, or reload this page to start again.'
      );
      return;
    }
    parentWindow.arcgisExampleOAuth = configuration;
    setStatus(
      'Finish signing in in the popup. Allow popups for this site; reload to restart a closed or blocked popup.'
    );
    try {
      const identity = await ArcGISIdentityManager.beginOAuth2({
        ...configuration,
        popup: true,
        pkce: true
      });
      if (!identity) throw new Error('The sign-in popup did not return a session.');
      setSession(identity);
      setStatus('Signed in. Resolve an item to choose a layer.');
    } catch {
      setStatus('Sign-in failed. Check the client ID, portal and browser settings.');
    } finally {
      delete parentWindow.arcgisExampleOAuth;
    }
  }

  /** Clears the previous selection and preview when the item input changes. */
  function changeItem(value: string) {
    controllerReference.current?.abort();
    setInput(value);
    setResolution(null);
    setSelection('');
    setFeatures([]);
    setSourcePreview(null);
    setInspectedProperties(null);
    setStatus('Select Discover layers to explore this item.');
  }

  /** Loads a curated public preview using explicit inputs instead of pending React state. */
  function previewPublicItem(value: string) {
    changeItem(value);
    const example = PUBLIC_ITEMS.find(item => item.id === value);
    if (!example) return;
    setFilter('1=1');
    if (!session) setPortal(PUBLIC_PORTAL);
    void loadItem(true, example.layerId, {
      itemInput: example.id,
      portalUrl: PUBLIC_PORTAL,
      queryFilter: '1=1'
    });
  }

  /** Bridges the application-managed Esri session to our scoped request transport. */
  function createTransport() {
    if (!session) return window.fetch.bind(window);
    return new ArcGISAuthentication({
      origins: origins.split(',').map(origin => origin.trim()),
      token: async ({url, reason}) => {
        if (reason === 'refresh') await session.refreshCredentials();
        return session.getToken(url);
      }
    }).createFetch();
  }

  /** Resolves the item and displays a bounded feature query or an existing service renderer on demand. */
  async function loadItem(
    display: boolean,
    choice?: number | null,
    request?: {
      /** Item selected by a public preset before input state has updated. */
      itemInput: string;
      /** Portal that owns the explicitly selected public item. */
      portalUrl: string;
      /** Filter applied to this preview without inheriting the previous item's query. */
      queryFilter: string;
    }
  ) {
    controllerReference.current?.abort();
    const controller = new AbortController();
    controllerReference.current = controller;
    setBusy(true);
    setFeatures([]);
    setSourcePreview(null);
    setInspectedProperties(null);
    setStatus(display ? 'Loading selected layer…' : 'Resolving portal item…');
    if (display && choice !== undefined) setSelection(choice === null ? 'root' : String(choice));
    if (!display) {
      setResolution(null);
      setSelection('');
    }
    try {
      const transport = createTransport();
      const item = await resolveArcGISItem(request?.itemInput ?? input, {
        portalUrl: request?.portalUrl ?? portal,
        fetch: transport,
        signal: controller.signal,
        ...(display
          ? {
              layerId:
                choice !== undefined ? choice : selection === 'root' ? null : Number(selection)
            }
          : {})
      });
      if (controller.signal.aborted) return;
      setResolution(item);
      if (!display) {
        fitView(item.item.extent);
        setStatus('Choose a discovered layer below to visualize it.');
        return;
      }
      const selected = item.selectedLayer!;
      fitView(item.item.extent);
      const sourceType = getPreviewSourceType(selected.url);
      if (sourceType) {
        /** Ignores callbacks from a preview replaced or cancelled by the user. */
        const reportPreviewError = () => {
          if (controllerReference.current === controller && !controller.signal.aborted) {
            setStatus('Preview unavailable. Check service access, supported tile grid, and CORS.');
          }
        };
        setSourcePreview({
          id: `arcgis-item-preview-${selected.url}`,
          data: selected.url,
          loaders: ARCGIS_LOADERS,
          sourceOptions: {
            core: {type: sourceType, fetch: transport, worker: false},
            mvt: {shape: 'geojson-table'}
          },
          extent: [-180, -85.051129, 180, 85.051129],
          srs: sourceType === 'arcgis-image-server' ? 'EPSG:4326' : 'auto',
          maxRequests: 4,
          onSourceError: reportPreviewError,
          onTileError: reportPreviewError,
          onImageLoadError: reportPreviewError,
          onError: reportPreviewError,
          pickable: true
        });
        setStatus(
          sourceType === 'arcgis-vector-tile-server'
            ? 'Vector tile preview. Uses application styling, not the publisher’s cartography. Pan and zoom to explore.'
            : 'Service preview active. Pan and zoom to request imagery for the visible area.'
        );
        return;
      }
      if (!/\/(FeatureServer|MapServer)\/\d+$/i.test(selected.url)) {
        setStatus(
          'Scene metadata loaded. This explorer does not render I3S scenes; use the dedicated scene examples.'
        );
        return;
      }
      const source = await load(selected.url, ArcGISFeatureServerSourceLoader, {
        core: {fetch: transport}
      });
      const result = await source.queryFeatures({
        query: {where: request?.queryFilter ?? filter},
        maxFeatures: 5000,
        signal: controller.signal
      });
      if (controller.signal.aborted) return;
      setFeatures(result.data.features);
      fitView(getFeatureBounds(result.data.features) || item.item.extent);
      setStatus(
        `${result.loaded} records. ${result.complete ? 'Complete for this query.' : `Partial: ${result.reason}.`} ${selected.kind === 'table' ? 'Nonspatial rows are shown below.' : ''}`
      );
    } catch {
      if (controllerReference.current === controller)
        setStatus(
          controller.signal.aborted
            ? 'Cancelled.'
            : 'Unable to load. Check item type, access, trusted origins, query and CORS. Sign in again if a server token was revoked.'
        );
    } finally {
      if (controllerReference.current === controller) setBusy(false);
    }
  }

  /** Revokes the in-memory session and clears private content from the display. */
  async function signOut() {
    controllerReference.current?.abort();
    setFeatures([]);
    setSourcePreview(null);
    setInspectedProperties(null);
    setResolution(null);
    setSelection('');
    const identity = session;
    setSession(null);
    try {
      await identity?.signOut();
      setStatus('Signed out.');
    } catch {
      setStatus('Local session cleared; server token revocation failed.');
    }
  }

  /** Centers geographic bounds vertically, leaving horizontal space beside desktop controls. */
  function fitView(extent?: number[][]) {
    if (
      extent?.length !== 2 ||
      extent.some(position => position.length !== 2 || !position.every(Number.isFinite))
    )
      return;
    const width = mapContainerReference.current?.clientWidth || 900;
    const height = mapContainerReference.current?.clientHeight || 700;
    const bounds = extent.map(([longitude, latitude]) => [
      longitude,
      Math.max(-85, Math.min(85, latitude))
    ]) as [[number, number], [number, number]];
    const viewport = new WebMercatorViewport({width, height}).fitBounds(bounds, {
      padding: {top: 48, bottom: 48, left: width > 700 && !collapsed ? 350 : 40, right: 40},
      maxZoom: 14
    });
    setViewState({longitude: viewport.longitude, latitude: viewport.latitude, zoom: viewport.zoom});
  }

  return (
    <section
      ref={mapContainerReference}
      className="arcgis-item-explorer"
      aria-label="ArcGIS item explorer"
    >
      <style>{EXPLORER_STYLES}</style>
      <ArcGISMap
        viewState={viewState}
        onViewStateChange={setViewState}
        showBasemap={showBasemap}
        onError={error => setStatus(error.message)}
        layers={[
          previewLayer,
          new GeoJsonLayer({
            id: 'arcgis-item-features',
            data: features,
            opacity,
            pickable: true,
            autoHighlight: true,
            getLineColor: [15, 118, 110],
            getFillColor: [20, 184, 166, 150],
            lineWidthMinPixels: 3,
            pointRadiusMinPixels: 5,
            onClick: ({object}) => setInspectedProperties(object?.properties || null)
          })
        ]}
        getTooltip={({object}) =>
          object?.properties
            ? {
                text: Object.entries(object.properties)
                  .slice(0, 5)
                  .map(([name, value]) => `${name}: ${value}`)
                  .join('\n')
              }
            : null
        }
      />
      <aside
        className={`arcgis-item-infobox ${collapsed ? 'is-collapsed' : ''}`}
        aria-label="Item and visualization controls"
      >
        <header>
          <div>
            <small>ARCGIS · DECK.GL</small>
            <strong>Explore your content</strong>
          </div>
          <button
            type="button"
            className="arcgis-icon-button"
            aria-label={collapsed ? 'Expand controls' : 'Collapse controls'}
            aria-expanded={!collapsed}
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? '+' : '−'}
          </button>
        </header>
        {!collapsed && (
          <div className="arcgis-item-controls">
            <label htmlFor={`${controlsId}-public-item`}>Public examples</label>
            <select
              id={`${controlsId}-public-item`}
              value={publicItem?.id || ''}
              disabled={busy || (!!session && !isPublicPortal)}
              onChange={event => previewPublicItem(event.target.value)}
            >
              {PUBLIC_ITEMS.map(item => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
              <option value="">Custom item ID or URL</option>
            </select>
            {session && !isPublicPortal && (
              <small>
                Sign out to try these ArcGIS Online examples, or enter an item from your portal
                below.
              </small>
            )}
            {publicItem && (
              <small>
                {publicItem.description}{' '}
                <a
                  href={`https://www.arcgis.com/home/item.html?id=${publicItem.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View source item ↗
                </a>
              </small>
            )}
            <label htmlFor={`${controlsId}-item`}>Item ID or item URL</label>
            <input
              id={`${controlsId}-item`}
              value={input}
              onChange={event => changeItem(event.target.value)}
              disabled={busy}
            />
            <div className="arcgis-button-row">
              <button
                className="arcgis-primary-button"
                type="button"
                disabled={busy || !input.trim()}
                onClick={() => void loadItem(false)}
              >
                Discover layers
              </button>
              <button
                type="button"
                disabled={!busy}
                onClick={() => controllerReference.current?.abort()}
              >
                Cancel
              </button>
            </div>
            <div role="status" aria-live="polite" className="arcgis-item-status">
              {status}
            </div>
            {resolution && (
              <section aria-label="Discovered layers" className="arcgis-layer-list">
                <strong>{resolution.item.title}</strong>
                <small>
                  {resolution.item.type} · {resolution.layers.length} choices
                </small>
                {resolution.layers.map(layer => (
                  <button
                    type="button"
                    key={String(layer.id)}
                    disabled={busy}
                    className={`arcgis-layer-choice ${selection === (layer.id === null ? 'root' : String(layer.id)) ? 'is-selected' : ''}`}
                    onClick={() => void loadItem(true, layer.id)}
                  >
                    <strong>{layer.name}</strong>
                    <span>{getLayerAction(layer)}</span>
                  </button>
                ))}
                {!resolution.layers.length && (
                  <p>No selectable layers were advertised by this item.</p>
                )}
              </section>
            )}
            <details open>
              <summary>Visualization</summary>
              <label htmlFor={`${controlsId}-filter`}>Feature filter</label>
              <input
                id={`${controlsId}-filter`}
                aria-label="ArcGIS SQL filter"
                value={filter}
                onChange={event => setFilter(event.target.value)}
                disabled={busy}
              />
              <button
                type="button"
                disabled={busy || !selection}
                onClick={() => void loadItem(true)}
              >
                Refresh selection
              </button>
              <label htmlFor={`${controlsId}-opacity`}>
                Opacity · {Math.round(opacity * 100)}%
              </label>
              <input
                id={`${controlsId}-opacity`}
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                value={opacity}
                onChange={event => setOpacity(Number(event.target.value))}
              />
              <label className="arcgis-checkbox">
                <input
                  type="checkbox"
                  checked={showBasemap}
                  onChange={event => setShowBasemap(event.target.checked)}
                />{' '}
                Context map
              </label>
              <button
                type="button"
                disabled={!resolution}
                onClick={() => fitView(getFeatureBounds(features) || resolution?.item.extent)}
              >
                Fit to data
              </button>
              <small>
                Feature queries are capped at 5,000 records. Click a feature to inspect its
                attributes.
              </small>
            </details>
            {resolution && (
              <details>
                <summary>Item details and metadata</summary>
                <p>{resolution.item.description}</p>
                <pre>
                  {JSON.stringify(
                    resolution.selectedLayer?.metadata || resolution.service,
                    null,
                    2
                  )}
                </pre>
                {resolution.item.type === 'Scene Service' && (
                  <a href="/examples/arcgis-scene-server">Open the dedicated scene inspector</a>
                )}
              </details>
            )}
            <details>
              <summary>Configure sign-in {session ? '(signed in)' : '(optional)'}</summary>
              <small>
                Register this redirect URL:{' '}
                <code>{`${window.location.origin}${window.location.pathname}`}</code>. Tokens stay
                in memory.
              </small>
              <label>
                Portal REST URL{' '}
                <input
                  aria-label="Portal REST URL"
                  value={portal}
                  onChange={event => setPortal(event.target.value)}
                  disabled={!!session || busy}
                />
              </label>
              <label>
                OAuth client ID{' '}
                <input
                  value={clientId}
                  onChange={event => setClientId(event.target.value)}
                  disabled={!!session || busy}
                />
              </label>
              <label>
                Trusted token origins{' '}
                <input
                  value={origins}
                  onChange={event => setOrigins(event.target.value)}
                  disabled={busy}
                />
              </label>
              <small>Comma-separated exact origins you authorize to receive tokens.</small>
              <button
                type="button"
                disabled={busy || (!session && !clientId)}
                onClick={() => void (session ? signOut() : signIn())}
              >
                {session ? 'Sign out' : 'Sign in with ArcGIS'}
              </button>
            </details>
          </div>
        )}
      </aside>
      {inspectedProperties && (
        <aside className="arcgis-feature-inspector" aria-label="Selected feature">
          <header>
            <strong>Selected feature</strong>
            <button
              type="button"
              aria-label="Close feature details"
              onClick={() => setInspectedProperties(null)}
            >
              ×
            </button>
          </header>
          <dl>
            {Object.entries(inspectedProperties).map(([name, value]) => (
              <React.Fragment key={name}>
                <dt>{name}</dt>
                <dd>{String(value ?? '—')}</dd>
              </React.Fragment>
            ))}
          </dl>
        </aside>
      )}
      {tableRows.length > 0 && (
        <aside className="arcgis-table-preview" aria-label="Table preview">
          <strong>
            Table preview · first {tableRows.length} rows of {features.length} loaded
          </strong>
          <div>
            <table>
              <thead>
                <tr>
                  {tableColumns.map(name => (
                    <th key={name}>{name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableRows.map((feature, index) => (
                  <tr key={index}>
                    {tableColumns.map(name => (
                      <td key={name}>{String(feature.properties?.[name] ?? '—')}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </aside>
      )}
      {resolution && (
        <div className="arcgis-item-attribution">
          {resolution.item.accessInformation ||
            resolution.selectedLayer?.metadata.copyrightText ||
            resolution.service.copyrightText ||
            'Attribution not supplied by publisher'}
        </div>
      )}
    </section>
  );
}

/** Maps already supported raster/vector service roots to their existing source renderers. */
function getPreviewSourceType(url: string): string | undefined {
  if (/\/MapServer$/i.test(url)) return 'arcgis-map-server';
  if (/\/ImageServer$/i.test(url)) return 'arcgis-image-server';
  if (/\/VectorTileServer$/i.test(url)) return 'arcgis-vector-tile-server';
  return undefined;
}

/** Describes the actual action each discovered layer can perform in this explorer. */
function getLayerAction(layer: ArcGISItemLayer): string {
  if (layer.kind === 'table') return 'Open table →';
  if (/\/SceneServer(?:\/|$)/i.test(layer.url)) return 'Inspect scene metadata →';
  return layer.kind === 'service' ? 'Preview service on map →' : 'Show features on map →';
}

/** Computes geographic bounds for loaded features so filtered results remain visible. */
function getFeatureBounds(features: Feature[]): number[][] | undefined {
  let west = Infinity;
  let south = Infinity;
  let east = -Infinity;
  let north = -Infinity;
  /** Visits coordinate arrays without copying or flattening potentially large geometries. */
  function visitCoordinates(coordinates: unknown): void {
    if (!Array.isArray(coordinates)) return;
    if (typeof coordinates[0] === 'number' && typeof coordinates[1] === 'number') {
      const [longitude, latitude] = coordinates;
      if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) return;
      west = Math.min(west, longitude);
      east = Math.max(east, longitude);
      south = Math.min(south, latitude);
      north = Math.max(north, latitude);
    } else for (const child of coordinates) visitCoordinates(child);
  }
  /** Includes nested geometry collections as well as ordinary GeoJSON geometry arrays. */
  function visitGeometry(geometry: Feature['geometry']): void {
    if (!geometry) return;
    if (geometry.type === 'GeometryCollection') geometry.geometries.forEach(visitGeometry);
    else visitCoordinates(geometry.coordinates);
  }
  features.forEach(feature => visitGeometry(feature.geometry));
  return Number.isFinite(west)
    ? [
        [west, south],
        [east, north]
      ]
    : undefined;
}

/** Styles scoped to this embedded example, including its compact mobile infobox. */
const EXPLORER_STYLES = `
.arcgis-item-explorer {position:relative;height:100%;min-height:420px;overflow:hidden;background:#e5ebef;color:#172842;font:14px/1.5 system-ui,sans-serif}
.arcgis-item-explorer button,.arcgis-item-explorer input,.arcgis-item-explorer select {font:inherit;color:#172842;box-sizing:border-box}
.arcgis-item-explorer button {border:1px solid #d5dfe5;border-radius:7px;background:#fff;padding:7px 10px;cursor:pointer;text-align:left}
.arcgis-item-explorer button:hover {background:#edf7f5;border-color:#47988f}
.arcgis-item-explorer button:disabled {opacity:.45;cursor:default}
.arcgis-item-explorer button:focus-visible,.arcgis-item-explorer input:focus-visible,.arcgis-item-explorer select:focus-visible {outline:2px solid #0f766e;outline-offset:2px}
.arcgis-item-infobox {position:absolute;top:16px;left:16px;width:310px;max-width:calc(100% - 32px);max-height:calc(100% - 58px);overflow:auto;z-index:1;background:#fffffff5;border:1px solid #d7e1e7;border-radius:12px;box-shadow:0 8px 30px #16324726;backdrop-filter:blur(10px)}
.arcgis-item-infobox header,.arcgis-feature-inspector header {display:flex;justify-content:space-between;align-items:center;padding:14px 16px;gap:12px}
.arcgis-item-infobox header strong,.arcgis-item-infobox header small {display:block}
.arcgis-item-infobox header small {font-size:10px;letter-spacing:1.4px;color:#48716d;font-weight:700}
.arcgis-item-infobox header strong {font-size:17px}.arcgis-item-explorer .arcgis-icon-button {font-size:20px;padding:0 9px}
.arcgis-item-controls {padding:0 16px 16px;display:grid;gap:10px}.arcgis-item-controls label {display:block;font-size:12px;font-weight:600}
.arcgis-item-controls select,.arcgis-item-controls input:not([type=checkbox]):not([type=range]) {width:100%;background:#fff;border:1px solid #cbd7df;border-radius:6px;padding:8px;margin-top:3px}
.arcgis-item-controls input[type=range] {width:100%;accent-color:#0f766e}.arcgis-item-controls .arcgis-checkbox {display:flex;align-items:center;gap:8px}
.arcgis-item-controls small {display:block;color:#577080;font-size:11px}.arcgis-item-controls code {overflow-wrap:anywhere;color:inherit;background:#edf2f5}
.arcgis-button-row {display:flex;gap:8px}.arcgis-item-explorer .arcgis-primary-button {background:#0f766e;color:#fff;border-color:#0f766e;flex:1;text-align:center;font-weight:600}
.arcgis-item-status {padding:9px 10px;background:#edf5f4;border-radius:7px;font-size:12px}.arcgis-layer-list {display:grid;gap:6px}
.arcgis-item-explorer .arcgis-layer-choice {display:grid;gap:2px;padding:10px}.arcgis-layer-choice span {font-size:11px;color:#42776e}
.arcgis-item-explorer .arcgis-layer-choice.is-selected {background:#e4f4ef;border-color:#0f766e}
.arcgis-item-controls details {border-top:1px solid #e0e7ec;padding-top:9px}.arcgis-item-controls summary {font-size:12px;font-weight:600;cursor:pointer;margin-bottom:8px}
.arcgis-item-controls details>*:not(summary) {margin-bottom:8px}.arcgis-item-controls pre {max-height:240px;overflow:auto;font-size:10px}
.arcgis-item-attribution {position:absolute;bottom:27px;right:10px;max-width:calc(100% - 32px);padding:3px 7px;background:#ffffffe6;border-radius:4px;font-size:11px;pointer-events:none}
.arcgis-feature-inspector {position:absolute;top:16px;right:16px;width:270px;max-width:40%;max-height:55%;overflow:auto;background:#fffffff5;border-radius:10px;box-shadow:0 4px 20px #16324726}
.arcgis-feature-inspector dl {padding:0 16px 16px;margin:0}.arcgis-feature-inspector dt {font-size:11px;font-weight:600;color:#587080}.arcgis-feature-inspector dd {margin:0 0 8px;overflow-wrap:anywhere}
.arcgis-table-preview {position:absolute;bottom:55px;right:16px;width:calc(100% - 370px);max-height:45%;padding:12px;background:#fffffff5;border-radius:10px;box-shadow:0 4px 20px #16324726}
.arcgis-table-preview>div {overflow:auto;max-height:230px}.arcgis-table-preview table {font-size:11px;white-space:nowrap;margin:8px 0 0}.arcgis-table-preview th,.arcgis-table-preview td {padding:5px 8px}
@media(max-width:700px) {.arcgis-item-infobox:not(.is-collapsed) {max-height:35%}.arcgis-feature-inspector {top:auto;bottom:55px;max-width:calc(100% - 32px)}.arcgis-table-preview {width:calc(100% - 32px)}}
`;
