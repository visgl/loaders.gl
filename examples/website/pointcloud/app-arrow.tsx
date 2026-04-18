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
import {getDeckBinaryDataFromArrowMesh, getBoundingBoxFromArrowPositions} from '@loaders.gl/geoarrow';
import {convertTableToMesh} from '@loaders.gl/schema-utils';
import {DracoArrowLoader} from '@loaders.gl/draco';
import {LASArrowLoader} from '@loaders.gl/las';
import {OBJArrowLoader} from '@loaders.gl/obj';
import {PCDArrowLoader} from '@loaders.gl/pcd';
import {PLYArrowLoader} from '@loaders.gl/ply';

import type {Example} from './examples';
import {EXAMPLES} from './examples';
import {createDeckStatsWidget} from '../shared/create-deck-stats-widget';
import '@deck.gl/widgets/stylesheet.css';

const POINT_CLOUD_LOADERS = [
  DracoArrowLoader,
  LASArrowLoader,
  PLYArrowLoader,
  PCDArrowLoader,
  OBJArrowLoader
] as const;

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
    const initialCategoryName = props.format || Object.keys(availableExamples).find(Boolean) || 'PLY';
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
        id: `point-cloud-layer-${state.selectedExampleName ?? 'arrow-example'}`,
        coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
        data: state.pointData,
        getNormal: [0, 1, 0],
        getColor: [200, 200, 255],
        opacity: 0.5,
        pointSize: 0.5
      })
  ];

  const widgets = useMemo(
    () => [
      createDeckStatsWidget('pointcloud-arrow-stats'),
      new SidebarWidget({
        id: 'pointcloud-arrow-example-sidebar',
        placement: 'top-right',
        side: 'right',
        widthPx: 420,
        panel: new ColumnPanel({
          id: 'pointcloud-arrow-example-panel',
          title: '',
          panels: {
            controls: new CustomPanel({
              id: 'pointcloud-arrow-example-controls',
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
                  vertexCount: state.pointData?.points?.positions?.value?.length || 0,
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
    ],
    [
      availableExamples,
      state.error,
      state.loadStartMs,
      state.loadTimeMs,
      state.metadata,
      state.pointData,
      state.selectedCategoryName,
      state.selectedExampleName
    ]
  );

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
        parameters={{clearColor: [0.07, 0.14, 0.19, 1]}}
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
      const arrowTable = await load(example.url, POINT_CLOUD_LOADERS as any);
      const pointCloud = convertTableToMesh(arrowTable as any) as any;
      const {schema, header, loaderData, attributes} = pointCloud;

      const viewState = getArrowViewState(state.viewState, arrowTable as any, loaderData);
      const metadata = JSON.stringify({schema, header, loaderData}, null, 2);
      const pointData = getDeckBinaryDataFromArrowMesh((arrowTable as any).data);

      setState((currentState) => ({
        ...currentState,
        loadTimeMs: currentState.loadStartMs ? Date.now() - currentState.loadStartMs : undefined,
        loadStartMs: undefined,
        pointData,
        viewState,
        metadata,
        selectedCategoryName: categoryName,
        selectedExampleName: exampleName
      }));

      rotateCamera();
    } catch (error) {
      console.error('Failed to load data', example.url, error);
      setState((currentState) => ({
        ...currentState,
        error: `Could not load ${exampleName}: ${error instanceof Error ? error.message : String(error)}`
      }));
    }
  }
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
  rootElement.appendChild(selectElement);

  const statsElement = document.createElement('pre');
  statsElement.style.margin = '0';
  statsElement.style.textAlign = 'center';
  statsElement.style.whiteSpace = 'pre-wrap';
  const loadMessage = options.loadTimeMs
    ? `Load time: ${(options.loadTimeMs / 1000).toFixed(1)}s`
    : options.loadStartMs
      ? 'Loading...'
      : '';
  statsElement.textContent = `Points: ${options.vertexCount}\n${loadMessage}`;
  rootElement.appendChild(statsElement);

  if (options.error) {
    const errorElement = document.createElement('div');
    errorElement.textContent = options.error;
    errorElement.style.background = '#fee2e2';
    errorElement.style.color = '#b91c1c';
    errorElement.style.lineHeight = '1.4';
    errorElement.style.padding = '8px';
    errorElement.style.whiteSpace = 'pre-wrap';
    errorElement.style.borderRadius = '8px';
    rootElement.appendChild(errorElement);
  }

  const preElement = document.createElement('pre');
  preElement.textContent = options.metadata ?? 'No metadata available';
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
  rootElement.appendChild(preElement);
}

function getArrowViewState(previousViewState: OrbitViewState, arrowTable: any, loaderData: any) {
  const [mins, maxs] =
    loaderData?.header?.mins && loaderData?.header?.maxs
      ? [loaderData.header.mins, loaderData.header.maxs]
      : getBoundingBoxFromArrowPositions(arrowTable.data.getChild('POSITION'));

  return {
    ...INITIAL_VIEW_STATE,
    ...previousViewState,
    target: [(mins[0] + maxs[0]) / 2, (mins[1] + maxs[1]) / 2, (mins[2] + maxs[2]) / 2],
    zoom: Math.log2(window.innerWidth / (maxs[0] - mins[0])) - 1
  } as OrbitViewState;
}

export function renderToDOM(container: HTMLElement) {
  createRoot(container).render(<App />);
}
