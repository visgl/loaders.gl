// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {type ReactNode, useEffect, useMemo, useState} from 'react';
import {createRoot} from 'react-dom/client';

import DeckGL from '@deck.gl/react';
import {
  COORDINATE_SYSTEM,
  LinearInterpolator,
  OrbitView,
  type OrbitViewState
} from '@deck.gl/core';
import {PointCloudLayer} from '@deck.gl/layers';
import {ColumnPanel, CustomPanel, SidebarWidget} from '@deck.gl-community/widgets';

import {load} from '@loaders.gl/core';
import {MeshArrowPointCloudLayer, SplatLayer} from '@loaders.gl/deck-layers';
import type {Mesh, MeshArrowTable} from '@loaders.gl/schema';
import {convertTableToMesh} from '@loaders.gl/schema-utils';
import {DracoLoader} from '@loaders.gl/draco';
import {LASLoader} from '@loaders.gl/las';
import {OBJLoader} from '@loaders.gl/obj';
import {PCDLoader} from '@loaders.gl/pcd';
import {PLYLoader} from '@loaders.gl/ply';

import type {Example} from './examples';
import {EXAMPLES} from './examples';
import {createDeckStatsWidget} from '../shared/create-deck-stats-widget';
import '@deck.gl/widgets/stylesheet.css';

const POINT_CLOUD_LOADERS = [DracoLoader, LASLoader, PLYLoader, PCDLoader, OBJLoader] as const;

const INITIAL_VIEW_STATE = {
  target: [0, 0, 0] as [number, number, number],
  rotationX: 0,
  rotationOrbit: 0,
  orbitAxis: 'Y',
  fov: 50,
  minZoom: 0,
  maxZoom: 10,
  zoom: 1
};

const transitionInterpolator = new LinearInterpolator(['rotationOrbit']);

type AppProps = {
  format?: string;
  example?: Example;
  exampleName?: string;
  categoryName?: string;
  hideChrome?: boolean;
  showTileBorders?: boolean;
  onTilesLoad?: Function;
  children?: ReactNode;
};

type AppState = {
  pointData: any;
  metadata: string | null;
  viewState: OrbitViewState;
  selectedCategoryName?: string | null;
  selectedExampleName?: string | null;
  loadTimeMs?: number;
  loadStartMs?: number;
  error?: string | null;
};

type DeckPoint = {
  position: [number, number, number];
  color?: [number, number, number] | [number, number, number, number];
  rowIndex: number;
  intensity?: number;
  classification?: number;
};

