// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Color, Position} from '@deck.gl/core';
import {PathLayer, ScatterplotLayer} from '@deck.gl/layers';
import {DeckGL} from '@deck.gl/react';
import {load} from '@loaders.gl/core';
import {GTFSLoader, type GTFSData, type GTFSRow} from '@loaders.gl/scientific/gtfs';
import {
  GTFSRealtimeLoader,
  type GTFSRealtimeFeed,
  type GTFSRealtimePosition,
  type GTFSRealtimeVehiclePosition
} from '@loaders.gl/scientific/gtfs-realtime';
import {setWorkerUrl} from 'maplibre-gl';
import React, {type DragEvent, useEffect, useMemo, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Map as MapLibreMap} from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import './style.css';

setWorkerUrl(new URL('maplibre-gl/dist/maplibre-gl-worker.mjs', import.meta.url).toString());

/** Basemap used by the geospatial examples. */
const MAP_STYLE = 'https://loaders.gl/mapstyle/deck-light.json';
/** Initial map view of Boston. */
const INITIAL_VIEW_STATE = {longitude: -71.06, latitude: 42.35, zoom: 11};
/** Zoom level at which to start showing stops. */
const STOP_MIN_ZOOM = 12;
/** Route color when the feed does not supply a usable color. */
const DEFAULT_ROUTE_COLOR: Color = [54, 91, 133];
/** Default time between realtime requests, in milliseconds. */
const DEFAULT_REFRESH_INTERVAL = 15_000;

/** A feed URL or a local file. */
type FeedSource = string | File;

/** An explicit load request, including a retry of the current URL. */
type FeedRequest = {
  /** URL or file to load. */
  source: FeedSource;
};

/** State shared by the schedule and realtime loader calls. */
type FeedState<Data> = {
  /** Most recent successful result for this source. */
  data?: Data;
  /** Whether the initial request for this source is in progress. */
  loading?: boolean;
  /** Error from the latest request. */
  error?: string;
};

/** A vehicle observation with the coordinates needed to plot it. */
type MappedVehicle = {
  /** Feed entity identifier used when there is no vehicle identifier. */
  id: string;
  /** Decoded vehicle observation. */
  vehicle: GTFSRealtimeVehiclePosition;
  /** Decoded coordinates and optional movement readings. */
  position: GTFSRealtimePosition;
};

/** Loads a source and optionally polls it, keeping the last successful result between polls. */
function useFeed<Data>(
  request: FeedRequest,
  loadFeed: (source: FeedSource, signal: AbortSignal) => Promise<Data>,
  refreshInterval?: number
): FeedState<Data> {
  const [state, setState] = useState<FeedState<Data>>({loading: Boolean(request.source)});

  useEffect(() => {
    const {source} = request;
    setState({loading: Boolean(source)});
    if (!source) return;

    const controller = new AbortController();
    let refreshTimer: number | undefined;

    /** Replaces the displayed feed on success and schedules the next request. */
    async function refresh() {
      try {
        const data = await loadFeed(source, controller.signal);
        if (!controller.signal.aborted) setState({data});
      } catch (error) {
        if (!controller.signal.aborted) {
          setState(previous => ({
            data: previous.data,
            error: error instanceof Error ? error.message : String(error)
          }));
        }
      } finally {
        if (!controller.signal.aborted && refreshInterval && typeof source === 'string') {
          refreshTimer = window.setTimeout(refresh, refreshInterval);
        }
      }
    }

    void refresh();
    return () => {
      controller.abort();
      window.clearTimeout(refreshTimer);
    };
  }, [request, loadFeed, refreshInterval]);

  return state;
}

/** Loads only the Schedule tables needed to render and annotate the map. */
function loadSchedule(source: FeedSource, signal: AbortSignal) {
  return load(source, GTFSLoader, {signal, gtfs: {files: ['routes', 'trips', 'shapes', 'stops']}});
}

