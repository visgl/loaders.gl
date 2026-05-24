// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {createRoot} from 'react-dom/client';
import DeckGL from '@deck.gl/react';
import {
  COORDINATE_SYSTEM,
  FirstPersonView,
  type FirstPersonViewState,
  OrbitView,
  type OrbitViewState
} from '@deck.gl/core';
import {webgpuAdapter} from '@luma.gl/webgpu';
import {load, loadInBatches} from '@loaders.gl/core';
import {
  RADSplatLayer,
  SplatLayer,
  type RADSplatBounds,
  type RADSplatLoadProgress
} from '@loaders.gl/deck-layers';
import {PLYLoader} from '@loaders.gl/ply';
import {KSPLATLoader, RADSourceLoader, SPLATLoader, SPZLoader} from '@loaders.gl/splats';
import type {RADSource} from '@loaders.gl/splats';
import type {ArrowTableBatch, MeshArrowTable} from '@loaders.gl/schema';
import {FullscreenWidget, _StatsWidget as StatsWidget} from '@deck.gl/widgets';
import zstdCodecModule from 'zstd-codec';
import {ExampleUrlInputCard, type UrlOption} from '../shared/url-input-card';
import {
  DEFAULT_GAUSSIAN_SPLAT_EXAMPLE_NAME,
  GAUSSIAN_SPLAT_EXAMPLES,
  type GaussianSplatExample
} from './examples';
import '@deck.gl/widgets/stylesheet.css';

const PREVIEW_ROW_COUNT = 8;
const PREVIEW_COLUMN_COUNT = 8;
const GAUSSIAN_SPLAT_FORMAT = 'Gaussian Splat';
const CONTROLLER_MODES = ['orbit', 'first-person'] as const;
const FIRST_PERSON_INITIAL_PITCH = -20;
const FIRST_PERSON_MIN_PITCH = -75;
const FIRST_PERSON_MAX_PITCH = 75;
const RAD_PREVIEW_MAX_PIXEL_RADIUS = 64;
const RAD_MIN_FOV = 25;
const RAD_MAX_FOV = 90;
const RAD_DEFAULT_FOV = 75;
const RAD_MIN_LEVEL_OF_DETAIL = 0.5;
const RAD_MAX_LEVEL_OF_DETAIL = 4;
const ORBIT_MIN_ZOOM = -4;
const ORBIT_MAX_ZOOM = 8;
const SPLAT_LAYER_OPACITY = 0.34;
const RAD_SPLAT_LAYER_OPACITY = 1;
const SPLAT_RADIUS_SCALE = 0.78;
const RAD_SPLAT_RADIUS_SCALE = 0.65;
const SPLAT_RADIUS_MIN_PIXELS = 0.35;
const SPLAT_RADIUS_MAX_PIXELS = 16;
const RAD_SPLAT_RADIUS_MAX_PIXELS = RAD_PREVIEW_MAX_PIXEL_RADIUS;
const SPLAT_ALPHA_SCALE = 0.38;
const RAD_SPLAT_ALPHA_SCALE = 0.7;
const SPLAT_ALPHA_CUTOFF = 0.02;
const RAD_SPLAT_ALPHA_CUTOFF = 0.5 / 255;
const SPLAT_SCREEN_SIZE_CUTOFF_PIXELS = 0.2;
const SPLAT_KERNEL_2D_SIZE = 0.3;
const SPLAT_MAX_SCREEN_SPACE_SIZE = 256;
const RAD_SPLAT_MAX_SCREEN_SPACE_SIZE = RAD_PREVIEW_MAX_PIXEL_RADIUS;
const RAD_PREVIEW_INTERACTIVE_BASE_MAX_CHUNKS = 384;
const RAD_PREVIEW_SETTLED_BASE_MAX_CHUNKS = 768;
const RAD_PREVIEW_INTERACTIVE_BASE_MAX_SPLATS = 1000000;
const RAD_PREVIEW_SETTLED_BASE_MAX_SPLATS = 2000000;
const RAD_PREVIEW_BASE_MAX_CACHED_CHUNKS = 1024;
const RAD_PREVIEW_MAX_CONCURRENT_CHUNK_REQUESTS = 16;
const RAD_PREVIEW_SETTLE_DELAY_MS = 700;
const RAD_DEFAULT_LEVEL_OF_DETAIL = 2;
const RAD_DEFAULT_LOD_RENDER_SCALE = 1;
const RAD_DEFAULT_BEHIND_FOVEATE = 0.2;
const RAD_DEFAULT_CONE_FOVEATE = 0.4;
const COIT_TOWER_RAD_MODEL_MATRIX = new Float32Array([
  10, 0, 0, 0,
  0, 0, -10, 0,
  0, 10, 0, 0,
  0, 0, 0, 1
]);
const COIT_TOWER_RAD_INITIAL_VIEW_STATE = {
  position: [-0.858, 1.128, 2.203],
  bearing: 132.2360300882143,
  pitch: 12.17498746663756,
  fov: RAD_DEFAULT_FOV,
  fovy: RAD_DEFAULT_FOV,
  minPitch: FIRST_PERSON_MIN_PITCH,
  maxPitch: FIRST_PERSON_MAX_PITCH
} as FirstPersonViewState;
const SAVED_GAUSSIAN_SPLAT_URLS_KEY = 'loaders.gl.example-url-input.urls.v1.gaussian splat';
const ZSTD_MODULES = {
  'zstd-codec': zstdCodecModule.ZstdCodec || zstdCodecModule.default?.ZstdCodec
};

const INITIAL_VIEW_STATE = {
  target: [0, 0, 0],
  rotationX: 56,
  rotationOrbit: -25,
  orbitAxis: 'Z',
  fov: 48,
  minZoom: -4,
  maxZoom: 8,
  zoom: 1.4
} as OrbitViewState;

type ControllerMode = (typeof CONTROLLER_MODES)[number];

type RADRenderSettings = {
  /** Vertical field of view used by RAD preview cameras. */
  fov: number;
  /** Level-of-detail multiplier used for page priority and render budget. */
  levelOfDetail: number;
  /** Render-radius multiplier applied after RAD LoD selection. */
  lodRenderScale: number;
  /** Relative priority retained behind the active view. */
  behindFoveate: number;
  /** Relative priority retained around the active view cone. */
  coneFoveate: number;
};