export default function App(props: AppProps = {}) {
  const availableExamples = useMemo(
    () => getExamplesForFormat(EXAMPLES, props.format),
    [props.format]
  );
  const [state, setState] = useState<AppState>({
    viewState: INITIAL_VIEW_STATE,
    pointData: null,
    metadata: null,
    selectedCategoryName: null,
    selectedExampleName: null,
    error: null
  });

  useEffect(() => {
    if (props.example) {
      void onExampleChange({
        categoryName: props.categoryName || props.format || 'URL',
        exampleName: props.exampleName || getFileNameFromUrl(props.example.url),
        example: props.example
      });
    } else {
      const initialCategoryName =
        props.format || Object.keys(availableExamples).find(Boolean) || 'PLY';
      const initialExamples = availableExamples[initialCategoryName];
      if (!initialExamples) {
        return;
      }

      const initialExampleName = Object.keys(initialExamples)[0];
      const initialExample = initialExamples[initialExampleName];
      if (!initialExample) {
        return;
      }

      void onExampleChange({
        categoryName: initialCategoryName,
        exampleName: initialExampleName,
        example: initialExample
      });
    }
  }, [availableExamples, props.categoryName, props.example, props.exampleName, props.format]);

  const layers = state.pointData
    ? [
        isMeshArrowTable(state.pointData)
          ? createArrowPointCloudLayer(state.pointData, state.selectedExampleName)
          : createPointCloudLayer(state.pointData, state.selectedExampleName)
      ]
    : [];

  const widgets = useMemo(() => {
    if (props.hideChrome) {
      return [];
    }

    return [
      createDeckStatsWidget('pointcloud-stats'),
      new SidebarWidget({
        id: 'pointcloud-example-sidebar',
        placement: 'top-right',
        side: 'right',
        widthPx: 420,
        panel: new ColumnPanel({
          id: 'pointcloud-example-panel',
          title: '',
          panels: {
            controls: new CustomPanel({
              id: 'pointcloud-example-controls',
              title: '',
              onRenderHTML: (rootElement) =>
                renderPointcloudSidebar(rootElement, {
                  error: state.error ?? null,
                  examples: availableExamples,
                  loadStartMs: state.loadStartMs ?? 0,
                  loadTimeMs: state.loadTimeMs ?? 0,
                  metadata: state.metadata,
                  selectedCategoryName: state.selectedCategoryName,
                  selectedExampleName: state.selectedExampleName,
                  selectedUrl: getSelectedUrl(
                    availableExamples,
                    state.selectedCategoryName,
                    state.selectedExampleName
                  ),
                  vertexCount: getPointDataLength(state.pointData),
                  onExampleChange: ({categoryName, exampleName}) => {
                    const example = availableExamples[categoryName]?.[exampleName];
                    if (example) {
                      void onExampleChange({categoryName, exampleName, example});
                    }
                  },
                  onUrlChange: (url) => {
                    void onExampleChange({
                      categoryName: 'URL',
                      exampleName: getFileNameFromUrl(url),
                      example: {type: 'ply', url}
                    });
                  }
                })
            })
          }
        })
      })
    ];
  }, [
    availableExamples,
    props.hideChrome,
    state.error,
    state.loadStartMs,
    state.loadTimeMs,
    state.metadata,
    state.pointData,
    state.selectedCategoryName,
    state.selectedExampleName,
    onExampleChange
  ]);

  return (
    <div style={{position: 'relative', height: '100%'}}>
      <DeckGL
        layers={layers}
        views={new OrbitView({})}
        viewState={state.viewState}
        controller={{inertia: true}}
        widgets={widgets}
        onViewStateChange={({viewState}) =>
          setState((currentState) => ({...currentState, viewState: viewState as OrbitViewState}))
        }
        getTooltip={(info) => formatPointTooltip(info, state.pointData)}
        parameters={{
          clearColor: [0.07, 0.14, 0.19, 1]
        }}
      />
    </div>
  );

  function rotateCamera() {
    setState((currentState) => ({
      ...currentState,
      viewState: {
        ...currentState.viewState,
        rotationOrbit: (currentState.viewState.rotationOrbit || 0) + 10,
        transitionDuration: 600,
        transitionInterpolator,
        onTransitionEnd: rotateCamera
      } as OrbitViewState
    }));
  }

  async function onExampleChange({
    categoryName,
    example,
    exampleName
  }: {
    categoryName: string;
    example: Example;
    exampleName: string;
  }): Promise<void> {
    setState((currentState) => ({
      ...currentState,
      pointData: null,
      metadata: null,
      loadTimeMs: undefined,
      loadStartMs: Date.now(),
      selectedCategoryName: categoryName,
      selectedExampleName: exampleName,
      error: null
    }));

    try {
      const pointCloud = await loadPointCloudExample(example);
      const mesh = isMeshArrowTable(pointCloud)
        ? ((convertTableToMesh(pointCloud) as unknown) as Mesh)
        : (pointCloud as Mesh);
      const {schema, header, loaderData, attributes} = mesh as any;

      const viewState = getViewState(state.viewState, loaderData, attributes);
      const metadata = JSON.stringify({schema, header, loaderData}, null, 2);

      setState((currentState) => ({
        ...currentState,
        loadTimeMs: currentState.loadStartMs ? Date.now() - currentState.loadStartMs : undefined,
        loadStartMs: undefined,
        pointData: isMeshArrowTable(pointCloud)
          ? pointCloud
          : convertLoadersMeshToDeckPointCloudData(attributes),
        viewState,
        metadata,
        selectedCategoryName: categoryName,
        selectedExampleName: exampleName
      }));

      rotateCamera();
    } catch (error) {
      console.error('Failed to load data', getExampleUrls(example), error);
      setState((currentState) => ({
        ...currentState,
        error: `Could not load ${exampleName}: ${error instanceof Error ? error.message : String(error)}`
      }));
    }
  }
}

