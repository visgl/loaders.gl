// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import React, {useEffect, useMemo, useRef, useState} from 'react';
import {createRoot} from 'react-dom/client';

import {createDataSource} from '@loaders.gl/core';
import type {RasterData} from '@loaders.gl/loader-utils';
import type {OMEZarrSourceLoaderMetadata, ZarrConsolidatedMetadata} from '@loaders.gl/zarr';
import {OMEZarrSourceLoader, loadZarrConsolidatedMetadata} from '@loaders.gl/zarr';

type AppProps = {
  hideChrome?: boolean;
  children?: React.ReactNode;
  rootUrl?: string;
};

type DisplayMode = 'composite' | `channel-${number}`;

type DatasetPreset = {
  /** Stable identifier used by the preset selector. */
  id: string;
  /** Short user-facing preset name. */
  label: string;
  /** Supporting text describing the dataset. */
  description: string;
  /** Zarr store root. */
  url: string;
};

const DATASET_PRESETS: DatasetPreset[] = [
  {
    id: 'local-spatialdata',
    label: 'Local SpatialData fixture',
    description: 'Small offline Zarr v3 fixture with SpatialData-style groups.',
    url: '/spatialdata.zarr'
  },
  {
    id: 'idr-nuclei',
    label: 'IDR cell nuclei',
    description: 'Remote two-channel 3D nuclear segmentation image from IDR.',
    url: 'https://livingobjects.ebi.ac.uk/idr/zarr/v0.4/idr0062A/6001240.zarr'
  },
  {
    id: 'idr-histopathology',
    label: 'IDR histopathology mosaic',
    description: 'Remote 21,115 × 16,433 RGB tissue mosaic with eight pyramid levels.',
    url: 'https://livingobjects.ebi.ac.uk/idr/zarr/v0.4/idr0073A/9798462.zarr'
  }
];

const WHEEL_LEVEL_THRESHOLD = 160;
const WHEEL_LEVEL_COOLDOWN = 180;
const COMPOSITE_COLORS = ['FF0000', '00FF00', '0000FF'];

/**
 * Website demo for browsing a SpatialData-style Zarr root and opening an OME-Zarr image group.
 */
