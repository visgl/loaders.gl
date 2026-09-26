import React, {useEffect, useId, useRef, useState} from 'react';
import {load} from '@loaders.gl/core';
import {ArcGISImageServerSourceLoader} from '@loaders.gl/arcgis';
import type {LERCData} from '@loaders.gl/lerc';

const SERVICE_URL =
  'https://sampleserver6.arcgisonline.com/arcgis/rest/services/NLCDLandCover2001/ImageServer';

/** Loads a small live ImageServer raster and visualizes its numeric values and validity mask. */
export default function ArcGISRasterApp(): React.ReactElement {
  const canvasReference = useRef<HTMLCanvasElement>(null);
  const [raster, setRaster] = useState<LERCData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [band, setBand] = useState(0);
  const [maximum, setMaximum] = useState(100);
  const [pixelIndex, setPixelIndex] = useState(0);
  const [requestNumber, setRequestNumber] = useState(0);
  const controlsId = useId();

  useEffect(() => {
    const controller = new AbortController();
    setError(null);
    setRaster(null);
    setBand(0);
    void (async () => {
      try {
        const source = await load(SERVICE_URL, ArcGISImageServerSourceLoader);
        const result = await source.exportRaster(
          {
            bbox: [-100, 35, -95, 40],
            bboxSR: 4326,
            imageSR: 4326,
            width: 128,
            height: 128,
            pixelType: 'F32'
          },
          controller.signal
        );
        if (!controller.signal.aborted) {
          if (result.depthCount !== 1)
            throw new Error('This example requires one value per pixel.');
          setRaster(result);
          setMaximum(result.statistics[0]?.maxValue || 100);
        }
      } catch (loadError) {
        if (!controller.signal.aborted)
          setError(loadError instanceof Error ? loadError.message : String(loadError));
      }
    })();
    return () => controller.abort();
  }, [requestNumber]);

  useEffect(() => {
    const context = canvasReference.current?.getContext('2d');
    if (!raster || !context) return;
    const image = context.createImageData(raster.width, raster.height);
    const values = raster.pixels[band];
    const mask = raster.bandMasks?.[band] || raster.mask;
    for (let index = 0; index < raster.width * raster.height; index++) {
      const value = Number(values[index]);
      const valid = (!mask || Boolean(mask[index])) && Number.isFinite(value);
      const intensity = Math.max(0, Math.min(1, value / Math.max(1, maximum)));
      image.data[index * 4] = Math.round(intensity * 255);
      image.data[index * 4 + 1] = Math.round((1 - intensity) * 180);
      image.data[index * 4 + 2] = 160;
      image.data[index * 4 + 3] = valid ? 255 : 0;
    }
    context.putImageData(image, 0, 0);
  }, [raster, band, maximum]);

  const mask = raster?.bandMasks?.[band] || raster?.mask;
  const value = raster && (!mask || mask[pixelIndex]) ? raster.pixels[band][pixelIndex] : 'NoData';
  return (
    <section
      style={{padding: '1rem', overflow: 'auto', height: '100%'}}
      aria-label="Live ArcGIS numerical raster"
    >
      <p>Live ImageServer export · 128 × 128 pixels · no cached or simulated fallback</p>
      <p>
        USGS NLCD land-cover sample, hosted by Esri. Colors below are an illustrative numeric ramp,
        not the official categorical land-cover legend.
      </p>
      <button type="button" onClick={() => setRequestNumber(number => number + 1)}>
        Reload raster
      </button>
      {error ? (
        <p role="alert">Unable to load the live service: {error}</p>
      ) : !raster ? (
        <p role="status">Loading LERC values…</p>
      ) : null}
      {raster ? (
        <>
          <p>
            {raster.pixels.length} band(s), {raster.pixelType}; valid-data mask applied.
          </p>
          <label htmlFor={`${controlsId}-band`}>Band </label>
          <select
            id={`${controlsId}-band`}
            value={band}
            onChange={event => setBand(Number(event.target.value))}
          >
            {raster.pixels.map((_pixels, index) => (
              <option key={index} value={index}>
                {index + 1}
              </option>
            ))}
          </select>
          <label htmlFor={`${controlsId}-maximum`}> Color maximum </label>
          <input
            id={`${controlsId}-maximum`}
            type="range"
            min="1"
            max="255"
            value={maximum}
            onChange={event => setMaximum(Number(event.target.value))}
          />
          <output>{maximum}</output>
          <div>
            <canvas
              ref={canvasReference}
              width={raster.width}
              height={raster.height}
              style={{width: 'min(100%, 384px)', imageRendering: 'pixelated', background: '#ddd'}}
              aria-label="Raster values colored from green to magenta"
            >
              Numeric raster preview
            </canvas>
          </div>
          <label htmlFor={`${controlsId}-pixel`}>Pixel index </label>
          <input
            id={`${controlsId}-pixel`}
            type="number"
            min="0"
            max={raster.width * raster.height - 1}
            value={pixelIndex}
            onChange={event =>
              setPixelIndex(
                Math.max(
                  0,
                  Math.min(raster.width * raster.height - 1, Number(event.target.value) || 0)
                )
              )
            }
          />
          <output aria-live="polite"> Value: {String(value)}</output>
        </>
      ) : null}
      <p>
        <a href={`${SERVICE_URL}?f=pjson`} target="_blank" rel="noreferrer">
          Service metadata and attribution
        </a>
      </p>
    </section>
  );
}