async function loadPointCloudExample(example: Example): Promise<Mesh | MeshArrowTable> {
  const urls = getExampleUrls(example);
  const loader = getPointCloudLoader(example);
  const pointClouds = await Promise.all(
    urls.map((url) =>
      load(url, loader as any, {
        worker: false,
        las: {shape: 'arrow-table'},
        obj: {shape: 'arrow-table'},
        pcd: {shape: 'arrow-table'},
        ply: {shape: 'arrow-table'}
      })
    )
  );

  if (pointClouds.length === 1) {
    return pointClouds[0] as Mesh | MeshArrowTable;
  }

  return combineMeshArrowTables(pointClouds as MeshArrowTable[]);
}

function combineMeshArrowTables(pointClouds: MeshArrowTable[]): MeshArrowTable {
  const firstPointCloud = pointClouds[0];
  if (!firstPointCloud || pointClouds.some((pointCloud) => !isMeshArrowTable(pointCloud))) {
    throw new Error('Multi-file point cloud examples require Arrow table loader output.');
  }

  return {
    ...firstPointCloud,
    data: firstPointCloud.data.concat(...pointClouds.slice(1).map((pointCloud) => pointCloud.data))
  };
}

function getExampleUrls(example: Example): string[] {
  return example.urls?.length ? example.urls : [example.url];
}

function getPointCloudLoader(example: Example) {
  switch (example.type) {
    case 'draco':
      return DracoLoader;
    case 'las':
      return LASLoader;
    case 'obj':
      return OBJLoader;
    case 'pcd':
      return PCDLoader;
    case 'ply':
      return PLYLoader;
    default:
      return POINT_CLOUD_LOADERS;
  }
}

function isMeshArrowTable(data: unknown): data is MeshArrowTable {
  return Boolean(data && typeof data === 'object' && 'shape' in data && data.shape === 'arrow-table');
}

function getPointDataLength(pointData: any): number {
  if (isMeshArrowTable(pointData)) {
    return pointData.data.numRows;
  }
  return pointData?.length || 0;
}

function createArrowPointCloudLayer(
  pointData: MeshArrowTable,
  selectedExampleName?: string | null
): MeshArrowPointCloudLayer | SplatLayer {
  if (isGaussianSplatArrowTable(pointData)) {
    return createSplatLayer(pointData, selectedExampleName);
  }

  return new MeshArrowPointCloudLayer({
    id: `point-cloud-layer-${selectedExampleName ?? 'example'}`,
    coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
    data: pointData,
    pickable: true,
    autoHighlight: true,
    pointCloudLayerProps: {
      getNormal: [0, 1, 0],
      opacity: 0.5,
      pointSize: 0.5
    }
  });
}

function createSplatLayer(
  pointData: MeshArrowTable,
  selectedExampleName?: string | null
): SplatLayer {
  return new SplatLayer({
    id: `splat-layer-${selectedExampleName ?? 'example'}`,
    coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
    data: pointData,
    pickable: true,
    opacity: 0.75,
    radiusScale: 1.4,
    radiusMinPixels: 1,
    radiusMaxPixels: 28
  });
}

function isGaussianSplatArrowTable(pointData: MeshArrowTable): boolean {
  return pointData.data.schema.metadata.get('loaders_gl.semantic_type') === 'gaussian-splats';
}

function createPointCloudLayer(
  pointData: DeckPoint[],
  selectedExampleName?: string | null
): PointCloudLayer<DeckPoint> {
  return new PointCloudLayer<DeckPoint>({
    id: `point-cloud-layer-${selectedExampleName ?? 'example'}`,
    coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
    data: pointData,
    pickable: true,
    autoHighlight: true,
    getNormal: [0, 1, 0],
    getColor: (point: DeckPoint) => point.color || [200, 200, 255],
    opacity: 0.5,
    pointSize: 0.5
  });
}

