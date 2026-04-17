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
import type {Mesh} from '@loaders.gl/schema';
import {DracoLoader} from '@loaders.gl/draco';
import {LASLoader} from '@loaders.gl/las';
import {OBJLoader} from '@loaders.gl/obj';
import {PCDLoader} from '@loaders.gl/pcd';
import {PLYLoader} from '@loaders.gl/ply';

import type {Example} from './examples';
import {EXAMPLES} from './examples';
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
  }, [availableExamples, props.format]);

  const layers = [
    state.pointData &&
      new PointCloudLayer({
        id: `point-cloud-layer-${state.selectedExampleName ?? 'example'}`,
        coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
        data: state.pointData,
        getNormal: [0, 1, 0],
        getColor: [200, 200, 255],
        opacity: 0.5,
        pointSize: 0.5
      })
  ];

  const widgets = useMemo(() => {
    if (props.hideChrome) {
      return [];
    }

    return [
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
                  vertexCount: state.pointData?.length || 0,
                  onExampleChange: ({categoryName, exampleName}) => {
                    const example = availableExamples[categoryName]?.[exampleName];
                    if (example) {
                      void onExampleChange({categoryName, exampleName, example});
                    }
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
    state.selectedExampleName
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

    const {url} = example;
    try {
      const pointCloud = (await load(url, POINT_CLOUD_LOADERS as any, {worker: false})) as Mesh;
      const {schema, header, loaderData, attributes} = pointCloud as any;

      const viewState = getViewState(state.viewState, loaderData, attributes);
      const metadata = JSON.stringify({schema, header, loaderData}, null, 2);

      setState((currentState) => ({
        ...currentState,
        loadTimeMs: currentState.loadStartMs ? Date.now() - currentState.loadStartMs : undefined,
        loadStartMs: undefined,
        pointData: convertLoadersMeshToDeckPointCloudData(attributes),
        viewState,
        metadata,
        selectedCategoryName: categoryName,
        selectedExampleName: exampleName
      }));

      rotateCamera();
    } catch (error) {
      console.error('Failed to load data', url, error);
      setState((currentState) => ({
        ...currentState,
        error: `Could not load ${exampleName}: ${error instanceof Error ? error.message : String(error)}`
      }));
    }
  }
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
    vertexCount: number;
    onExampleChange: (selection: {categoryName: string; exampleName: string}) => void;
  }
): void {
  rootElement.replaceChildren();
  rootElement.style.display = 'flex';
  rootElement.style.flexDirection = 'column';
  rootElement.style.gap = '12px';
  rootElement.style.padding = '4px 0 0';

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
      const optionElement = document.createElement('option');
      optionElement.value = `${categoryName}.${exampleName}`;
      optionElement.textContent = `${exampleName} (${categoryName})`;
      optGroupElement.appendChild(optionElement);
    }
    selectElement.appendChild(optGroupElement);
  }

  return selectElement;
}

function createStatsBlock(vertexCount: number, loadTimeMs: number, loadStartMs: number): HTMLElement {
  let pointsLabel = `${vertexCount}`;
  if (vertexCount >= 1e7) {
    pointsLabel = `${(vertexCount / 1e6).toFixed(0)}M`;
  } else if (vertexCount >= 1e6) {
    pointsLabel = `${(vertexCount / 1e6).toFixed(1)}M`;
  } else if (vertexCount >= 1e4) {
    pointsLabel = `${(vertexCount / 1e3).toFixed(0)}K`;
  } else if (vertexCount >= 1e3) {
    pointsLabel = `${(vertexCount / 1e3).toFixed(1)}K`;
  }

  let loadMessage = '';
  if (loadTimeMs) {
    loadMessage = `Load time: ${(loadTimeMs / 1000).toFixed(1)}s`;
  } else if (loadStartMs) {
    loadMessage = 'Loading...';
  }

  const preElement = document.createElement('pre');
  preElement.textContent = `Points: ${pointsLabel}\n${loadMessage}`;
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
  const colors = attributes.COLOR_0?.value;

  const points = [];
  for (let index = 0; index < positions.length; index += 3) {
    points.push({
      position: [positions[index], positions[index + 1], positions[index + 2]],
      color: colors ? [colors[index], colors[index + 1], colors[index + 2]] : undefined
    });
  }

  return points;
}

export function renderToDOM(container: HTMLElement) {
  createRoot(container).render(<App />);
}