/** Explicitly selects GTFS Realtime for protobuf files and retains its feed header. */
async function loadVehicles(source: FeedSource, signal: AbortSignal) {
  const result = await load(source, GTFSRealtimeLoader, {
    signal,
    core: {fetch: {cache: 'no-store'}},
    gtfsRealtime: {shape: 'gtfs-realtime-feed'}
  });
  if (result.shape !== 'gtfs-realtime-feed') throw new Error('Expected a GTFS Realtime feed');
  return result;
}

/** Indexes the rows with a nonempty identifier in the selected column. */
function indexRows(rows: GTFSRow[] = [], column: string): Map<string, GTFSRow> {
  const index = new Map<string, GTFSRow>();
  for (const row of rows) {
    const identifier = row[column];
    if (typeof identifier === 'string' && identifier) index.set(identifier, row);
  }
  return index;
}

/** Turns a six-digit GTFS route color into a deck.gl color. */
function getRouteColor(route: GTFSRow | undefined): Color {
  const color = route?.route_color;
  if (typeof color !== 'string' || !/^[\da-f]{6}$/i.test(color)) return DEFAULT_ROUTE_COLOR;
  const value = Number.parseInt(color, 16);
  return [value >> 16, (value >> 8) & 255, value & 255];
}

/** Builds the lookup tables and drawable geometries from a parsed Schedule feed. */
function getScheduleMap(schedule?: GTFSData) {
  const routes = indexRows(schedule?.tables.routes?.data, 'route_id');
  const trips = indexRows(schedule?.tables.trips?.data, 'trip_id');
  const stops = indexRows(schedule?.tables.stops?.data, 'stop_id');
  const routeByShape = new Map<string, GTFSRow>();

  for (const trip of schedule?.tables.trips?.data ?? []) {
    const {route_id: routeIdentifier, shape_id: shapeIdentifier} = trip;
    if (typeof routeIdentifier === 'string' && typeof shapeIdentifier === 'string') {
      const route = routes.get(routeIdentifier);
      if (route && !routeByShape.has(shapeIdentifier)) routeByShape.set(shapeIdentifier, route);
    }
  }

  const paths = (schedule?.shapes.features ?? []).flatMap(({geometry, id}) => {
    if (geometry?.type !== 'LineString') return [];
    return [
      {
        path: geometry.coordinates.map(([longitude, latitude]): Position => [longitude, latitude]),
        color: getRouteColor(routeByShape.get(String(id)))
      }
    ];
  });
  const stopPositions = (schedule?.stops.features ?? []).flatMap(({geometry}): Position[] =>
    geometry?.type === 'Point' ? [[geometry.coordinates[0], geometry.coordinates[1]]] : []
  );
  return {routes, trips, stops, paths, stopPositions};
}

/** Collects vehicles with usable coordinates from the current snapshot. */
function getMappedVehicles(feed?: GTFSRealtimeFeed): MappedVehicle[] {
  return (feed?.entity ?? []).flatMap(({id, isDeleted, vehicle}) => {
    const position = vehicle?.position;
    if (!vehicle || !position || isDeleted) return [];
    if (!(Math.abs(position.longitude) <= 180 && Math.abs(position.latitude) <= 90)) return [];
    return [{id, vehicle, position}];
  });
}

/** Resolves a vehicle route from the realtime trip descriptor or its scheduled trip. */
function getVehicleRouteIdentifier(
  vehicle: GTFSRealtimeVehiclePosition,
  trips: Map<string, GTFSRow>
) {
  const scheduledRoute = trips.get(vehicle.trip?.tripId ?? '')?.route_id;
  return vehicle.trip?.routeId || (typeof scheduledRoute === 'string' ? scheduledRoute : '');
}