function renderPointcloudSidebar(
  rootElement: HTMLElement,
  options: {
    error: string | null;
    examples: Record<string, Record<string, Example>>;
    loadStartMs: number;
    loadTimeMs: number;
    metadata: string | null;
    selectedCategoryName?: string | null;
    selectedExampleName?: string | null;
    selectedUrl?: string;
    vertexCount: number;
    onExampleChange: (selection: {categoryName: string; exampleName: string}) => void;
    onUrlChange: (url: string) => void;
  }
): void {
  rootElement.replaceChildren();
  rootElement.style.display = 'flex';
  rootElement.style.flexDirection = 'column';
  rootElement.style.gap = '12px';
  rootElement.style.padding = '4px 0 0';

  rootElement.appendChild(
    createUrlCard({
      selectedUrl: options.selectedUrl,
      onUrlChange: options.onUrlChange
    })
  );
  rootElement.appendChild(
    createExampleSelect({
      examples: options.examples,
      selectedCategoryName: options.selectedCategoryName,
      selectedExampleName: options.selectedExampleName,
      onExampleChange: options.onExampleChange
    })
  );
  rootElement.appendChild(createStatsBlock(options.vertexCount, options.loadTimeMs, options.loadStartMs));

  if (options.error) {
    rootElement.appendChild(createNotice(options.error));
  }

  rootElement.appendChild(createPreBlock(options.metadata ?? 'No metadata available'));
}

function createExampleSelect(options: {
  examples: Record<string, Record<string, Example>>;
  selectedCategoryName?: string | null;
  selectedExampleName?: string | null;
  onExampleChange: (selection: {categoryName: string; exampleName: string}) => void;
}): HTMLElement {
  const selectElement = document.createElement('select');
  selectElement.style.width = '100%';
  selectElement.style.padding = '8px';
  selectElement.style.border = '1px solid rgba(148, 163, 184, 0.55)';
  selectElement.style.borderRadius = '8px';
  selectElement.style.background = 'var(--menu-background, #fff)';
  selectElement.value = `${options.selectedCategoryName}.${options.selectedExampleName}`;
  selectElement.addEventListener('change', (event) => {
    const [categoryName, exampleName] = (event.target as HTMLSelectElement).value.split('.');
    options.onExampleChange({categoryName, exampleName});
  });

  for (const categoryName of Object.keys(options.examples)) {
    const optGroupElement = document.createElement('optgroup');
    optGroupElement.label = categoryName;
    for (const exampleName of Object.keys(options.examples[categoryName])) {
      const example = options.examples[categoryName][exampleName];
      const optionElement = document.createElement('option');
      optionElement.value = `${categoryName}.${exampleName}`;
      optionElement.textContent = example.pointCount
        ? `${exampleName} (${formatPointCount(example.pointCount)}, ${categoryName})`
        : `${exampleName} (${categoryName})`;
      optGroupElement.appendChild(optionElement);
    }
    selectElement.appendChild(optGroupElement);
  }

  return selectElement;
}

function createUrlCard(options: {
  selectedUrl?: string;
  onUrlChange: (url: string) => void;
}): HTMLElement {
  const wrapperElement = document.createElement('form');
  wrapperElement.style.display = 'grid';
  wrapperElement.style.gridTemplateColumns = '1fr auto';
  wrapperElement.style.gap = '8px';
  wrapperElement.style.padding = '10px';
  wrapperElement.style.border = '1px solid rgba(148, 163, 184, 0.45)';
  wrapperElement.style.borderRadius = '8px';
  wrapperElement.style.background = 'rgba(15, 23, 42, 0.04)';

  const inputElement = document.createElement('input');
  inputElement.type = 'url';
  inputElement.value = options.selectedUrl || '';
  inputElement.placeholder = 'https://raw.githubusercontent.com/.../file.ply';
  inputElement.style.minWidth = '0';
  inputElement.style.padding = '8px';
  inputElement.style.border = '1px solid rgba(148, 163, 184, 0.55)';
  inputElement.style.borderRadius = '6px';
  inputElement.style.background = 'var(--menu-background, #fff)';

  const buttonElement = document.createElement('button');
  buttonElement.type = 'submit';
  buttonElement.textContent = 'Load';
  buttonElement.style.padding = '8px 12px';
  buttonElement.style.border = '1px solid rgba(15, 23, 42, 0.25)';
  buttonElement.style.borderRadius = '6px';
  buttonElement.style.background = '#0f172a';
  buttonElement.style.color = '#f8fafc';
  buttonElement.style.cursor = 'pointer';

  wrapperElement.addEventListener('submit', (event) => {
    event.preventDefault();
    const url = inputElement.value.trim();
    if (url) {
      options.onUrlChange(url);
    }
  });

  wrapperElement.appendChild(inputElement);
  wrapperElement.appendChild(buttonElement);

  return wrapperElement;
}