type RADRenderProgress = {
  /** Number of source chunks resident in the RAD runtime. */
  residentChunkCount?: number;
  /** Number of decoded splats resident in the RAD runtime. */
  residentSplatCount?: number;
  /** Number of chunk requests currently active. */
  requestedChunkCount?: number;
  /** Number of resident chunks evicted by the runtime page store. */
  evictedChunkCount?: number;
  /** Number of active RAD render pages. */
  renderPageCount?: number;
  /** Number of splats uploaded into active RAD render pages. */
  renderPageSplatCount?: number;
  /** Number of splats in the latest render index buffers after engine culling. */
  renderSplatCount?: number;
  /** Number of splats that overflowed tile-local storage in the latest compute pass. */
  tileOverflowSplatCount?: number;
  /** Upload duration for the most recent chunk page. */
  lastUploadTimeMs?: number;
  /** Time from source load to the latest coherent LoD commit. */
  lastCommitTimeMs?: number;
};

/** Deck view state extended with FoV fields accepted at runtime. */
type GaussianSplatViewState = (OrbitViewState | FirstPersonViewState) & {
  /** Runtime FoV field consumed by deck.gl perspective views. */
  fov?: number;
  /** Runtime vertical FoV field consumed by deck.gl perspective views. */
  fovy?: number;
};

type GaussianSplatsAppState = {
  /** Loaded Arrow table wrapper or streaming loaders.gl Arrow table batches. */
  data: MeshArrowTable | AsyncIterable<ArrowTableBatch> | null;
  /** Loaded RAD source rendered through the direct RAD splat layer. */
  radSource: RADSource | null;
  /** First loaded table used for schema and row previews. */
  previewTable: MeshArrowTable | null;
  /** Number of splat rows loaded so far. */
  loadedSplatCount: number;
  /** Total source splat count when known. */
  totalSplatCount?: number;
  /** Current deck.gl view state. */
  viewState: GaussianSplatViewState;
  /** Active camera controller. */
  controllerMode: ControllerMode;
  /** RAD-specific camera and LoD controls. */
  radSettings: RADRenderSettings;
  /** RAD runtime page-store status. */
  radProgress?: RADRenderProgress;
  /** Whether the RAD camera has been idle long enough to request the settled detail budget. */
  isRADCameraSettled: boolean;
  /** Selected source URL shown in the URL picker. */
  selectedUrl: string;
  /** Whether source URLs are currently loading. */
  isLoading: boolean;
  /** Last successful load duration. */
  loadTimeMs?: number;
  /** Last load or render setup error. */
  error?: string | null;
};

/** Return default RAD controls matching Spark-style preview behavior. */
function getDefaultRADRenderSettings(): RADRenderSettings {
  return {
    fov: RAD_DEFAULT_FOV,
    levelOfDetail: RAD_DEFAULT_LEVEL_OF_DETAIL,
    lodRenderScale: RAD_DEFAULT_LOD_RENDER_SCALE,
    behindFoveate: RAD_DEFAULT_BEHIND_FOVEATE,
    coneFoveate: RAD_DEFAULT_CONE_FOVEATE
  };
}

/** Return RAD chunk budget scaled by the selected LoD and camera activity. */
function getRADMaxChunks(levelOfDetail: number, isCameraSettled: boolean = true): number {
  const baseMaxChunks = isCameraSettled
    ? RAD_PREVIEW_SETTLED_BASE_MAX_CHUNKS
    : RAD_PREVIEW_INTERACTIVE_BASE_MAX_CHUNKS;
  const scale = getRADLevelOfDetailBudgetScale(levelOfDetail);
  return Math.max(Math.round(baseMaxChunks * scale), 1);
}

/** Return RAD splat budget scaled by the selected LoD and camera activity. */
function getRADMaxSplats(levelOfDetail: number, isCameraSettled: boolean = true): number {
  const baseMaxSplats = isCameraSettled
    ? RAD_PREVIEW_SETTLED_BASE_MAX_SPLATS
    : RAD_PREVIEW_INTERACTIVE_BASE_MAX_SPLATS;
  const scale = getRADLevelOfDetailBudgetScale(levelOfDetail);
  return Math.max(Math.round(baseMaxSplats * scale), 1);
}

/** Return decoded RAD cache budget for the current chunk budget. */
function getRADMaxCachedChunks(maxChunks: number): number {
  return Math.max(RAD_PREVIEW_BASE_MAX_CACHED_CHUNKS, maxChunks * 2);
}

/** Return a normalized budget multiplier from a Spark-like LoD setting. */
function getRADLevelOfDetailBudgetScale(levelOfDetail: number): number {
  return Math.max(levelOfDetail, RAD_MIN_LEVEL_OF_DETAIL) / RAD_DEFAULT_LEVEL_OF_DETAIL;
}

