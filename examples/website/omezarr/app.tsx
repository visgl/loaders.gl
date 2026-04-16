// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import React, {useEffect, useMemo, useState} from 'react';
import {createRoot} from 'react-dom/client';

import {createDataSource} from '@loaders.gl/core';
import type {RasterData} from '@loaders.gl/loader-utils';
import type {
  OMEZarrImageSource,
  OMEZarrSourceLoaderMetadata,
  ZarrConsolidatedMetadata
} from '@loaders.gl/zarr';
import {OMEZarrSourceLoader, loadZarrConsolidatedMetadata} from '@loaders.gl/zarr';

type AppProps = {
  hideChrome?: boolean;
  children?: React.ReactNode;
  rootUrl?: string;
};

type DisplayMode = 'rgb' | `channel-${number}`;

/**
 * Website demo for browsing a SpatialData-style Zarr root and opening an OME-Zarr image group.
 */
export default function App(props: AppProps = {}) {
  const rootUrl = props.rootUrl || '/spatialdata.zarr';
  const [consolidated, setConsolidated] = useState<ZarrConsolidatedMetadata | null>(null);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<OMEZarrSourceLoaderMetadata | null>(null);
  const [displayMode, setDisplayMode] = useState<DisplayMode>('rgb');
  const [selectedLevel, setSelectedLevel] = useState(0);
  const [rasterCanvas, setRasterCanvas] = useState<HTMLCanvasElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadRoot = async () => {
      setLoading(true);
      try {
        const nextConsolidated = await loadZarrConsolidatedMetadata(rootUrl);
        if (cancelled) {
          return;
        }

        const imagePaths = getImagePaths(nextConsolidated);
        setConsolidated(nextConsolidated);
        setSelectedPath(imagePaths[0] || null);
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

    void loadRoot();

    return () => {
      cancelled = true;
    };
  }, [rootUrl]);

  useEffect(() => {
    if (!selectedPath) {
      return;
    }

    let cancelled = false;
    const source = createDataSource(rootUrl, [OMEZarrSourceLoader], {
      zarr: {path: selectedPath},
      omezarr: {interleaved: false, defaultChannels: undefined}
    }) as OMEZarrImageSource;

    const loadImage = async () => {
      setLoading(true);
      try {
        const nextMetadata = await source.getMetadata();
        if (cancelled) {
          return;
        }

        setMetadata(nextMetadata);
        setDisplayMode(nextMetadata.bandCount >= 3 ? 'rgb' : 'channel-0');
        setSelectedLevel(0);
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
  }, [rootUrl, selectedPath]);

  useEffect(() => {
    if (!metadata || !selectedPath) {
      return;
    }

    let cancelled = false;
    const source = createDataSource(rootUrl, [OMEZarrSourceLoader], {
      zarr: {path: selectedPath},
      omezarr: {interleaved: false, defaultChannels: undefined}
    }) as OMEZarrImageSource;

    const loadRaster = async () => {
      setLoading(true);
      try {
        const raster = await source.getRaster({
          level: selectedLevel,
          channels: getRequestedChannels(metadata, displayMode)
        });
        if (cancelled) {
          return;
        }

        setRasterCanvas(renderRasterToCanvas(raster));
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
    };
  }, [displayMode, metadata, rootUrl, selectedLevel, selectedPath]);

  const imagePaths = useMemo(() => (consolidated ? getImagePaths(consolidated) : []), [consolidated]);

  const displayModes = useMemo(() => {
    if (!metadata) {
      return [];
    }

    return [
      ...(metadata.bandCount >= 3 ? [{label: 'RGB composite', value: 'rgb' as const}] : []),
      ...Array.from({length: metadata.bandCount}, (_, index) => ({
        label: metadata.channels[index]?.name || `Channel ${index}`,
        value: `channel-${index}` as const
      }))
    ];
  }, [metadata]);

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
        style={{
          position: 'relative',
          overflow: 'auto',
          background:
            'linear-gradient(45deg, rgba(255,255,255,0.04) 25%, transparent 25%), linear-gradient(-45deg, rgba(255,255,255,0.04) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.04) 75%), linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.04) 75%)',
          backgroundSize: '28px 28px',
          backgroundPosition: '0 0, 0 14px, 14px -14px, -14px 0'
        }}
      >
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
                width: 'min(100%, 920px)',
                height: 'auto',
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
            <div style={SECTION_TITLE_STYLE}>Root Store</div>
            <div style={MONO_STYLE}>{rootUrl}</div>
            <div style={{marginTop: '12px', display: 'grid', gap: '8px'}}>
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
                  {path}
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

function getRequestedChannels(
  metadata: OMEZarrSourceLoaderMetadata,
  displayMode: DisplayMode
): number[] {
  if (displayMode === 'rgb') {
    return metadata.bandCount >= 3
      ? [0, 1, 2]
      : Array.from({length: metadata.bandCount}, (_, index) => index);
  }

  return [Number(displayMode.replace('channel-', ''))];
}

function renderRasterToCanvas(raster: RasterData): HTMLCanvasElement {
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

  if (channels.length >= 3) {
    const [red, green, blue] = channels;
    const redRange = getChannelRange(red);
    const greenRange = getChannelRange(green);
    const blueRange = getChannelRange(blue);

    for (let index = 0; index < pixelCount; index++) {
      const rgbaIndex = index * 4;
      rgba[rgbaIndex + 0] = scaleToByte(red[index], redRange.minimum, redRange.maximum);
      rgba[rgbaIndex + 1] = scaleToByte(green[index], greenRange.minimum, greenRange.maximum);
      rgba[rgbaIndex + 2] = scaleToByte(blue[index], blueRange.minimum, blueRange.maximum);
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

function scaleToByte(value: number, minimum: number, maximum: number): number {
  if (maximum <= minimum) {
    return 0;
  }

  const normalized = (value - minimum) / (maximum - minimum);
  return Math.max(0, Math.min(255, Math.round(normalized * 255)));
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function renderToDOM(container: HTMLElement) {
  createRoot(container).render(<App />);
}