function createStatsBlock(vertexCount: number, loadTimeMs: number, loadStartMs: number): HTMLElement {
  let loadMessage = '';
  if (loadTimeMs) {
    loadMessage = `Load time: ${(loadTimeMs / 1000).toFixed(1)}s`;
  } else if (loadStartMs) {
    loadMessage = 'Loading...';
  }

  const preElement = document.createElement('pre');
  preElement.textContent = `Points: ${formatPointCount(vertexCount)}\n${loadMessage}`;
  preElement.style.margin = '0';
  preElement.style.textAlign = 'center';
  preElement.style.whiteSpace = 'pre-wrap';
  return preElement;
}

function createNotice(message: string): HTMLElement {
  const element = document.createElement('div');
  element.textContent = message;
  element.style.background = '#fee2e2';
  element.style.color = '#b91c1c';
  element.style.lineHeight = '1.4';
  element.style.padding = '8px';
  element.style.whiteSpace = 'pre-wrap';
  element.style.borderRadius = '8px';
  return element;
}

function createPreBlock(content: string): HTMLElement {
  const preElement = document.createElement('pre');
  preElement.textContent = content;
  preElement.style.margin = '0';
  preElement.style.maxHeight = '320px';
  preElement.style.overflow = 'auto';
  preElement.style.padding = '12px';
  preElement.style.borderRadius = '8px';
  preElement.style.background = '#0f172a';
  preElement.style.color = '#e2e8f0';
  preElement.style.fontSize = '12px';
  preElement.style.lineHeight = '1.4';
  preElement.style.whiteSpace = 'pre-wrap';
  return preElement;
}

function getExamplesForFormat(
  examples: Record<string, Record<string, Example>>,
  format?: string
): Record<string, Record<string, Example>> {
  if (format) {
    return {[format]: examples[format]};
  }
  return {...examples};
}

function getSelectedUrl(
  examples: Record<string, Record<string, Example>>,
  selectedCategoryName?: string | null,
  selectedExampleName?: string | null
): string {
  if (!selectedCategoryName || !selectedExampleName) {
    return '';
  }
  return examples[selectedCategoryName]?.[selectedExampleName]?.url || '';
}

function getFileNameFromUrl(url: string): string {
  const pathname = new URL(url).pathname;
  return pathname.slice(pathname.lastIndexOf('/') + 1) || 'Custom PLY';
}

function formatPointCount(pointCount: number): string {
  if (pointCount >= 1e7) {
    return `${(pointCount / 1e6).toFixed(0)}M`;
  }
  if (pointCount >= 1e6) {
    return `${(pointCount / 1e6).toFixed(1)}M`;
  }
  if (pointCount >= 1e4) {
    return `${(pointCount / 1e3).toFixed(0)}K`;
  }
  if (pointCount >= 1e3) {
    return `${(pointCount / 1e3).toFixed(1)}K`;
  }
  return `${pointCount}`;
}

function getViewState(
  previousViewState: OrbitViewState,
  loaderData: any,
  attributes: any
): OrbitViewState {
  const {maxs, mins} =
    loaderData?.header?.mins && loaderData?.header?.maxs
      ? loaderData.header
      : calculateBounds(attributes);

  return {
    ...INITIAL_VIEW_STATE,
    ...previousViewState,
    target: [
      (mins[0] + maxs[0]) / 2,
      (mins[1] + maxs[1]) / 2,
      (mins[2] + maxs[2]) / 2
    ] as [number, number, number],
    zoom: Math.log2(window.innerWidth / (maxs[0] - mins[0])) - 1
  } as OrbitViewState;
}