/** Gaussian splats website example rendered through a WebGPU deck.gl canvas. */
export default function GaussianSplatsApp() {
  const loadRequestIndexRef = useRef(0);
  const radSettleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const defaultExample = GAUSSIAN_SPLAT_EXAMPLES[DEFAULT_GAUSSIAN_SPLAT_EXAMPLE_NAME];
  const initialSource = useMemo(
    () => getInitialGaussianSplatSource(defaultExample),
    [defaultExample]
  );
  const [state, setState] = useState<GaussianSplatsAppState>({
    data: null,
    radSource: null,
    previewTable: null,
    loadedSplatCount: 0,
    viewState: INITIAL_VIEW_STATE,
    controllerMode: 'orbit',
    radSettings: getDefaultRADRenderSettings(),
    radProgress: undefined,
    isRADCameraSettled: false,
    selectedUrl: initialSource.selectedUrl,
    isLoading: false,
    error: null
  });

  const scheduleRADSettledState = useCallback(() => {
    if (radSettleTimeoutRef.current) {
      clearTimeout(radSettleTimeoutRef.current);
    }
    radSettleTimeoutRef.current = setTimeout(() => {
      radSettleTimeoutRef.current = null;
      setState((currentState) =>
        currentState.radSource
          ? {
              ...currentState,
              isRADCameraSettled: true
            }
          : currentState
      );
    }, RAD_PREVIEW_SETTLE_DELAY_MS);
  }, []);

  useEffect(
    () => () => {
      if (radSettleTimeoutRef.current) {
        clearTimeout(radSettleTimeoutRef.current);
      }
    },
    []
  );

  const loadGaussianSplats = useCallback(async (sourceUrls: string[]): Promise<void> => {
    const loadRequestIndex = ++loadRequestIndexRef.current;
    const loadStartMs = Date.now();
    setState((currentState) => ({
      ...currentState,
      data: null,
      radSource: null,
      previewTable: null,
      loadedSplatCount: 0,
      totalSplatCount: undefined,
      radProgress: undefined,
      isRADCameraSettled: false,
      isLoading: true,
      loadTimeMs: undefined,
      error: null
    }));

    try {
      if (sourceUrls.length === 0) {
        throw new Error('Enter at least one Gaussian splat URL.');
      }

      if (loadRequestIndex !== loadRequestIndexRef.current) {
        return;
      }

      if (sourceUrls.length === 1 && getGaussianSplatSourceType(sourceUrls[0]) === 'rad') {
        const source = (await load(sourceUrls[0], RADSourceLoader, {
          worker: false
        })) as RADSource;
        const metadata = await source.getMetadata();
        if (loadRequestIndex !== loadRequestIndexRef.current) {
          return;
        }
        setState((currentState) => {
          const controllerMode = getRADControllerMode(sourceUrls[0], currentState.controllerMode);
          return {
            ...currentState,
            data: null,
            radSource: source,
            previewTable: null,
            loadedSplatCount: 0,
            totalSplatCount: metadata.count,
            radProgress: undefined,
            viewState: applyRADViewStateFov(
              getRADInitialViewState(sourceUrls[0], controllerMode),
              currentState.radSettings.fov
            ),
            controllerMode,
            isRADCameraSettled: false,
            isLoading: true,
            error: null
          };
        });
        scheduleRADSettledState();
        return;
      }

      setState((currentState) => ({
        ...currentState,
        radSource: null,
        isRADCameraSettled: false,
        data: trackGaussianSplatBatches(sourceUrls, {
          onBatch: (arrowTableBatch, loadedSplatCount) => {
            if (loadRequestIndex !== loadRequestIndexRef.current) {
              return;
            }
            const table = getMeshArrowTableFromBatch(arrowTableBatch);
            setState((currentState) => ({
              ...currentState,
              previewTable: currentState.previewTable || table,
              loadedSplatCount,
              viewState: currentState.previewTable
                ? currentState.viewState
                : getGaussianSplatViewState(table, currentState.controllerMode)
            }));
          },
          onComplete: () => {
            if (loadRequestIndex !== loadRequestIndexRef.current) {
              return;
            }
            setState((currentState) => ({
              ...currentState,
              isLoading: false,
              loadTimeMs: Date.now() - loadStartMs,
              error: null
            }));
          },
          onError: (error) => {
            if (loadRequestIndex !== loadRequestIndexRef.current) {
              return;
            }
            setState((currentState) => ({
              ...currentState,
              data: null,
              radSource: null,
              isRADCameraSettled: false,
              isLoading: false,
              error: error instanceof Error ? error.message : String(error)
            }));
          }
        }),
        error: null
      }));
    } catch (error) {
      if (loadRequestIndex === loadRequestIndexRef.current) {
        setState((currentState) => ({
          ...currentState,
          data: null,
          radSource: null,
          previewTable: null,
          isRADCameraSettled: false,
          isLoading: false,
          error: error instanceof Error ? error.message : String(error)
        }));
      }
    }
  }, [scheduleRADSettledState]);

  useEffect(() => {
    void loadGaussianSplats(initialSource.sourceUrls);

    return () => {
      loadRequestIndexRef.current++;
    };
  }, [initialSource, loadGaussianSplats]);

  const arrowPreview = useMemo(
    () => getArrowTablePreview(state.previewTable, state.loadedSplatCount),
    [state.previewTable, state.loadedSplatCount]
  );
  const urlOptions = useMemo(() => getGaussianSplatUrlOptions(), []);
  const widgets = useMemo(
    () => [
      new FullscreenWidget({id: 'gaussian-splats-fullscreen', placement: 'top-right'}),
      new StatsWidget({id: 'gaussian-splats-fps', placement: 'bottom-right', type: 'deck'})
    ],
    []
  );
  const handleRADLoadProgress = useCallback((progress: RADSplatLoadProgress) => {
    setState((currentState) => ({
      ...currentState,
      loadedSplatCount: progress.visibleSplatCount ?? progress.loadedSplatCount,
      totalSplatCount: progress.totalSplatCount || currentState.totalSplatCount,
      radProgress: {
        residentChunkCount: progress.residentChunkCount,
        residentSplatCount: progress.residentSplatCount,
        requestedChunkCount: progress.requestedChunkCount,
        evictedChunkCount: progress.evictedChunkCount,
        renderPageCount: progress.renderPageCount,
        renderPageSplatCount: progress.renderPageSplatCount,
        renderSplatCount: progress.renderSplatCount,
        tileOverflowSplatCount: progress.tileOverflowSplatCount,
        lastUploadTimeMs: progress.lastUploadTimeMs,
        lastCommitTimeMs: progress.lastCommitTimeMs
      },
      isLoading: progress.isLoading,
      loadTimeMs: progress.loadTimeMs,
      error: progress.error ?? null
    }));
  }, []);

  const layers = useMemo(() => {
    if (state.radSource) {
      const radMaxChunks = getRADMaxChunks(
        state.radSettings.levelOfDetail,
        state.isRADCameraSettled
      );
      const radMaxSplats = getRADMaxSplats(
        state.radSettings.levelOfDetail,
        state.isRADCameraSettled
      );
      return [
        new RADSplatLayer({
          id: 'gaussian-splats-rad-webgpu',
          coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
          data: state.radSource,
          pickable: false,
          opacity: RAD_SPLAT_LAYER_OPACITY,
          radiusScale: RAD_SPLAT_RADIUS_SCALE,
          radiusMinPixels: SPLAT_RADIUS_MIN_PIXELS,
          radiusMaxPixels: RAD_SPLAT_RADIUS_MAX_PIXELS,
          alphaScale: RAD_SPLAT_ALPHA_SCALE,
          alphaCutoff: RAD_SPLAT_ALPHA_CUTOFF,
          screenSizeCutoffPixels: 0,
          kernel2DSize: SPLAT_KERNEL_2D_SIZE,
          maxScreenSpaceSplatSize: RAD_SPLAT_MAX_SCREEN_SPACE_SIZE,
          modelMatrix: getRADModelMatrix(state.selectedUrl),
          renderMode: 'gpu',
          sortMode: 'tile',
          maxChunks: radMaxChunks,
          maxSplats: radMaxSplats,
          lodSplatCount: radMaxSplats,
          maxResidentSplats: radMaxSplats * 2,
          maxPagedSplats: radMaxSplats * 2,
          maxCachedChunks: getRADMaxCachedChunks(radMaxChunks),
          maxConcurrentChunkRequests: RAD_PREVIEW_MAX_CONCURRENT_CHUNK_REQUESTS,
          pruneLoadedLoDParents: true,
          lodSplatScale: state.radSettings.levelOfDetail,
          lodRenderScale: state.radSettings.lodRenderScale,
          behindFoveate: state.radSettings.behindFoveate,
          coneFoveate: state.radSettings.coneFoveate,
          onLoadProgress: handleRADLoadProgress
        })
      ];
    }

    return state.data
      ? [
          new SplatLayer({
            id: 'gaussian-splats-webgpu',
            coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
            data: state.data as any,
            pickable: false,
            opacity: SPLAT_LAYER_OPACITY,
            radiusScale: SPLAT_RADIUS_SCALE,
            radiusMinPixels: SPLAT_RADIUS_MIN_PIXELS,
            radiusMaxPixels: SPLAT_RADIUS_MAX_PIXELS,
            alphaScale: SPLAT_ALPHA_SCALE,
            alphaCutoff: SPLAT_ALPHA_CUTOFF,
            screenSizeCutoffPixels: SPLAT_SCREEN_SIZE_CUTOFF_PIXELS,
            kernel2DSize: SPLAT_KERNEL_2D_SIZE,
            maxScreenSpaceSplatSize: SPLAT_MAX_SCREEN_SPACE_SIZE,
            renderMode: 'gpu',
            sortMode: 'global'
          })
        ]
      : [];
  }, [
    handleRADLoadProgress,
    state.data,
    state.isRADCameraSettled,
    state.radSettings,
    state.radSource,
    state.selectedUrl
  ]);

  return (
    <div style={styles.page}>
      <div style={styles.controls}>
        <ExampleUrlInputCard<GaussianSplatExample>
          format={GAUSSIAN_SPLAT_FORMAT}
          selectedUrl={state.selectedUrl}
          urlOptions={urlOptions}
          onExampleSelect={(urlOption) => {
            const example = urlOption.example;
            setState((currentState) => ({...currentState, selectedUrl: urlOption.url}));
            void loadGaussianSplats(example ? getExampleUrls(example) : [urlOption.url]);
          }}
          onUrlChange={(url) => {
            setState((currentState) => ({...currentState, selectedUrl: url}));
            void loadGaussianSplats([url]);
          }}
        />
      </div>
      <div style={styles.workspace}>
        <div style={state.radSource ? {...styles.canvasCard, ...styles.radCanvasCard} : styles.canvasCard}>
          <DeckGL
            key={state.controllerMode}
            layers={layers}
            views={getViewForControllerMode(
              state.controllerMode,
              state.radSource ? state.radSettings.fov : undefined
            )}
            viewState={state.viewState}
            controller={{inertia: true}}
            widgets={widgets}
            deviceProps={{
              type: 'webgpu',
              adapters: [webgpuAdapter]
            }}
            onViewStateChange={({viewState}) => {
              if (state.radSource) {
                scheduleRADSettledState();
              }
              setState((currentState) => {
                return {
                  ...currentState,
                  viewState: viewState as GaussianSplatViewState,
                  isRADCameraSettled: currentState.radSource
                    ? false
                    : currentState.isRADCameraSettled
                };
              });
            }}
            parameters={
              {
                depthWriteEnabled: false,
                depthCompare: 'always'
              } as any
            }
          />
          <ControllerModeSwitch
            mode={state.controllerMode}
            onChange={(controllerMode) => {
              if (state.radSource) {
                scheduleRADSettledState();
              }
              setState((currentState) => ({
                ...currentState,
                controllerMode,
                isRADCameraSettled: currentState.radSource ? false : currentState.isRADCameraSettled,
                viewState: currentState.radSource
                  ? applyRADViewStateFov(
                      getRADInitialViewState(currentState.selectedUrl, controllerMode),
                      currentState.radSettings.fov
                    )
                  : currentState.previewTable
                    ? getGaussianSplatViewState(currentState.previewTable, controllerMode)
                    : getInitialViewState(controllerMode)
              }));
            }}
          />
          {state.radSource && (
            <RADRenderControls
              settings={state.radSettings}
              onChange={(radSettings) => {
                scheduleRADSettledState();
                setState((currentState) => ({
                  ...currentState,
                  radSettings,
                  isRADCameraSettled: false,
                  viewState: applyRADViewStateFov(currentState.viewState, radSettings.fov)
                }));
              }}
            />
          )}
          <div style={styles.statusPanel}>
            <span>
              {state.loadedSplatCount
                ? formatSplatCount(state.loadedSplatCount, state.totalSplatCount)
                : state.isLoading
                  ? 'Loading 0 splats'
                  : 'No table'}
            </span>
            {state.loadTimeMs !== undefined && <span>{state.loadTimeMs.toLocaleString()} ms</span>}
            {state.radSource && state.radProgress && (
              <span>{formatRADRuntimeProgress(state.radProgress)}</span>
            )}
            {state.error && <span>{state.error}</span>}
          </div>
        </div>
        <ArrowTableViewer preview={arrowPreview} />
      </div>
    </div>
  );
}