/** Describes a vehicle with the available schedule and realtime fields. */
function getVehicleTooltip(
  {id, vehicle, position}: MappedVehicle,
  {routes, trips, stops}: ReturnType<typeof getScheduleMap>
) {
  const routeIdentifier = getVehicleRouteIdentifier(vehicle, trips);
  const route = routes.get(routeIdentifier);
  const routeName = [route?.route_short_name, route?.route_long_name].filter(Boolean).join(' · ');
  const identifiers = [...new Set([vehicle.vehicle?.label, vehicle.vehicle?.id].filter(Boolean))];
  const stopName = stops.get(vehicle.stopId ?? '')?.stop_name || vehicle.stopId;
  const age =
    vehicle.timestamp === undefined
      ? 'Unavailable'
      : `${Math.max(0, Math.floor(Date.now() / 1000 - vehicle.timestamp))} s ago`;

  return {
    text: [
      `Vehicle ${identifiers.join(' · ') || id}`,
      `Route: ${routeName || routeIdentifier || 'Unavailable'}`,
      `Trip: ${vehicle.trip?.tripId || 'Unavailable'}`,
      `Status: ${vehicle.currentStatus}`,
      stopName && `Stop: ${stopName}`,
      position.speed !== undefined && `Speed: ${position.speed.toFixed(1)} m/s`,
      position.bearing !== undefined && `Bearing: ${Math.round(position.bearing)}°`,
      `Position age: ${age}`
    ]
      .filter(Boolean)
      .join('\n')
  };
}

/** Reads the initial feed URLs and refresh interval from the page URL. */
function getInitialSettings(useMbtaProxy: boolean) {
  const query = new URLSearchParams(window.location.search);
  const refresh = Number(query.get('refresh')) * 1000;
  return {
    schedule: query.get('static') ?? (useMbtaProxy ? '/feeds/mbta/MBTA_GTFS.zip' : ''),
    realtime:
      query.get('realtime') ?? (useMbtaProxy ? '/feeds/mbta/realtime/VehiclePositions.pb' : ''),
    refreshInterval: refresh >= 1 && refresh <= 2_147_483_647 ? refresh : DEFAULT_REFRESH_INTERVAL
  };
}

/** URL input that applies the value only when its form is submitted. */
function FeedInput({
  label,
  initialUrl,
  onLoad
}: {
  /** Label displayed above the URL field. */
  label: string;
  /** URL shown when the app opens. */
  initialUrl: string;
  /** Applies the source URL. */
  onLoad: (url: string) => void;
}) {
  const inputId = React.useId();
  return (
    <form
      onSubmit={event => {
        event.preventDefault();
        onLoad(String(new FormData(event.currentTarget).get('url')).trim());
      }}
    >
      <label htmlFor={inputId}>{label}</label>
      <div className="gtfs-input-row">
        <input
          id={inputId}
          name="url"
          type="text"
          defaultValue={initialUrl}
          placeholder="https://…"
        />
        <button type="submit">Load</button>
      </div>
    </form>
  );
}