function calculateBounds(attributes: Record<string, {value: Float32Array | Float64Array}>) {
  const positions = attributes.POSITION.value;
  const mins = [Infinity, Infinity, Infinity];
  const maxs = [-Infinity, -Infinity, -Infinity];

  for (let index = 0; index < positions.length; index += 3) {
    mins[0] = Math.min(mins[0], positions[index]);
    mins[1] = Math.min(mins[1], positions[index + 1]);
    mins[2] = Math.min(mins[2], positions[index + 2]);
    maxs[0] = Math.max(maxs[0], positions[index]);
    maxs[1] = Math.max(maxs[1], positions[index + 1]);
    maxs[2] = Math.max(maxs[2], positions[index + 2]);
  }

  return {mins, maxs};
}

function convertLoadersMeshToDeckPointCloudData(attributes: any) {
  const positions = attributes.POSITION.value;
  const colorAttribute = attributes.COLOR_0;
  const colors = colorAttribute?.value;
  const colorSize = colorAttribute?.size || colorAttribute?.components || 3;
  const intensityAttribute = attributes.intensity;
  const classificationAttribute = attributes.classification;

  const points: DeckPoint[] = [];
  const pointCount = Math.floor(positions.length / 3);
  for (let pointIndex = 0; pointIndex < pointCount; pointIndex++) {
    const positionIndex = pointIndex * 3;
    const colorIndex = pointIndex * colorSize;
    points.push({
      position: [positions[positionIndex], positions[positionIndex + 1], positions[positionIndex + 2]],
      rowIndex: pointIndex,
      intensity: getAttributeScalarValue(intensityAttribute, pointIndex),
      classification: getAttributeScalarValue(classificationAttribute, pointIndex),
      color: colors
        ? [
            colors[colorIndex],
            colors[colorIndex + 1],
            colors[colorIndex + 2],
            colorSize > 3 ? colors[colorIndex + 3] : 255
          ]
        : undefined
    });
  }

  return points;
}

/**
 * Returns a scalar mesh attribute value for a point row.
 */
function getAttributeScalarValue(attribute: any, pointIndex: number): number | undefined {
  const value = attribute?.value;
  if (!value) {
    return undefined;
  }
  const size = attribute?.size || attribute?.components || 1;
  return value[pointIndex * size];
}

function getPointRow(pointData: any, pointIndex: number): DeckPoint | null {
  if (pointIndex < 0) {
    return null;
  }

  if (isMeshArrowTable(pointData)) {
    const position = pointData.data.getChild('POSITION')?.get(pointIndex);
    if (!position) {
      return null;
    }
    const color = pointData.data.getChild('COLOR_0')?.get(pointIndex);
    return {
      position: Array.from(position) as [number, number, number],
      rowIndex: pointIndex,
      intensity: pointData.data.getChild('intensity')?.get(pointIndex),
      classification: pointData.data.getChild('classification')?.get(pointIndex),
      color: color ? (Array.from(color) as [number, number, number, number]) : undefined
    };
  }

  return pointData?.[pointIndex] || null;
}

function formatPointTooltipContent(point: DeckPoint | null): string | null {
  if (!point) {
    return null;
  }

  const lines = [
    `Row: ${point.rowIndex}`,
    `Position: ${point.position.map((value) => value.toPrecision(6)).join(', ')}`
  ];

  if (point.intensity !== undefined) {
    lines.push(`Intensity: ${point.intensity}`);
  }
  if (point.classification !== undefined) {
    lines.push(`Classification: ${point.classification}`);
  }
  if (point.color) {
    lines.push(`Color: ${point.color.join(', ')}`);
  }

  return lines.join('\n');
}

/**
 * Formats the deck.gl picking tooltip for point cloud vertices.
 */
function formatPointTooltip(info: any, pointData: any) {
  const point = info.object || getPointRow(pointData, info.index);
  const text = formatPointTooltipContent(point);

  return text
    ? {
        text,
        style: {
          backgroundColor: 'rgba(7, 14, 24, 0.92)',
          border: '1px solid rgba(148, 163, 184, 0.38)',
          borderRadius: '8px',
          boxShadow: '0 14px 36px rgba(0, 0, 0, 0.38)',
          color: '#f8fafc',
          fontFamily:
            'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          fontSize: '12px',
          fontWeight: '650',
          lineHeight: '1.45',
          padding: '10px 12px',
          whiteSpace: 'pre'
        }
      }
    : null;
}

export function renderToDOM(container: HTMLElement) {
  createRoot(container).render(<App />);
}