/** Return a deck.gl view matching the current controller mode. */
function getViewForControllerMode(
  controllerMode: ControllerMode,
  fov: number = RAD_DEFAULT_FOV
): OrbitView | FirstPersonView {
  return controllerMode === 'first-person'
    ? new FirstPersonView({near: 0.01, far: 100000, up: [0, 0, 1], fov, fovy: fov} as any)
    : new OrbitView({orbitAxis: 'Z', fov, fovy: fov} as any);
}

/** Return an initial camera for the selected controller mode. */
function getInitialViewState(controllerMode: ControllerMode): GaussianSplatViewState {
  return controllerMode === 'first-person'
    ? {
        position: [0, -6, 2],
        bearing: 0,
        pitch: FIRST_PERSON_INITIAL_PITCH,
        fov: RAD_DEFAULT_FOV,
        fovy: RAD_DEFAULT_FOV,
        minPitch: FIRST_PERSON_MIN_PITCH,
        maxPitch: FIRST_PERSON_MAX_PITCH
      }
    : INITIAL_VIEW_STATE;
}

/** Return a deck.gl view state with RAD FoV fields kept in sync. */
function applyRADViewStateFov(
  viewState: GaussianSplatViewState,
  fov: number
): GaussianSplatViewState {
  return {
    ...viewState,
    fov,
    fovy: fov
  } as GaussianSplatViewState;
}

