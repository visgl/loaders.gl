import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createDataSource } from '@loaders.gl/core';
import { OMEZarrSourceLoader, loadZarrConsolidatedMetadata } from '@loaders.gl/zarr';
const ROOT_URL = '/spatialdata.zarr';
/**
 * Website demo for browsing a SpatialData-style Zarr root and opening an OME-Zarr image group.
 */
export default function App(props = {}) {
    const [consolidated, setConsolidated] = useState(null);
    const [selectedPath, setSelectedPath] = useState(null);
    const [metadata, setMetadata] = useState(null);
    const [displayMode, setDisplayMode] = useState('rgb');
    const [selectedLevel, setSelectedLevel] = useState(0);
    const [rasterCanvas, setRasterCanvas] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        let cancelled = false;
        const loadRoot = async () => {
            setLoading(true);
            try {
                const nextConsolidated = await loadZarrConsolidatedMetadata(ROOT_URL);
                if (cancelled) {
                    return;
                }
                const imagePaths = getImagePaths(nextConsolidated);
                setConsolidated(nextConsolidated);
                setSelectedPath(imagePaths[0] || null);
                setError(null);
            }
            catch (nextError) {
                if (!cancelled) {
                    setError(getErrorMessage(nextError));
                }
            }
            finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };
        void loadRoot();
        return () => {
            cancelled = true;
        };
    }, []);
    useEffect(() => {
        if (!selectedPath) {
            return;
        }
        let cancelled = false;
        const source = createDataSource(ROOT_URL, [OMEZarrSourceLoader], {
            zarr: { path: selectedPath },
            omezarr: {}
        });
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
            }
            catch (nextError) {
                if (!cancelled) {
                    setError(getErrorMessage(nextError));
                }
            }
            finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };
        void loadImage();
        return () => {
            cancelled = true;
        };
    }, [selectedPath]);
    useEffect(() => {
        if (!metadata || !selectedPath) {
            return;
        }
        let cancelled = false;
        const source = createDataSource(ROOT_URL, [OMEZarrSourceLoader], {
            zarr: { path: selectedPath },
            omezarr: {}
        });
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
            }
            catch (nextError) {
                if (!cancelled) {
                    setError(getErrorMessage(nextError));
                }
            }
            finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };
        void loadRaster();
        return () => {
            cancelled = true;
        };
    }, [displayMode, metadata, selectedLevel, selectedPath]);
    const imagePaths = useMemo(() => (consolidated ? getImagePaths(consolidated) : []), [consolidated]);
    const displayModes = useMemo(() => {
        if (!metadata) {
            return [];
        }
        return [
            ...(metadata.bandCount >= 3 ? [{ label: 'RGB composite', value: 'rgb' }] : []),
            ...Array.from({ length: metadata.bandCount }, (_, index) => ({
                label: metadata.channels[index]?.name || `Channel ${index}`,
                value: `channel-${index}`
            }))
        ];
    }, [metadata]);
    return (_jsxs("div", { style: {
            display: 'grid',
            gridTemplateColumns: props.hideChrome ? '1fr' : 'minmax(0, 1fr) 360px',
            height: '100%',
            background: '#0f172a',
            color: '#e2e8f0'
        }, children: [_jsx("div", { style: {
                    position: 'relative',
                    overflow: 'auto',
                    background: 'linear-gradient(45deg, rgba(255,255,255,0.04) 25%, transparent 25%), linear-gradient(-45deg, rgba(255,255,255,0.04) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.04) 75%), linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.04) 75%)',
                    backgroundSize: '28px 28px',
                    backgroundPosition: '0 0, 0 14px, 14px -14px, -14px 0'
                }, children: _jsx("div", { style: {
                        minHeight: '100%',
                        display: 'grid',
                        placeItems: 'center',
                        padding: '24px'
                    }, children: rasterCanvas ? (_jsx("canvas", { ref: canvas => {
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
                        }, style: {
                            width: 'min(100%, 920px)',
                            height: 'auto',
                            borderRadius: '6px',
                            boxShadow: '0 20px 50px rgba(15, 23, 42, 0.45)',
                            background: '#020617'
                        } })) : (_jsx("div", { style: { color: '#cbd5e1', fontSize: '15px' }, children: loading ? 'Loading raster...' : 'Select an image group' })) }) }), !props.hideChrome ? (_jsxs("aside", { style: {
                    display: 'grid',
                    alignContent: 'start',
                    gap: '20px',
                    padding: '20px',
                    overflow: 'auto',
                    background: '#e2e8f0',
                    color: '#0f172a'
                }, children: [props.children ? _jsx("div", { style: { fontSize: '15px', lineHeight: 1.5 }, children: props.children }) : null, _jsxs("section", { children: [_jsx("div", { style: SECTION_TITLE_STYLE, children: "Root Store" }), _jsx("div", { style: MONO_STYLE, children: ROOT_URL }), _jsx("div", { style: { marginTop: '12px', display: 'grid', gap: '8px' }, children: (consolidated?.topLevelGroups || []).map((group) => (_jsx("div", { style: TAG_STYLE, children: group }, group))) })] }), _jsxs("section", { children: [_jsx("div", { style: SECTION_TITLE_STYLE, children: "Image Groups" }), _jsx("div", { style: { display: 'grid', gap: '8px', marginTop: '12px' }, children: imagePaths.map(path => (_jsx("button", { type: "button", onClick: () => setSelectedPath(path), style: {
                                        ...BUTTON_STYLE,
                                        background: selectedPath === path ? '#0f172a' : '#ffffff',
                                        color: selectedPath === path ? '#f8fafc' : '#0f172a',
                                        borderColor: selectedPath === path ? '#0f172a' : '#cbd5e1'
                                    }, children: path }, path))) })] }), metadata ? (_jsxs(_Fragment, { children: [_jsxs("section", { children: [_jsx("div", { style: SECTION_TITLE_STYLE, children: "Display" }), _jsxs("div", { style: { display: 'grid', gap: '8px', marginTop: '12px' }, children: [_jsxs("label", { style: LABEL_STYLE, children: [_jsx("span", { children: "Level" }), _jsx("select", { value: selectedLevel, onChange: event => setSelectedLevel(Number(event.target.value)), style: INPUT_STYLE, children: metadata.levels.map((level) => (_jsxs("option", { value: level.level, children: [level.path, " (", level.width, " x ", level.height, ")"] }, level.level))) })] }), _jsxs("label", { style: LABEL_STYLE, children: [_jsx("span", { children: "Mode" }), _jsx("select", { value: displayMode, onChange: event => setDisplayMode(event.target.value), style: INPUT_STYLE, children: displayModes.map(mode => (_jsx("option", { value: mode.value, children: mode.label }, mode.value))) })] })] })] }), _jsxs("section", { children: [_jsx("div", { style: SECTION_TITLE_STYLE, children: "Metadata" }), _jsxs("dl", { style: { display: 'grid', gridTemplateColumns: '110px 1fr', gap: '8px 12px', marginTop: '12px' }, children: [_jsx("dt", { style: TERM_STYLE, children: "Name" }), _jsx("dd", { style: DESC_STYLE, children: metadata.name || 'Untitled' }), _jsx("dt", { style: TERM_STYLE, children: "Size" }), _jsxs("dd", { style: DESC_STYLE, children: [metadata.width, " x ", metadata.height] }), _jsx("dt", { style: TERM_STYLE, children: "Bands" }), _jsx("dd", { style: DESC_STYLE, children: metadata.bandCount }), _jsx("dt", { style: TERM_STYLE, children: "Dtype" }), _jsx("dd", { style: DESC_STYLE, children: metadata.dtype }), _jsx("dt", { style: TERM_STYLE, children: "Labels" }), _jsx("dd", { style: DESC_STYLE, children: metadata.labels.join(', ') }), _jsx("dt", { style: TERM_STYLE, children: "Tile Size" }), _jsxs("dd", { style: DESC_STYLE, children: [metadata.tileSize?.width, " x ", metadata.tileSize?.height] })] })] })] })) : null, error ? (_jsx("div", { style: {
                            padding: '12px',
                            borderRadius: '6px',
                            background: '#fee2e2',
                            color: '#991b1b',
                            fontSize: '14px',
                            lineHeight: 1.5
                        }, children: error })) : null] })) : null] }));
}
const SECTION_TITLE_STYLE = {
    fontSize: '12px',
    fontWeight: 700,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    color: '#475569'
};
const MONO_STYLE = {
    marginTop: '8px',
    fontSize: '13px',
    lineHeight: 1.5,
    fontFamily: 'ui-monospace, SFMono-Regular, SFMono-Regular, Menlo, Consolas, monospace',
    wordBreak: 'break-word'
};
const TAG_STYLE = {
    display: 'inline-flex',
    alignItems: 'center',
    width: 'fit-content',
    padding: '6px 10px',
    borderRadius: '6px',
    background: '#ffffff',
    border: '1px solid #cbd5e1',
    fontSize: '13px'
};
const BUTTON_STYLE = {
    padding: '10px 12px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    textAlign: 'left',
    fontSize: '13px',
    cursor: 'pointer'
};
const LABEL_STYLE = {
    display: 'grid',
    gap: '6px',
    fontSize: '13px',
    fontWeight: 600
};
const INPUT_STYLE = {
    padding: '10px 12px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    background: '#ffffff',
    color: '#0f172a',
    fontSize: '13px'
};
const TERM_STYLE = {
    margin: 0,
    fontSize: '13px',
    fontWeight: 600,
    color: '#475569'
};
const DESC_STYLE = {
    margin: 0,
    fontSize: '13px',
    lineHeight: 1.4
};
function getImagePaths(consolidated) {
    const imagePaths = new Set();
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
function getRequestedChannels(metadata, displayMode) {
    if (displayMode === 'rgb') {
        return metadata.bandCount >= 3
            ? [0, 1, 2]
            : Array.from({ length: metadata.bandCount }, (_, index) => index);
    }
    return [Number(displayMode.replace('channel-', ''))];
}
function renderRasterToCanvas(raster) {
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
    }
    else {
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
function getChannelRange(values) {
    let minimum = Number.POSITIVE_INFINITY;
    let maximum = Number.NEGATIVE_INFINITY;
    for (let index = 0; index < values.length; index++) {
        const value = values[index];
        minimum = Math.min(minimum, value);
        maximum = Math.max(maximum, value);
    }
    if (!Number.isFinite(minimum) || !Number.isFinite(maximum) || minimum === maximum) {
        return { minimum: 0, maximum: 1 };
    }
    return { minimum, maximum };
}
function scaleToByte(value, minimum, maximum) {
    if (maximum <= minimum) {
        return 0;
    }
    const normalized = (value - minimum) / (maximum - minimum);
    return Math.max(0, Math.min(255, Math.round(normalized * 255)));
}
function getErrorMessage(error) {
    return error instanceof Error ? error.message : String(error);
}
export function renderToDOM(container) {
    createRoot(container).render(_jsx(App, {}));
}
