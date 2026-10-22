import {Deck, _GlobeView as GlobeView} from '@deck.gl/core';
import {ScatterplotLayer} from '@deck.gl/layers';
import {createDataSource} from '@loaders.gl/core';
import {ZarrArraySourceLoader} from '@loaders.gl/scientific/zarr';
import {readIcechunkField} from './icechunk';
import {mountAtmosphericInfo} from './info';
import {expandReducedGaussianGrid, finiteRange, colorForValue, type GaussianGrid} from './grid';

type Configuration = {
  root: string;
  array: string;
  dimensions: string[];
  grid?: GaussianGrid;
  selection: Record<string, number>;
  label?: string;
  storage?: 'zarr' | 'icechunk';
  reference?: {branch: string} | {tag: string} | {snapshot: string};
};

const rootInput = document.querySelector<HTMLInputElement>('#root')!;
const configInput = document.querySelector<HTMLTextAreaElement>('#config')!;
const status = document.querySelector<HTMLElement>('#status')!;
const legend = document.querySelector<HTMLElement>('#legend')!;
const loadButton = document.querySelector<HTMLButtonElement>('#load')!;
const deck = new Deck({
  parent: document.querySelector<HTMLElement>('#map')!,
  views: [new GlobeView()],
  initialViewState: {longitude: 0, latitude: 20, zoom: 0},
  controller: true,
  layers: []
});

const destroyInfo = mountAtmosphericInfo(document.querySelector<HTMLElement>('#panels')!);
let controller: AbortController | null = null;
const params = new URLSearchParams(location.search);
rootInput.value = params.get('root') || 'https://beyond-weather-ecmwf-ifs-analysis.s3.us-east-2.amazonaws.com/data.zarr';
configInput.value = JSON.stringify({
  storage: 'icechunk',
  reference: {branch: 'main'},
  array: '2m_temperature',
  dimensions: ['time', 'point'],
  selection: {time: 0},
  label: '2 m temperature (K) · 2011-01-01 00:00 UTC'
}, null, 2);

async function loadField() {
  controller?.abort();
  controller = new AbortController();
  const signal = controller.signal;
  loadButton.disabled = true;
  status.textContent = 'Reading metadata…';
  try {
    const config = JSON.parse(configInput.value) as Omit<Configuration, 'root'>;
    const root = rootInput.value.trim();
    if (!root || !/^https?:\/\//.test(root)) throw new Error('Enter an HTTP(S) Zarr root URL');
    if (!config.array || !config.dimensions?.length) throw new Error('Array path and dimension names are required');
    const source = config.storage === 'icechunk' ? null : createDataSource(root, [ZarrArraySourceLoader], {
      zarrArray: {path: config.array, dimensions: config.dimensions}
    });
    const metadata = source ? await source.getMetadata(signal) : null;
    const selection: Record<string, number | null> = {};
    for (const dim of (metadata?.dimensions || config.dimensions)) selection[dim] = config.selection?.[dim] ?? null;
    const remaining = (metadata?.dimensions || config.dimensions).filter(dim => selection[dim] === null);
    if (remaining.length !== 1) throw new Error('Select all dimensions except the flat point dimension');
    status.textContent = 'Reading selected chunks…';
    const field = source
      ? await source.getArray({selectionByDimension: selection, signal})
      : await readIcechunkField({root, path: config.array, dimensions: config.dimensions, selection: config.selection, reference: config.reference, signal, loadCoordinates: !config.grid});
    if (signal.aborted) return;
    if (field.shape.length !== 1) throw new Error('Expected a one-dimensional point field');
    const grid = config.grid || ('grid' in field ? field.grid : undefined);
    if (!grid) throw new Error('Provide a Gaussian grid for a plain Zarr store');
    const points = expandReducedGaussianGrid(field.data, grid);
    const [min, max] = finiteRange(field.data);
    deck.setProps({layers: [new ScatterplotLayer({
      id: 'atmospheric-field',
      data: points,
      getPosition: p => p.position,
      getFillColor: p => colorForValue(p.value, min, max),
      getRadius: 22000,
      radiusUnits: 'meters',
      radiusMinPixels: 1,
      pickable: true,
      opacity: 0.85
    })], getTooltip: ({object}) => object ? `${config.label || config.array}: ${object.value}\nLon/lat: ${object.position.join(', ')}` : null});
    legend.textContent = `${config.label || config.array} · min ${min.toPrecision(5)} · max ${max.toPrecision(5)} · ${points.length.toLocaleString()} points`;
    status.textContent = 'Loaded';
  } catch (error) {
    if (!signal.aborted) status.textContent = error instanceof Error ? error.message : String(error);
  } finally {
    if (!signal.aborted) loadButton.disabled = false;
  }
}

loadButton.addEventListener('click', () => {void loadField();});
window.addEventListener('beforeunload', () => {controller?.abort(); destroyInfo(); deck.finalize();});