/** Return the preferred controller mode for a RAD source. */
function getRADControllerMode(sourceUrl: string, controllerMode: ControllerMode): ControllerMode {
  return isCoitTowerRADSource(sourceUrl) ? 'first-person' : controllerMode;
}

/** Return a source-specific initial camera for RAD scenes when one is known. */
function getRADInitialViewState(
  sourceUrl: string,
  controllerMode: ControllerMode
): GaussianSplatViewState {
  if (hasRADInitialViewState(sourceUrl, controllerMode)) {
    return COIT_TOWER_RAD_INITIAL_VIEW_STATE;
  }
  return getInitialViewState(controllerMode);
}

/** Returns true when a RAD source has a hand-matched initial camera. */
function hasRADInitialViewState(sourceUrl: string, controllerMode: ControllerMode): boolean {
  return isCoitTowerRADSource(sourceUrl) && controllerMode === 'first-person';
}

/** Build a Z-up initial view from loaded Gaussian splat bounds. */
function getGaussianSplatViewState(
  table: MeshArrowTable,
  controllerMode: ControllerMode
): GaussianSplatViewState {
  return getGaussianSplatBoundsViewState(getPositionBounds(table), controllerMode);
}

/** Build a Z-up initial view from decoded Gaussian splat bounds. */
function getGaussianSplatBoundsViewState(
  bounds: RADSplatBounds,
  controllerMode: ControllerMode
): GaussianSplatViewState {
  const center = getBoundsCenter(bounds) || INITIAL_VIEW_STATE.target;
  const size = getBoundsSize(bounds);
  const horizontalSize = Math.max(size[0], size[1], Number.EPSILON);
  const diagonalSize = Math.max(getVectorLength(size), Number.EPSILON);

  if (controllerMode === 'first-person') {
    return {
      position: [center[0], center[1] - diagonalSize * 1.5, center[2] + size[2] * 0.35],
      bearing: 0,
      pitch: FIRST_PERSON_INITIAL_PITCH,
      minPitch: FIRST_PERSON_MIN_PITCH,
      maxPitch: FIRST_PERSON_MAX_PITCH
    };
  }

  return {
    ...INITIAL_VIEW_STATE,
    target: center,
    zoom: getOrbitZoom(horizontalSize)
  } as OrbitViewState;
}

/** Return a deck.gl model matrix for RAD sources that ship with Spark scene transforms. */
function getRADModelMatrix(sourceUrl: string): Float32Array | null {
  return isCoitTowerRADSource(sourceUrl) ? COIT_TOWER_RAD_MODEL_MATRIX : null;
}

/** Returns true for the Spark Coit Tower RAD fixture. */
function isCoitTowerRADSource(sourceUrl: string): boolean {
  return sourceUrl.includes('coit-40m-sh1-lod.rad');
}

/** Format loaded and total splat counts for the canvas status panel. */
function formatSplatCount(loadedSplatCount: number, totalSplatCount?: number): string {
  if (totalSplatCount && totalSplatCount > loadedSplatCount) {
    return `${loadedSplatCount.toLocaleString()} / ${totalSplatCount.toLocaleString()} splats`;
  }
  return `${loadedSplatCount.toLocaleString()} splats`;
}

/** Format RAD runtime counters for the canvas status panel. */
function formatRADRuntimeProgress(progress: RADRenderProgress): string {
  const chunks = progress.residentChunkCount ?? 0;
  const pages = progress.renderPageCount ?? 0;
  const renderSplats = progress.renderSplatCount ?? progress.renderPageSplatCount ?? 0;
  const requests = progress.requestedChunkCount ?? 0;
  const evictions = progress.evictedChunkCount ?? 0;
  const overflow = progress.tileOverflowSplatCount ?? 0;
  const uploadMs =
    progress.lastUploadTimeMs === undefined ? '-' : `${Math.round(progress.lastUploadTimeMs)} ms`;
  return `${chunks.toLocaleString()} chunks | ${pages} pages | ${renderSplats.toLocaleString()} draw | ${requests} req | ${evictions} evict | ${overflow.toLocaleString()} ovf | ${uploadMs}`;
}

/** Return POSITION column bounds for a Mesh Arrow table. */
function getPositionBounds(table: MeshArrowTable): {mins: [number, number, number]; maxs: [number, number, number]} {
  const positions = table.data.getChild('POSITION');
  const mins: [number, number, number] = [Infinity, Infinity, Infinity];
  const maxs: [number, number, number] = [-Infinity, -Infinity, -Infinity];

  for (let rowIndex = 0; rowIndex < table.data.numRows; rowIndex++) {
    const position = positions?.get(rowIndex) as ArrayLike<number> | null;
    if (!position) {
      continue;
    }
    for (let axisIndex = 0; axisIndex < 3; axisIndex++) {
      const value = Number(position[axisIndex]);
      mins[axisIndex] = Math.min(mins[axisIndex], value);
      maxs[axisIndex] = Math.max(maxs[axisIndex], value);
    }
  }

  return {mins, maxs};
}

/** Return a bounds center. */
function getBoundsCenter(bounds: {mins: [number, number, number]; maxs: [number, number, number]}): [number, number, number] | null {
  const center: [number, number, number] = [
    (bounds.mins[0] + bounds.maxs[0]) / 2,
    (bounds.mins[1] + bounds.maxs[1]) / 2,
    (bounds.mins[2] + bounds.maxs[2]) / 2
  ];
  return getFiniteVector(center);
}