export default function App(props: AppProps = {}) {
  const initialRootUrl = props.rootUrl || DATASET_PRESETS[0].url;
  const [rootUrl, setRootUrl] = useState(initialRootUrl);
  const [rootUrlInput, setRootUrlInput] = useState(initialRootUrl);
  const [consolidated, setConsolidated] = useState<ZarrConsolidatedMetadata | null>(null);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [requireConsolidatedMetadata, setRequireConsolidatedMetadata] = useState(true);
  const [metadata, setMetadata] = useState<OMEZarrSourceLoaderMetadata | null>(null);
  const [displayMode, setDisplayMode] = useState<DisplayMode>('composite');
  const [selectedLevel, setSelectedLevel] = useState(0);
  const [rasterCanvas, setRasterCanvas] = useState<HTMLCanvasElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const wheelDelta = useRef(0);
  const lastWheelTime = useRef(0);
  const lastWheelLevelChangeTime = useRef(0);
  const source = useMemo(
    () =>
      selectedPath !== null
        ? createDataSource(rootUrl, [OMEZarrSourceLoader], {
            zarr: {
              path: selectedPath || null,
              requireConsolidatedMetadata
            }
          })
        : null,
    [requireConsolidatedMetadata, rootUrl, selectedPath]
  );

  useEffect(() => {
    let cancelled = false;
    const abortController = new AbortController();

    const loadRoot = async () => {
      setLoading(true);
      setConsolidated(null);
      setSelectedPath(null);
      setMetadata(null);
      setRasterCanvas(null);
      setError(null);
      try {
        const nextConsolidated = await loadZarrConsolidatedMetadata(rootUrl, {
          signal: abortController.signal
        });
        if (cancelled) {
          return;
        }

        const imagePaths = getImagePaths(nextConsolidated);
        setConsolidated(nextConsolidated);
        setRequireConsolidatedMetadata(true);
        setSelectedPath(imagePaths[0] ?? '');
        setError(null);
      } catch (nextError) {
        if (!cancelled && !abortController.signal.aborted) {
          // Standalone OME-Zarr images commonly omit consolidated metadata.
          // Let the source inspect the root group directly in that case.
          setRequireConsolidatedMetadata(false);
          setSelectedPath('');
          setError(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadRoot();

    return () => {
      cancelled = true;
      abortController.abort();
    };
  }, [rootUrl]);

  useEffect(() => {
    if (!source) {
      return;
    }

    let cancelled = false;

    const loadImage = async () => {
      setLoading(true);
      try {
        const nextMetadata = await source.getMetadata();
        if (cancelled) {
          return;
        }

        setMetadata(nextMetadata);
        setDisplayMode(nextMetadata.bandCount >= 2 ? 'composite' : 'channel-0');
        setSelectedLevel(getInitialDisplayLevel(nextMetadata));
        setError(null);
      } catch (nextError) {
        if (!cancelled) {
          setError(getErrorMessage(nextError));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadImage();

    return () => {
      cancelled = true;
    };
  }, [source]);

  useEffect(() => {
    if (!metadata || !source) {
      return;
    }

    let cancelled = false;
    const abortController = new AbortController();

    const loadRaster = async () => {
      setLoading(true);
      try {
        const requestedChannels = getRequestedChannels(metadata, displayMode);
        const raster = await source.getRaster({
          level: selectedLevel,
          channels: requestedChannels,
          signal: abortController.signal
        });
        if (cancelled) {
          return;
        }
        const channelColors = requestedChannels.map(
          (channel, index) => metadata.channels[channel]?.color || COMPOSITE_COLORS[index]
        );
        setRasterCanvas(renderRasterToCanvas(raster, channelColors));
        setError(null);
      } catch (nextError) {
        if (!cancelled) {
          setError(getErrorMessage(nextError));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadRaster();

    return () => {
      cancelled = true;
      abortController.abort();
    };
  }, [displayMode, metadata, selectedLevel, source]);

  const imagePaths = useMemo(() => {
    if (consolidated) {
      const paths = getImagePaths(consolidated);
      return paths.length > 0 ? paths : [''];
    }
    return selectedPath !== null ? [''] : [];
  }, [consolidated, selectedPath]);

  const selectedPreset = DATASET_PRESETS.find(preset => preset.url === rootUrl);

  const displayModes = useMemo(() => {
    if (!metadata) {
      return [];
    }

    return [
      ...(metadata.bandCount >= 2
        ? [{label: 'Color composite', value: 'composite' as const}]
        : []),
      ...Array.from({length: metadata.bandCount}, (_, index) => ({
        label: metadata.channels[index]?.name || `Channel ${index}`,
        value: `channel-${index}` as const
      }))
    ];
  }, [metadata]);

  const handleRootUrlChange = (nextRootUrl: string) => {
    const normalizedRootUrl = nextRootUrl.trim().replace(/\/+$/, '');
    if (!normalizedRootUrl) {
      return;
    }
    setRootUrlInput(normalizedRootUrl);
    setRootUrl(normalizedRootUrl);
  };

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (!metadata || metadata.levels.length < 2) {
      return;
    }

    event.preventDefault();
    const now = performance.now();
    const deltaScale = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 240 : 1;
    const delta = event.deltaY * deltaScale;

    if (
      now - lastWheelTime.current > 260 ||
      Math.sign(delta) !== Math.sign(wheelDelta.current)
    ) {
      wheelDelta.current = 0;
    }

    lastWheelTime.current = now;
    wheelDelta.current += delta;
    if (
      Math.abs(wheelDelta.current) < WHEEL_LEVEL_THRESHOLD ||
      now - lastWheelLevelChangeTime.current < WHEEL_LEVEL_COOLDOWN
    ) {
      return;
    }

    const direction = wheelDelta.current > 0 ? 1 : -1;
    setSelectedLevel(level => Math.max(0, Math.min(metadata.levels.length - 1, level + direction)));
    wheelDelta.current = 0;
    lastWheelLevelChangeTime.current = now;
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: props.hideChrome ? '1fr' : 'minmax(0, 1fr) 360px',
        height: '100%',
        background: '#0f172a',
        color: '#e2e8f0'
      }}
    >
      <div
        onWheel={handleWheel}
        style={{
          position: 'relative',
          overflow: 'hidden',
          background:
            'linear-gradient(45deg, rgba(255,255,255,0.04) 25%, transparent 25%), linear-gradient(-45deg, rgba(255,255,255,0.04) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.04) 75%), linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.04) 75%)',
          backgroundSize: '28px 28px',
          backgroundPosition: '0 0, 0 14px, 14px -14px, -14px 0'
        }}
      >
        {metadata && metadata.levels.length > 1 ? (
          <div style={LEVEL_OVERLAY_STYLE}>
            <strong>
              Level {selectedLevel}: {metadata.levels[selectedLevel].width} ×{' '}
              {metadata.levels[selectedLevel].height}
            </strong>
            <span style={{opacity: 0.72}}>Scroll or use the trackpad to change level</span>
          </div>
        ) : null}
        <div
          style={{
            minHeight: '100%',
            display: 'grid',
            placeItems: 'center',
            padding: '24px'
          }}
        >
          {rasterCanvas ? (
            <canvas
              ref={canvas => {
                if (!canvas || !rasterCanvas) {
                  return;
                }
                canvas.width = rasterCanvas.width;
                canvas.height = rasterCanvas.height;
                const context = canvas.getContext('2d');
                if (context) {
                  context.clearRect(0, 0, canvas.width, canvas.height);
                  context.drawImage(rasterCanvas, 0, 0);
                }
              }}
              style={{
                width: 'auto',
                height: 'auto',
                maxWidth: 'min(100%, 920px)',
                maxHeight: 'calc(100vh - 48px)',
                borderRadius: '6px',
                boxShadow: '0 20px 50px rgba(15, 23, 42, 0.45)',
                background: '#020617'
              }}
            />
          ) : (
            <div style={{color: '#cbd5e1', fontSize: '15px'}}>
              {loading ? 'Loading raster...' : 'Select an image group'}
            </div>
          )}
        </div>
      </div>

      {!props.hideChrome ? (
        <aside
          style={{
            display: 'grid',
            alignContent: 'start',
            gap: '20px',
            padding: '20px',
            overflow: 'auto',
            background: '#e2e8f0',
            color: '#0f172a'
          }}
        >
          {props.children ? <div style={{fontSize: '15px', lineHeight: 1.5}}>{props.children}</div> : null}

          <section>
            <div style={SECTION_TITLE_STYLE}>Dataset</div>
            <div style={{display: 'grid', gap: '8px', marginTop: '12px'}}>
              <select
                aria-label="Dataset preset"
                value={selectedPreset?.id || 'custom'}
                onChange={event => {
                  const preset = DATASET_PRESETS.find(item => item.id === event.target.value);
                  if (preset) {
                    handleRootUrlChange(preset.url);
                  }
                }}
                style={INPUT_STYLE}
              >
                {DATASET_PRESETS.map(preset => (
                  <option key={preset.id} value={preset.id}>
                    {preset.label}
                  </option>
                ))}
                <option value="custom">Custom URL</option>
              </select>
              <form
                onSubmit={event => {
                  event.preventDefault();
                  handleRootUrlChange(rootUrlInput);
                }}
                style={{display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: '8px'}}
              >
                <input
                  aria-label="Zarr store URL"
                  type="text"
                  inputMode="url"
                  value={rootUrlInput}
                  onChange={event => setRootUrlInput(event.target.value)}
                  style={{...INPUT_STYLE, minWidth: 0}}
                />
                <button type="submit" style={LOAD_BUTTON_STYLE}>
                  Load
                </button>
              </form>
              {selectedPreset ? (
                <div style={{fontSize: '12px', lineHeight: 1.45, color: '#64748b'}}>
                  {selectedPreset.description}
                </div>
              ) : null}
            </div>
          </section>

          <section>
            <div style={SECTION_TITLE_STYLE}>Root Store</div>
            <div style={MONO_STYLE}>{rootUrl}</div>
            <div style={{marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '8px'}}>
              {(consolidated?.topLevelGroups || []).map((group: string) => (
                <div key={group} style={TAG_STYLE}>
                  {group}
                </div>
              ))}
            </div>
          </section>

          <section>
            <div style={SECTION_TITLE_STYLE}>Image Groups</div>
            <div style={{display: 'grid', gap: '8px', marginTop: '12px'}}>
              {imagePaths.map(path => (
                <button
                  key={path}
                  type="button"
                  onClick={() => setSelectedPath(path)}
                  style={{
                    ...BUTTON_STYLE,
                    background: selectedPath === path ? '#0f172a' : '#ffffff',
                    color: selectedPath === path ? '#f8fafc' : '#0f172a',
                    borderColor: selectedPath === path ? '#0f172a' : '#cbd5e1'
                  }}
                >
                  {path || '(root image)'}
                </button>
              ))}
            </div>
          </section>

          {metadata ? (
            <>
              <section>
                <div style={SECTION_TITLE_STYLE}>Display</div>
                <div style={{display: 'grid', gap: '8px', marginTop: '12px'}}>
                  <label style={LABEL_STYLE}>
                    <span>Level</span>
                    <select
                      value={selectedLevel}
                      onChange={event => setSelectedLevel(Number(event.target.value))}
                      style={INPUT_STYLE}
                    >
                      {metadata.levels.map((level) => (
                        <option key={level.level} value={level.level}>
                          {level.path} ({level.width} x {level.height})
                        </option>
                      ))}
                    </select>
                  </label>
                  <label style={LABEL_STYLE}>
                    <span>Mode</span>
                    <select
                      value={displayMode}
                      onChange={event => setDisplayMode(event.target.value as DisplayMode)}
                      style={INPUT_STYLE}
                    >
                      {displayModes.map(mode => (
                        <option key={mode.value} value={mode.value}>
                          {mode.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </section>

              <section>
                <div style={SECTION_TITLE_STYLE}>Metadata</div>
                <dl style={{display: 'grid', gridTemplateColumns: '110px 1fr', gap: '8px 12px', marginTop: '12px'}}>
                  <dt style={TERM_STYLE}>Name</dt>
                  <dd style={DESC_STYLE}>{metadata.name || 'Untitled'}</dd>
                  <dt style={TERM_STYLE}>Size</dt>
                  <dd style={DESC_STYLE}>
                    {metadata.width} x {metadata.height}
                  </dd>
                  <dt style={TERM_STYLE}>Bands</dt>
                  <dd style={DESC_STYLE}>{metadata.bandCount}</dd>
                  <dt style={TERM_STYLE}>Dtype</dt>
                  <dd style={DESC_STYLE}>{metadata.dtype}</dd>
                  <dt style={TERM_STYLE}>Labels</dt>
                  <dd style={DESC_STYLE}>{metadata.labels.join(', ')}</dd>
                  <dt style={TERM_STYLE}>Tile Size</dt>
                  <dd style={DESC_STYLE}>
                    {metadata.tileSize?.width} x {metadata.tileSize?.height}
                  </dd>
                </dl>
              </section>
            </>
          ) : null}

          {error ? (
            <div
              style={{
                padding: '12px',
                borderRadius: '6px',
                background: '#fee2e2',
                color: '#991b1b',
                fontSize: '14px',
                lineHeight: 1.5
              }}
            >
              {error}
            </div>
          ) : null}
        </aside>
      ) : null}
    </div>
  );
}

const SECTION_TITLE_STYLE: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 700,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: '#475569'
};

const MONO_STYLE: React.CSSProperties = {
  marginTop: '8px',
  fontSize: '13px',
  lineHeight: 1.5,
  fontFamily: 'ui-monospace, SFMono-Regular, SFMono-Regular, Menlo, Consolas, monospace',
  wordBreak: 'break-word'
};

const TAG_STYLE: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  width: 'fit-content',
  padding: '6px 10px',
  borderRadius: '6px',
  background: '#ffffff',
  border: '1px solid #cbd5e1',
  fontSize: '13px'
};

const BUTTON_STYLE: React.CSSProperties = {
  padding: '10px 12px',
  borderRadius: '6px',
  border: '1px solid #cbd5e1',
  textAlign: 'left',
  fontSize: '13px',
  cursor: 'pointer'
};

const LABEL_STYLE: React.CSSProperties = {
  display: 'grid',
  gap: '6px',
  fontSize: '13px',
  fontWeight: 600
};

const INPUT_STYLE: React.CSSProperties = {
  padding: '10px 12px',
  borderRadius: '6px',
  border: '1px solid #cbd5e1',
  background: '#ffffff',
  color: '#0f172a',
  fontSize: '13px'
};

const LOAD_BUTTON_STYLE: React.CSSProperties = {
  ...INPUT_STYLE,
  fontWeight: 700,
  cursor: 'pointer'
};

const LEVEL_OVERLAY_STYLE: React.CSSProperties = {
  position: 'absolute',
  zIndex: 1,
  top: '16px',
  left: '16px',
  display: 'grid',
  gap: '3px',
  padding: '9px 12px',
  border: '1px solid rgba(148, 163, 184, 0.25)',
  borderRadius: '8px',
  background: 'rgba(2, 6, 23, 0.78)',
  boxShadow: '0 8px 24px rgba(2, 6, 23, 0.24)',
  color: '#e2e8f0',
  fontSize: '12px',
  lineHeight: 1.35,
  pointerEvents: 'none'
};

const TERM_STYLE: React.CSSProperties = {
  margin: 0,
  fontSize: '13px',
  fontWeight: 600,
  color: '#475569'
};

const DESC_STYLE: React.CSSProperties = {
  margin: 0,
  fontSize: '13px',
  lineHeight: 1.4
};

/** Extracts image group paths from consolidated SpatialData metadata. */
function getImagePaths(consolidated: ZarrConsolidatedMetadata): string[] {
  const imagePaths = new Set<string>();

  for (const key of Object.keys(consolidated.metadata)) {
    if (!key.startsWith('images/')) {
      continue;
    }

    const path = key.replace(/\/\.(?:zgroup|zattrs|zarray)$/i, '');
    const pathParts = path.split('/').filter(Boolean);
    if (pathParts.length >= 2) {
      imagePaths.add(pathParts.slice(0, 2).join('/'));
    }
  }

  return [...imagePaths].sort();
}

/** Resolves the channel indices represented by a display mode. */
function getRequestedChannels(
  metadata: OMEZarrSourceLoaderMetadata,
  displayMode: DisplayMode
): number[] {
  if (displayMode === 'composite') {
    const availableChannels = Array.from({length: metadata.bandCount}, (_, index) => index);
    const activeChannels = availableChannels.filter(
      channel => metadata.channels[channel]?.active !== false
    );
    return (activeChannels.length > 0 ? activeChannels : availableChannels).slice(0, 3);
  }

  return [Number(displayMode.replace('channel-', ''))];
}

/** Selects a preview level that keeps the initial remote image request modest. */
function getInitialDisplayLevel(metadata: OMEZarrSourceLoaderMetadata): number {
  const previewLevel = metadata.levels.find(level => level.width <= 1200 && level.height <= 900);
  return previewLevel?.level ?? metadata.levels.at(-1)?.level ?? 0;
}

/** Converts planar raster channels into a displayable RGBA canvas. */
function renderRasterToCanvas(raster: RasterData, channelColors: string[]): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = raster.width;
  canvas.height = raster.height;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Unable to create canvas context.');
  }

  const imageData = context.createImageData(raster.width, raster.height);
  const rgba = imageData.data;
  const pixelCount = raster.width * raster.height;
  const channels = Array.isArray(raster.data) ? raster.data : [raster.data];

  if (channels.length >= 2) {
    const channelRanges = channels.map(getChannelRange);
    const colors = channels.map((_, index) => parseHexColor(channelColors[index]));

    for (let index = 0; index < pixelCount; index++) {
      const rgbaIndex = index * 4;
      let red = 0;
      let green = 0;
      let blue = 0;
      for (let channelIndex = 0; channelIndex < channels.length; channelIndex++) {
        const range = channelRanges[channelIndex];
        const intensity =
          scaleToByte(channels[channelIndex][index], range.minimum, range.maximum) / 255;
        red += colors[channelIndex][0] * intensity;
        green += colors[channelIndex][1] * intensity;
        blue += colors[channelIndex][2] * intensity;
      }
      rgba[rgbaIndex + 0] = Math.min(255, Math.round(red));
      rgba[rgbaIndex + 1] = Math.min(255, Math.round(green));
      rgba[rgbaIndex + 2] = Math.min(255, Math.round(blue));
      rgba[rgbaIndex + 3] = 255;
    }
  } else {
    const values = channels[0];
    const valueRange = getChannelRange(values);

    for (let index = 0; index < pixelCount; index++) {
      const rgbaIndex = index * 4;
      const value = scaleToByte(values[index], valueRange.minimum, valueRange.maximum);
      rgba[rgbaIndex + 0] = value;
      rgba[rgbaIndex + 1] = value;
      rgba[rgbaIndex + 2] = value;
      rgba[rgbaIndex + 3] = 255;
    }
  }

  context.putImageData(imageData, 0, 0);
  return canvas;
}

/** Parses an OME hexadecimal channel color into an RGB tuple. */
function parseHexColor(color = 'FFFFFF'): [number, number, number] {
  const normalizedColor = color.replace(/^#/, '').padEnd(6, 'F').slice(0, 6);
  return [
    Number.parseInt(normalizedColor.slice(0, 2), 16),
    Number.parseInt(normalizedColor.slice(2, 4), 16),
    Number.parseInt(normalizedColor.slice(4, 6), 16)
  ];
}

/** Computes the finite sample range used for display normalization. */
function getChannelRange(values: ArrayLike<number>): {minimum: number; maximum: number} {
  let minimum = Number.POSITIVE_INFINITY;
  let maximum = Number.NEGATIVE_INFINITY;

  for (let index = 0; index < values.length; index++) {
    const value = values[index];
    minimum = Math.min(minimum, value);
    maximum = Math.max(maximum, value);
  }

  if (!Number.isFinite(minimum) || !Number.isFinite(maximum) || minimum === maximum) {
    return {minimum: 0, maximum: 1};
  }

  return {minimum, maximum};
}

/** Scales one numeric sample into an unsigned display byte. */
function scaleToByte(value: number, minimum: number, maximum: number): number {
  if (maximum <= minimum) {
    return 0;
  }

  const normalized = (value - minimum) / (maximum - minimum);
  return Math.max(0, Math.min(255, Math.round(normalized * 255)));
}

/** Converts an unknown thrown value into display text. */
function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** Mounts the standalone example into a DOM container. */
export function renderToDOM(container: HTMLElement) {
  createRoot(container).render(<App />);
}
