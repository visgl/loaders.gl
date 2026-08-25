import {Deck, OrthographicView} from '@deck.gl/core';
import {PathLayer, ScatterplotLayer} from '@deck.gl/layers';
import {LanceSourceLoader} from '@loaders.gl/lance';
import {
  readLanceRemoteCoordinatesToArrow,
  readLanceRemoteFileToArrow
} from '@loaders.gl/lance/lance-arrow';

type LanceColumn = {index: number; name: string; type: 'double' | 'int64'};
type LanceCoordinateColumn = {index: number; xName: string; yName: string};
type DatasetConfig = {
  id: string;
  label: string;
  url: string;
  version: number | string;
  columns?: LanceColumn[];
  coordinates?: LanceCoordinateColumn[];
};
type DeckPoint = {position: [number, number]; color: [number, number, number]};

const CURATED_DATASETS: DatasetConfig[] = [
  {
    id: 'laion-1m',
    label: 'LAION-1M — images, captions, embeddings',
    url: 'https://huggingface.co/datasets/lance-format/laion-1m/resolve/main/data/train.lance',
    version: 3,
    columns: [
      {index: 3, name: 'similarity', type: 'double'},
      {index: 9, name: 'width', type: 'int64'},
      {index: 10, name: 'height', type: 'int64'}
    ]
  },
  {
    id: 'cifar10',
    label: 'CIFAR-10 — images and labels',
    url: 'https://huggingface.co/datasets/lance-format/cifar10-lance/resolve/main/data/train.lance',
    version: 'latest'
  },
  {
    id: 'ade20k',
    label: 'ADE20K — scenes and segmentation masks',
    url: 'https://huggingface.co/datasets/lance-format/ade20k-lance/resolve/main/data/train.lance',
    version: 'latest'
  },
  {
    id: 'lerobot-pusht',
    label: 'LeRobot PushT — robot coordinates and actions',
    url: 'https://huggingface.co/datasets/lance-format/lerobot-pusht-lance/resolve/main/data/frames.lance',
    version: '18446744073709551614',
    coordinates: [{index: 0, xName: 'observation_x', yName: 'observation_y'}]
  }
];

const PAGE_SIZE = 5;
let activeFileURL = '';
let activeFileSize = 0;
let activeColumns: LanceColumn[] = [];
let activeCoordinateColumns: LanceCoordinateColumn[] = [];
let pagedRows = 0;
let pageIndex = 0;
let deck: Deck | null = null;