/** Return bounds size. */
function getBoundsSize(bounds: {mins: [number, number, number]; maxs: [number, number, number]}): [number, number, number] {
  const size: [number, number, number] = [
    bounds.maxs[0] - bounds.mins[0],
    bounds.maxs[1] - bounds.mins[1],
    bounds.maxs[2] - bounds.mins[2]
  ];
  return getFiniteVector(size) || [1, 1, 1];
}

/** Return vector length. */
function getVectorLength(vector: readonly [number, number, number]): number {
  return Math.hypot(vector[0], vector[1], vector[2]);
}

/** Return a finite vector or null when bounds are unusable. */
function getFiniteVector(vector: [number, number, number]): [number, number, number] | null {
  return vector.every(Number.isFinite) ? vector : null;
}

/** Return a finite, bounded orbit zoom for a cloud extent. */
function getOrbitZoom(horizontalSize: number): number {
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
  const zoom = Math.log2(viewportWidth / Math.max(horizontalSize, Number.EPSILON)) - 1;
  return Number.isFinite(zoom)
    ? Math.min(Math.max(zoom, ORBIT_MIN_ZOOM), ORBIT_MAX_ZOOM)
    : INITIAL_VIEW_STATE.zoom;
}

/**
 * Loads Gaussian splat URLs in Arrow table batches while reporting row progress.
 */
async function* trackGaussianSplatBatches(
  sourceUrls: string[],
  callbacks: {
    onBatch: (arrowTableBatch: ArrowTableBatch, loadedSplatCount: number) => void;
    onComplete: () => void;
    onError: (error: unknown) => void;
  }
): AsyncIterable<ArrowTableBatch> {
  let loadedSplatCount = 0;

  try {
    for (const sourceUrl of sourceUrls) {
      const sourceType = getGaussianSplatSourceType(sourceUrl);
      if (sourceType === 'ply') {
        const sourceBatches = (await loadInBatches(sourceUrl, PLYLoader, {
          worker: false,
          ply: {shape: 'arrow-table'}
        })) as AsyncIterable<ArrowTableBatch | MeshArrowTable>;

        for await (const sourceBatch of sourceBatches) {
          const arrowTableBatch = normalizeArrowTableBatch(sourceBatch);
          loadedSplatCount += arrowTableBatch.length;
          callbacks.onBatch(arrowTableBatch, loadedSplatCount);
          yield arrowTableBatch;
        }
      } else if (sourceType === 'rad') {
        const source = (await load(sourceUrl, RADSourceLoader, {
          worker: false
        })) as RADSource;
        for await (const table of source.getChunkTables({
          maxChunks: getRADMaxChunks(RAD_DEFAULT_LEVEL_OF_DETAIL),
          maxSplats: getRADMaxSplats(RAD_DEFAULT_LEVEL_OF_DETAIL),
          maxConcurrentChunkRequests: RAD_PREVIEW_MAX_CONCURRENT_CHUNK_REQUESTS,
          pruneLoadedLoDParents: true,
          radChunk: {
            includeLoDTree: true,
            includeSphericalHarmonics: true
          }
        })) {
          const arrowTableBatch = normalizeArrowTableBatch(table);
          loadedSplatCount += arrowTableBatch.length;
          callbacks.onBatch(arrowTableBatch, loadedSplatCount);
          yield arrowTableBatch;
        }
      } else {
        const table = await load(sourceUrl, getGaussianSplatLoader(sourceType), {
          worker: false,
          modules: ZSTD_MODULES,
          splats: {shape: 'arrow-table'}
        });
        const arrowTableBatch = normalizeArrowTableBatch(table as MeshArrowTable);
        loadedSplatCount += arrowTableBatch.length;
        callbacks.onBatch(arrowTableBatch, loadedSplatCount);
        yield arrowTableBatch;
      }
    }
    callbacks.onComplete();
  } catch (error) {
    callbacks.onError(error);
    throw error;
  }
}

/**
 * Normalizes current PLY streaming output to the loaders.gl Arrow table batch wrapper.
 */
function normalizeArrowTableBatch(sourceBatch: ArrowTableBatch | MeshArrowTable): ArrowTableBatch {
  if ('batchType' in sourceBatch && sourceBatch.batchType === 'data') {
    return sourceBatch;
  }

  return {
    shape: 'arrow-table',
    batchType: 'data',
    schema: sourceBatch.schema,
    data: sourceBatch.data,
    length: sourceBatch.data.numRows
  };
}

/** Returns a Mesh Arrow table wrapper for one Arrow table batch. */
function getMeshArrowTableFromBatch(arrowTableBatch: ArrowTableBatch): MeshArrowTable {
  return {
    shape: 'arrow-table',
    topology: 'point-list',
    schema: arrowTableBatch.schema,
    data: arrowTableBatch.data
  };
}

type ArrowTablePreview = {
  /** Total row count. */
  rowCount: number;
  /** Field names and Arrow type strings. */
  columns: {name: string; type: string}[];
  /** Small row sample rendered by the viewer. */
  rows: string[][];
};

/** Return source URLs for a Gaussian splat example. */
function getExampleUrls(example: GaussianSplatExample): string[] {
  return example.urls?.length ? example.urls : [example.url];
}

/** Initial Gaussian splat source restored before the first load starts. */
type InitialGaussianSplatSource = {
  /** URL shown in the URL input. */
  selectedUrl: string;
  /** Source URLs to load on mount. */
  sourceUrls: string[];
};

/** Return the initial source, preferring the last saved URL when available. */
function getInitialGaussianSplatSource(defaultExample: GaussianSplatExample): InitialGaussianSplatSource {
  const storedUrl = readStoredGaussianSplatUrl();
  if (!storedUrl) {
    return {selectedUrl: defaultExample.url, sourceUrls: getExampleUrls(defaultExample)};
  }

  const storedExample = Object.values(GAUSSIAN_SPLAT_EXAMPLES).find(
    example => example.url === storedUrl || example.urls?.includes(storedUrl)
  );
  return {
    selectedUrl: storedUrl,
    sourceUrls: storedExample ? getExampleUrls(storedExample) : [storedUrl]
  };
}

