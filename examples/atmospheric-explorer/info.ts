// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {mountExampleInfoBox} from '../website/shared/example-info-panel';

export function mountAtmosphericInfo(host: HTMLElement): () => void {
  return mountExampleInfoBox(host, {
    id: 'atmospheric-explorer-info',
    title: 'Dataset information & credits',
    widthPx: 320,
    sections: [
      {
        id: 'about',
        title: 'About',
        html: `<h3>Atmospheric Explorer</h3>
<p>Interactive ECMWF Integrated Forecasting System (IFS) atmospheric analysis fields on a deck.gl globe, loaded through loaders.gl.</p>
<p>Explore selected variables, times, and pressure levels without downloading the full archive.</p>
<p>This is an independent vis.gl example, not an official ECMWF or Beyond Weather product.</p>`
      },
      {
        id: 'dataset',
        title: 'Dataset',
        html: `<h3>ECMWF IFS analysis</h3>
<p>Original global atmospheric analyses produced by the <a href="https://www.ecmwf.int/" target="_blank" rel="noopener noreferrer">European Centre for Medium-Range Weather Forecasts (ECMWF)</a>.</p>
<p><a href="https://www.beyondweather.ai/" target="_blank" rel="noopener noreferrer">Beyond Weather</a> prepared and published the cloud-native N320 archive using Zarr and Icechunk.</p>
<p><a href="https://registry.opendata.aws/beyond-weather-ecmwf-ifs-analysis/" target="_blank" rel="noopener noreferrer">AWS Open Data registry ↗</a></p>
<p><a href="https://github.com/Beyond-Weather-Git/open-data-examples/tree/main/ifs-analysis-n320" target="_blank" rel="noopener noreferrer">Dataset examples ↗</a></p>`
      },
      {
        id: 'attributions',
        title: 'Attributions',
        html: `<h3>Inspiration</h3>
<p>Visualization concept inspired by <strong>Jannes van Ingen</strong> and <a href="https://www.linkedin.com/posts/jannesvaningen_opendata-weather-machinelearning-ugcPost-7516842522401226753-A2TN/" target="_blank" rel="noopener noreferrer">his post announcing the open ECMWF dataset ↗</a>.</p>
<h3>Original data and copyright</h3>
<p><strong>This service is based on data and products of the European Centre for Medium-Range Weather Forecasts (ECMWF).</strong></p>
<p>ECMWF IFS operational analysis, 2011–2024. Copyright © 2011–2024 European Centre for Medium-Range Weather Forecasts (ECMWF). Source: <a href="https://www.ecmwf.int/" target="_blank" rel="noopener noreferrer">www.ecmwf.int</a>.</p>
<h3>Modifications</h3>
<p>Beyond Weather selected variables and pressure levels, converted GRIB to Icechunk Zarr, and applied lossy bit rounding. This example selects fields and renders values as colored geographic points.</p>
<h3>Distribution and licensing</h3>
<p>Data distributed via <a href="https://registry.opendata.aws/beyond-weather-ecmwf-ifs-analysis/" target="_blank" rel="noopener noreferrer">AWS Open Data</a> and <a href="https://earthmover.io/" target="_blank" rel="noopener noreferrer">Earthmover</a>. The dataset is described as <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0</a>. See <a href="https://apps.ecmwf.int/datasets/licences/general/" target="_blank" rel="noopener noreferrer">ECMWF terms of use</a>.</p>
<h3>ECMWF disclaimer</h3>
<p>ECMWF does not accept any liability whatsoever for any error or omission in the data, their availability, or for any loss or damage arising from their use.</p>
<h3>Software</h3>
<p><a href="https://loaders.gl/">loaders.gl</a>, <a href="https://deck.gl/">deck.gl</a>, <a href="https://github.com/manzt/zarrita.js">Zarrita</a>, <a href="https://github.com/earth-mover/icechunk">Icechunk</a>, and their contributors.</p>
<p>See ATTRIBUTION.md for the full citation and requirements.</p>`
      }
    ]
  });
}