function escapeHTML(value: unknown): string {
  return String(value).replace(/[&<>"']/g, character => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[character]!));
}

function getElement<T extends Element>(selector: string): T {
  return document.querySelector<T>(selector)!;
}

function setStatus(message: string): void {
  getElement('#status').textContent = message;
}

function setDatasetFields(dataset: Partial<DatasetConfig>): void {
  getElement<HTMLSelectElement>('#dataset-picker').value = dataset.id ?? 'custom';
  getElement<HTMLInputElement>('#dataset-url').value = dataset.url ?? '';
  getElement<HTMLInputElement>('#dataset-version').value = String(dataset.version ?? 'latest');
}

function getDatasetFromForm(): DatasetConfig {
  const selectedDataset = CURATED_DATASETS.find(dataset => dataset.id === getElement<HTMLSelectElement>('#dataset-picker').value);
  return {
    ...(selectedDataset ?? {id: 'custom', label: 'Custom Lance dataset', version: 'latest'}),
    url: getElement<HTMLInputElement>('#dataset-url').value.trim(),
    version: getElement<HTMLInputElement>('#dataset-version').value.trim() || 'latest'
  };
}

function renderTableHeader(columns: LanceColumn[]): void {
  getElement('#arrow-head').innerHTML = columns.map(column => `<th>${escapeHTML(column.name)}</th>`).join('');
}

function renderCoordinateTableHeader(column: LanceCoordinateColumn): void {
  getElement('#arrow-head').innerHTML = `<th>${escapeHTML(column.xName)}</th><th>${escapeHTML(column.yName)}</th>`;
}

function renderDeck(points: DeckPoint[]): void {
  if (!deck) return;
  deck.setProps({
    layers: [
      new PathLayer<DeckPoint[]>({
        id: 'pusht-trajectory',
        data: [points],
        getPath: path => path.map(point => point.position),
        getColor: [245, 158, 11],
        getWidth: 2,
        widthMinPixels: 2
      }),
      new ScatterplotLayer<DeckPoint>({
        id: 'pusht-observations',
        data: points,
        getPosition: point => point.position,
        getFillColor: point => point.color,
        getRadius: 3,
        radiusMinPixels: 3,
        pickable: true
      })
    ]
  });
}

async function renderPage(): Promise<void> {
  const pageStatus = getElement('#page-status');
  const previousPageButton = getElement<HTMLButtonElement>('#previous-page');
  const nextPageButton = getElement<HTMLButtonElement>('#next-page');
  if (activeCoordinateColumns.length) {
    const coordinateColumn = activeCoordinateColumns[0];
    const coordinateTable = await readLanceRemoteCoordinatesToArrow(
      activeFileURL,
      activeFileSize,
      [coordinateColumn],
      Math.max(PAGE_SIZE, 200),
      pageIndex * PAGE_SIZE
    );
    const tableRows = coordinateTable.data.toArray().slice(0, PAGE_SIZE) as Array<Record<string, number>>;
    renderCoordinateTableHeader(coordinateColumn);
    getElement('#arrow-status').textContent = `Arrow table: ${pagedRows.toLocaleString()} coordinate rows from fragment 0`;
    const firstRow = pageIndex * PAGE_SIZE + 1;
    const lastRow = Math.min(firstRow + tableRows.length - 1, pagedRows);
    pageStatus.textContent = `${firstRow.toLocaleString()}–${lastRow.toLocaleString()} of ${pagedRows.toLocaleString()}`;
    previousPageButton.disabled = pageIndex === 0;
    nextPageButton.disabled = lastRow >= pagedRows;
    getElement('#arrow-rows').innerHTML = tableRows
      .map(row => `<tr><td>${row[coordinateColumn.xName]}</td><td>${row[coordinateColumn.yName]}</td></tr>`)
      .join('');
    renderDeck((coordinateTable.data.toArray() as Array<Record<string, number>>).map(row => ({
      position: [row[coordinateColumn.xName], row[coordinateColumn.yName]],
      color: [59, 130, 246]
    })));
    return;
  }
  if (!activeColumns.length) {
    getElement('#arrow-status').textContent = 'Metadata loaded. This source does not yet have a scalar row decoder configured.';
    getElement('#arrow-rows').innerHTML = '<tr><td class="empty" colspan="3">Choose LAION-1M for a working Arrow row scan.</td></tr>';
    pageStatus.textContent = '';
    previousPageButton.disabled = true;
    nextPageButton.disabled = true;
    return;
  }
  const arrowTable = await readLanceRemoteFileToArrow(activeFileURL, activeFileSize, activeColumns, PAGE_SIZE, pageIndex * PAGE_SIZE);
  const firstRow = pageIndex * PAGE_SIZE + 1;
  const lastRow = Math.min(firstRow + arrowTable.data.numRows - 1, pagedRows);
  getElement('#arrow-status').textContent = `Arrow table: ${pagedRows.toLocaleString()} rows from fragment 0`;
  pageStatus.textContent = `${firstRow.toLocaleString()}–${lastRow.toLocaleString()} of ${pagedRows.toLocaleString()}`;
  previousPageButton.disabled = pageIndex === 0;
  nextPageButton.disabled = lastRow >= pagedRows;
  getElement('#arrow-rows').innerHTML = arrowTable.data.toArray()
    .map(row => `<tr>${activeColumns.map(column => `<td>${escapeHTML((row as Record<string, unknown>)[column.name])}</td>`).join('')}</tr>`)
    .join('');
}

async function loadDataset(dataset: DatasetConfig): Promise<void> {
  activeColumns = dataset.columns ?? [];
  activeCoordinateColumns = dataset.coordinates ?? [];
  pageIndex = 0;
  setStatus(`Reading ${dataset.label} with HTTP ranges…`);
  getElement('#arrow-rows').innerHTML = '';
  const source = LanceSourceLoader.createDataSource(dataset.url, {lance: {version: dataset.version}});
  const metadata = await source.getMetadata();
  const totalRows = metadata.fragments.reduce(
    (rowCount: number, fragment: {physicalRows: number}) => rowCount + fragment.physicalRows,
    0
  );
  pagedRows = metadata.fragments[0]?.physicalRows ?? 0;
  const firstFile = metadata.fragments[0]?.files[0];
  if (!firstFile) throw new Error('Lance dataset manifest does not contain a data file');
  activeFileURL = `${dataset.url.replace(/\/$/, '')}/data/${firstFile.path}`;
  activeFileSize = firstFile.fileSizeBytes!;
  getElement('#dataset-details').innerHTML = `
    <dt>Source</dt><dd>${escapeHTML(dataset.label)}</dd>
    <dt>Snapshot</dt><dd>${escapeHTML(metadata.version)}</dd>
    <dt>Fragments</dt><dd>${metadata.fragments.length}</dd>
    <dt>Schema fields</dt><dd>${metadata.fields.length}</dd>
    <dt>Total rows</dt><dd>${totalRows.toLocaleString()}</dd>
    <dt>Rows in paged file</dt><dd>${pagedRows.toLocaleString()}</dd>
    <dt>Page size</dt><dd>${PAGE_SIZE}</dd>
  `;
  renderTableHeader(activeColumns);
  getElement('#deck-panel').toggleAttribute('hidden', !activeCoordinateColumns.length);
  setStatus(`Loaded ${dataset.label}`);
  await renderPage();
}

async function main(): Promise<void> {
  const picker = getElement<HTMLSelectElement>('#dataset-picker');
  picker.innerHTML = CURATED_DATASETS.map(dataset => `<option value="${dataset.id}">${dataset.label}</option>`).join('') + '<option value="custom">Custom Lance URL</option>';
  setDatasetFields(CURATED_DATASETS[0]);
  picker.onchange = () => setDatasetFields(CURATED_DATASETS.find(dataset => dataset.id === picker.value) ?? {id: 'custom', url: '', version: 'latest'});
  getElement<HTMLButtonElement>('#load-dataset').onclick = async () => {
    try { await loadDataset(getDatasetFromForm()); }
    catch (error) { setStatus(`Failed: ${error instanceof Error ? error.message : String(error)}`); }
  };
  deck = new Deck({
    canvas: getElement<HTMLCanvasElement>('#deck-canvas'),
    controller: true,
    views: new OrthographicView({id: 'coordinate-view'}),
    initialViewState: {target: [250, 150, 0], zoom: 1}
  });
  getElement<HTMLButtonElement>('#previous-page').onclick = async () => {
    if (pageIndex > 0) { pageIndex -= 1; await renderPage(); }
  };
  getElement<HTMLButtonElement>('#next-page').onclick = async () => {
    if ((pageIndex + 1) * PAGE_SIZE < pagedRows) { pageIndex += 1; await renderPage(); }
  };
  await loadDataset(CURATED_DATASETS[0]);
}

main().catch(error => setStatus(`Failed: ${error instanceof Error ? error.message : String(error)}`));