/** Return the most recently saved Gaussian splat URL. */
function readStoredGaussianSplatUrl(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const savedUrls = JSON.parse(
      window.localStorage.getItem(SAVED_GAUSSIAN_SPLAT_URLS_KEY) || '[]'
    );
    const firstSavedUrl = Array.isArray(savedUrls) ? savedUrls[0] : null;
    if (typeof firstSavedUrl === 'string') {
      return firstSavedUrl;
    }
    return typeof firstSavedUrl?.url === 'string' ? firstSavedUrl.url : null;
  } catch {
    return null;
  }
}

/** Return Gaussian splat URL options for the shared URL picker. */
function getGaussianSplatUrlOptions(): UrlOption<GaussianSplatExample>[] {
  return Object.entries(GAUSSIAN_SPLAT_EXAMPLES).map(([exampleName, example]) => ({
    format: GAUSSIAN_SPLAT_FORMAT,
    example,
    group: 'Examples',
    label: exampleName,
    pointCount: example.pointCount,
    url: example.url
  }));
}

/** Returns the Gaussian splat source type from a URL extension. */
function getGaussianSplatSourceType(sourceUrl: string): GaussianSplatExample['type'] {
  const pathname = sourceUrl.split(/[?#]/)[0].toLowerCase();
  if (pathname.endsWith('.splat')) {
    return 'splat';
  }
  if (pathname.endsWith('.ksplat')) {
    return 'ksplat';
  }
  if (pathname.endsWith('.spz')) {
    return 'spz';
  }
  if (pathname.endsWith('.rad')) {
    return 'rad';
  }
  if (pathname.endsWith('.ply')) {
    return 'ply';
  }
  throw new Error('Enter a Gaussian splat URL ending in .ply, .splat, .ksplat, .spz, or .rad.');
}

/** Returns the whole-file loader for binary Gaussian splat formats. */
function getGaussianSplatLoader(sourceType: Exclude<GaussianSplatExample['type'], 'ply' | 'rad'>) {
  switch (sourceType) {
    case 'splat':
      return SPLATLoader;
    case 'ksplat':
      return KSPLATLoader;
    case 'spz':
      return SPZLoader;
    default:
      throw new Error(`Unsupported Gaussian splat source type: ${sourceType}`);
  }
}

/** Build a compact schema and row preview from the first Mesh Arrow table batch. */
function getArrowTablePreview(
  table: MeshArrowTable | null,
  loadedSplatCount: number
): ArrowTablePreview | null {
  if (!table) {
    return null;
  }

  const arrowTable = table.data;
  const fields = arrowTable.schema.fields.slice(0, PREVIEW_COLUMN_COUNT);
  const columns = fields.map((field) => ({name: field.name, type: String(field.type)}));
  const rows: string[][] = [];

  for (let rowIndex = 0; rowIndex < Math.min(PREVIEW_ROW_COUNT, arrowTable.numRows); rowIndex++) {
    rows.push(
      fields.map((field) => {
        const column = arrowTable.getChild(field.name);
        return formatArrowValue(column?.get(rowIndex));
      })
    );
  }

  return {rowCount: loadedSplatCount, columns, rows};
}

/** Format one Arrow cell for compact display. */
function formatArrowValue(value: unknown): string {
  if (value == null) {
    return '';
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value.toPrecision(4) : String(value);
  }
  if (ArrayBuffer.isView(value) || Array.isArray(value)) {
    return `[${Array.from(value as ArrayLike<unknown>).map(formatArrowValue).join(', ')}]`;
  }
  return String(value);
}

/** Render a compact Arrow schema and sample row viewer. */
function ArrowTableViewer({preview}: {preview: ArrowTablePreview | null}) {
  if (!preview) {
    return (
      <aside style={styles.viewer}>
        <div style={styles.viewerTitle}>Arrow Table</div>
        <div style={styles.viewerEmpty}>No table loaded</div>
      </aside>
    );
  }

  return (
    <aside style={styles.viewer}>
      <div style={styles.viewerTitle}>Arrow Table</div>
      <div style={styles.viewerMeta}>
        {preview.rowCount.toLocaleString()} rows | {preview.columns.length} preview columns
      </div>
      <div style={styles.schemaList}>
        {preview.columns.map((column) => (
          <div key={column.name} style={styles.schemaRow}>
            <span style={styles.columnName}>{column.name}</span>
            <span style={styles.columnType}>{column.type}</span>
          </div>
        ))}
      </div>
      <div style={styles.tableScroller}>
        <table style={styles.table}>
          <thead>
            <tr>
              {preview.columns.map((column) => (
                <th key={column.name} style={styles.tableHeader}>
                  {column.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {preview.rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((value, columnIndex) => (
                  <td key={preview.columns[columnIndex]?.name || columnIndex} style={styles.tableCell}>
                    {value}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </aside>
  );
}

/** Render RAD camera and LoD controls. */
function RADRenderControls({
  settings,
  onChange
}: {
  settings: RADRenderSettings;
  onChange: (settings: RADRenderSettings) => void;
}) {
  const updateSetting = (setting: keyof RADRenderSettings, value: number) => {
    onChange({
      ...settings,
      [setting]: value
    });
  };

  return (
    <div style={styles.radControls} role="group" aria-label="RAD render controls">
      <ControlSlider
        label="FoV"
        value={settings.fov}
        min={RAD_MIN_FOV}
        max={RAD_MAX_FOV}
        step={1}
        onChange={value => updateSetting('fov', value)}
      />
      <ControlSlider
        label="LoD"
        value={settings.levelOfDetail}
        min={RAD_MIN_LEVEL_OF_DETAIL}
        max={RAD_MAX_LEVEL_OF_DETAIL}
        step={0.1}
        onChange={value => updateSetting('levelOfDetail', value)}
      />
      <ControlSlider
        label="Scale"
        value={settings.lodRenderScale}
        min={0.5}
        max={2.5}
        step={0.05}
        onChange={value => updateSetting('lodRenderScale', value)}
      />
      <ControlSlider
        label="Behind"
        value={settings.behindFoveate}
        min={0}
        max={1}
        step={0.05}
        onChange={value => updateSetting('behindFoveate', value)}
      />
      <ControlSlider
        label="Cone"
        value={settings.coneFoveate}
        min={0}
        max={1}
        step={0.05}
        onChange={value => updateSetting('coneFoveate', value)}
      />
    </div>
  );
}

/** Render one compact numeric slider row. */
function ControlSlider({
  label,
  value,
  min,
  max,
  step,
  onChange
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <label style={styles.controlRow}>
      <span style={styles.controlLabel}>{label}</span>
      <input
        style={styles.controlRange}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onInput={event => onChange(Number(event.currentTarget.value))}
        onChange={event => onChange(Number(event.target.value))}
      />
      <span style={styles.controlValue}>{formatControlValue(value, step)}</span>
    </label>
  );
}

/** Format a slider value at the precision implied by its step. */
function formatControlValue(value: number, step: number): string {
  if (step >= 1) {
    return Math.round(value).toString();
  }
  if (step >= 0.1) {
    return value.toFixed(1);
  }
  return value.toFixed(2);
}

/** Render the camera controller selector. */
function ControllerModeSwitch({
  mode,
  onChange
}: {
  mode: ControllerMode;
  onChange: (mode: ControllerMode) => void;
}) {
  return (
    <div style={styles.controllerSwitch} role="group" aria-label="Camera controller">
      {CONTROLLER_MODES.map((controllerMode) => (
        <button
          key={controllerMode}
          type="button"
          style={
            controllerMode === mode
              ? {...styles.controllerButton, ...styles.controllerButtonActive}
              : styles.controllerButton
          }
          onClick={() => onChange(controllerMode)}
        >
          {controllerMode === 'orbit' ? 'Orbit' : 'First Person'}
        </button>
      ))}
    </div>
  );
}

const styles = {
  page: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    minHeight: 620,
    width: '100%',
    padding: 12,
    boxSizing: 'border-box',
    background: '#f8fafc'
  },
  controls: {
    width: '100%'
  },
  workspace: {
    display: 'flex',
    flex: '1 1 auto',
    gap: 12,
    minHeight: 0,
    alignItems: 'stretch',
    flexWrap: 'wrap'
  },
  canvasCard: {
    position: 'relative',
    flex: '1 1 560px',
    minHeight: 500,
    overflow: 'hidden',
    border: '1px solid rgba(148, 163, 184, 0.32)',
    borderRadius: 8,
    background: '#05070a'
  },
  radCanvasCard: {
    background: '#d8eef2'
  },
  statusPanel: {
    position: 'absolute',
    left: 12,
    bottom: 12,
    display: 'flex',
    flexWrap: 'wrap',
    gap: 12,
    alignItems: 'center',
    maxWidth: 'calc(100% - 24px)',
    padding: '7px 10px',
    borderRadius: 6,
    color: '#e5e7eb',
    background: 'rgba(2, 6, 23, 0.78)',
    fontSize: 12,
    lineHeight: '16px',
    pointerEvents: 'none'
  },
  controllerSwitch: {
    position: 'absolute',
    left: 12,
    top: 12,
    display: 'flex',
    gap: 4,
    padding: 4,
    borderRadius: 7,
    border: '1px solid rgba(148, 163, 184, 0.32)',
    background: 'rgba(2, 6, 23, 0.78)'
  },
  controllerButton: {
    minWidth: 72,
    padding: '6px 9px',
    border: '1px solid transparent',
    borderRadius: 5,
    color: '#cbd5e1',
    background: 'transparent',
    fontSize: 12,
    lineHeight: '16px',
    cursor: 'pointer'
  },
  controllerButtonActive: {
    color: '#0f172a',
    background: '#f8fafc'
  },
  radControls: {
    position: 'absolute',
    right: 12,
    top: 52,
    display: 'grid',
    gap: 8,
    width: 236,
    padding: 10,
    borderRadius: 7,
    border: '1px solid rgba(148, 163, 184, 0.32)',
    color: '#e5e7eb',
    background: 'rgba(2, 6, 23, 0.78)',
    fontSize: 12,
    lineHeight: '16px',
    zIndex: 1
  },
  controlRow: {
    display: 'grid',
    gridTemplateColumns: '56px minmax(96px, 1fr) 42px',
    gap: 8,
    alignItems: 'center'
  },
  controlLabel: {
    color: '#cbd5e1',
    fontWeight: 600
  },
  controlRange: {
    width: '100%',
    accentColor: '#38bdf8'
  },
  controlValue: {
    color: '#7dd3fc',
    fontVariantNumeric: 'tabular-nums',
    textAlign: 'right'
  },
  viewer: {
    flex: '0 1 420px',
    minWidth: 320,
    maxHeight: 680,
    overflow: 'hidden',
    border: '1px solid #cbd5e1',
    borderRadius: 8,
    background: '#ffffff',
    color: '#0f172a',
    display: 'flex',
    flexDirection: 'column'
  },
  viewerTitle: {
    padding: '10px 12px 4px',
    fontSize: 14,
    fontWeight: 700
  },
  viewerMeta: {
    padding: '0 12px 8px',
    color: '#475569',
    fontSize: 12
  },
  viewerEmpty: {
    padding: 12,
    color: '#64748b',
    fontSize: 13
  },
  schemaList: {
    borderTop: '1px solid #e2e8f0',
    borderBottom: '1px solid #e2e8f0'
  },
  schemaRow: {
    display: 'grid',
    gridTemplateColumns: 'minmax(120px, 1fr) minmax(120px, 1fr)',
    gap: 8,
    padding: '5px 12px',
    fontSize: 12
  },
  columnName: {
    color: '#0f172a',
    fontFamily: 'Menlo, Consolas, monospace',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  columnType: {
    color: '#64748b',
    fontFamily: 'Menlo, Consolas, monospace',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  tableScroller: {
    overflow: 'auto'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontFamily: 'Menlo, Consolas, monospace',
    fontSize: 11
  },
  tableHeader: {
    position: 'sticky',
    top: 0,
    padding: '6px 8px',
    borderBottom: '1px solid #e2e8f0',
    color: '#334155',
    background: '#f8fafc',
    textAlign: 'left'
  },
  tableCell: {
    maxWidth: 180,
    padding: '5px 8px',
    borderBottom: '1px solid #f1f5f9',
    color: '#0f172a',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  }
} as const;

/** Render the Gaussian splats example into a standalone DOM container. */
export function renderToDOM(container: HTMLDivElement) {
  createRoot(container).render(<GaussianSplatsApp />);
}
