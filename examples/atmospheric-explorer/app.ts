import {Deck, GlobeView} from '@deck.gl/core';
import {ScatterplotLayer} from '@deck.gl/layers';
import {createDataSource} from '@loaders.gl/core';
import {ZarrArraySourceLoader} from '@loaders.gl/scientific/zarr';
import {expandReducedGaussianGrid, finiteRange, colorForValue, type GaussianGrid} from './grid';

type Configuration = {
  root: string;
  array: string;
  dimensions: string[];
  grid: GaussianGrid;
  selection: Record<string, number>;
  label?: string;
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

let controller: AbortController | null = null;
const params = new URLSearchParams(location.search);
rootInput.value = params.get('root') || '';
configInput.value = JSON.stringify({
  array: 'temperature',
  dimensions: ['time', 'level', 'point'],
  selection: {time: 0, level: 0},
  grid: {latitudes: [], pointsPerLatitude: []}
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
    const source = createDataSource(root, [ZarrArraySourceLoader], {
      zarrArray: {path: config.array, dimensions: config.dimensions}
    });
    const metadata = await source.getMetadata(signal);
    const selection: Record<string, number | null> = {};
    for (const dim of metadata.dimensions) selection[dim] = config.selection?.[dim] ?? null;
    const remaining = metadata.dimensions.filter(dim => selection[dim] === null);
    if (remaining.length !== 1) throw new Error('Select all dimensions except the flat point dimension');
    status.textContent = 'Reading selected chunks…';
    const field = await source.getArray({selectionByDimension: selection, signal});
    if (signal.aborted) return;
    if (field.shape.length !== 1) throw new Error('Expected a one-dimensional point field');
    const points = expandReducedGaussianGrid(field.data, config.grid);
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
window.addEventListener('beforeunload', () => {controller?.abort(); deck.finalize();});