/** Shows routes and stops from GTFS Schedule and vehicles from GTFS Realtime. */
export default function App({
  useMbtaProxy = false
}: {
  /** Enables the MBTA defaults when the Vite development proxy is available. */
  useMbtaProxy?: boolean;
} = {}) {
  const [settings] = useState(() => getInitialSettings(useMbtaProxy));
  const [scheduleRequest, setScheduleRequest] = useState<FeedRequest>({source: settings.schedule});
  const [realtimeRequest, setRealtimeRequest] = useState<FeedRequest>({source: settings.realtime});
  const [zoom, setZoom] = useState(INITIAL_VIEW_STATE.zoom);
  const schedule = useFeed(scheduleRequest, loadSchedule);
  const realtime = useFeed(realtimeRequest, loadVehicles, settings.refreshInterval);
  const scheduleMap = useMemo(() => getScheduleMap(schedule.data), [schedule.data]);
  const vehicles = useMemo(() => getMappedVehicles(realtime.data), [realtime.data]);
  const showStops = zoom >= STOP_MIN_ZOOM;
  const feedTimestamp = realtime.data?.header.timestamp;
  const layers = useMemo(
    () => [
      new PathLayer({
        id: 'gtfs-routes',
        data: scheduleMap.paths,
        getPath: route => route.path,
        getColor: route => route.color,
        getWidth: 2.5,
        widthUnits: 'pixels',
        jointRounded: true,
        capRounded: true,
        opacity: 0.8
      }),
      new ScatterplotLayer<Position>({
        id: 'gtfs-stops',
        data: scheduleMap.stopPositions,
        visible: showStops,
        getPosition: position => position,
        getRadius: 2.5,
        radiusUnits: 'pixels',
        getFillColor: [40, 53, 68],
        opacity: 0.65
      }),
      new ScatterplotLayer<MappedVehicle>({
        id: 'gtfs-vehicles',
        data: vehicles,
        getPosition: ({position}) => [position.longitude, position.latitude],
        getRadius: 6,
        radiusUnits: 'pixels',
        getFillColor: ({vehicle}) =>
          getRouteColor(
            scheduleMap.routes.get(getVehicleRouteIdentifier(vehicle, scheduleMap.trips))
          ),
        updateTriggers: {getFillColor: scheduleMap},
        stroked: true,
        getLineColor: [255, 255, 255],
        getLineWidth: 1.5,
        lineWidthUnits: 'pixels',
        pickable: true
      })
    ],
    [scheduleMap, showStops, vehicles]
  );

  /** Accepts one Schedule ZIP and one Realtime protobuf file per drop. */
  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    const scheduleFile = files.find(file => /\.zip$/i.test(file.name));
    const realtimeFile = files.find(file => /\.pb$/i.test(file.name));
    if (scheduleFile) setScheduleRequest({source: scheduleFile});
    if (realtimeFile) setRealtimeRequest({source: realtimeFile});
  }

  return (
    <div className="gtfs-map" onDragOver={event => event.preventDefault()} onDrop={handleDrop}>
      <DeckGL
        controller
        initialViewState={INITIAL_VIEW_STATE}
        onViewStateChange={({viewState}) => {
          if ('zoom' in viewState) setZoom(viewState.zoom);
        }}
        layers={layers}
        getTooltip={({object}) => (object ? getVehicleTooltip(object, scheduleMap) : null)}
      >
        <MapLibreMap mapStyle={MAP_STYLE} />
      </DeckGL>
      <aside className="gtfs-panel" aria-label="Transit feeds">
        <h2>GTFS Transit Map</h2>
        <FeedInput
          label="Schedule URL"
          initialUrl={settings.schedule}
          onLoad={source => setScheduleRequest({source})}
        />
        <FeedInput
          label="Vehicle positions URL"
          initialUrl={settings.realtime}
          onLoad={source => setRealtimeRequest({source})}
        />
        <p>
          {useMbtaProxy
            ? 'Drop a Schedule .zip or VehiclePositions .pb file.'
            : 'Enter a CORS-enabled feed URL or drop a Schedule .zip or VehiclePositions .pb file.'}
        </p>
        <div className="gtfs-feed-status" aria-live="polite">
          {typeof scheduleRequest.source !== 'string' && (
            <p>Schedule file: {scheduleRequest.source.name}</p>
          )}
          {typeof realtimeRequest.source !== 'string' && (
            <p>Realtime file: {realtimeRequest.source.name}</p>
          )}
          {schedule.loading && <p>Loading schedule…</p>}
          {schedule.error && <p className="gtfs-error">Schedule: {schedule.error}</p>}
          {schedule.data && (
            <p>
              {scheduleMap.paths.length.toLocaleString()} route shapes ·{' '}
              {showStops ? 'Stops visible' : 'Zoom in to see stops'}
            </p>
          )}
          {realtime.loading && <p>Loading vehicle positions…</p>}
          {realtime.error && <p className="gtfs-error">Realtime: {realtime.error}</p>}
          {realtime.data && (
            <p>
              {vehicles.length.toLocaleString()} vehicles
              <br />
              Feed timestamp:{' '}
              {feedTimestamp === undefined
                ? 'Unavailable'
                : new Date(feedTimestamp * 1000).toLocaleString()}
            </p>
          )}
        </div>
        <p>
          Transit data: <a href="https://www.mbta.com/developers">MBTA</a>
        </p>
      </aside>
    </div>
  );
}

/** Mounts the standalone Vite example. */
export function renderToDOM(container: HTMLElement, useMbtaProxy: boolean) {
  createRoot(container).render(<App useMbtaProxy={useMbtaProxy} />);
}
