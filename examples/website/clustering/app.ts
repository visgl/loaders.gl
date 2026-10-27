// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {MapboxOverlay} from '@deck.gl/mapbox';
import {
  CompositeLayer,
  type CompositeLayerProps,
  type DefaultProps,
  type PickingInfo,
  type UpdateParameters
} from '@deck.gl/core';
import {
  GeoJsonLayer,
  ScatterplotLayer,
  TextLayer,
  type ScatterplotLayerProps,
  type TextLayerProps
} from '@deck.gl/layers';
import {ColumnPanel, CustomPanel} from '@deck.gl-community/panels';
import {SidebarPanelWidget} from '@deck.gl-community/widgets';
import {ClusterSource, getRepresentativePoint, type ClusterNode} from '@loaders.gl/core/geoarrow';
import maplibregl from 'maplibre-gl';
import {createSampleData, type SampleGeometry} from './sample-data';
import './style.css';
import 'maplibre-gl/dist/maplibre-gl.css';

/** Public basemap style; sample data itself is generated locally. */
const MAP_STYLE = 'https://tiles.openfreemap.org/styles/positron';
/** Starting camera fits all four synthetic site groups. */
const INITIAL_VIEW_STATE = {
  longitude: -122.35,
  latitude: 37.81,
  zoom: 11,
  minZoom: 3,
  maxZoom: 19,
  pitch: 0,
  bearing: 0
};
/** Maximum original rows displayed together in the member panel. */
const MEMBER_PAGE_SIZE = 8;

/** Renders indexed clusters as selectable markers with point counts. */
type ExampleClusterLayerProps = Omit<CompositeLayerProps, 'data'> & {
  data: ClusterSource;
  markerProps?: Partial<Omit<ScatterplotLayerProps<ClusterNode>, 'data' | 'getPosition'>>;
  labelProps?: Partial<Omit<TextLayerProps<ClusterNode>, 'data' | 'getPosition' | 'getText'>>;
};

class ExampleClusterLayer extends CompositeLayer<ExampleClusterLayerProps> {
  /** deck.gl diagnostic name. */
  static layerName = 'ExampleClusterLayer';
  /** Enables picking for marker and label sublayers. */
  static defaultProps: DefaultProps<ExampleClusterLayerProps> = {
    data: null as never,
    pickable: true,
    markerProps: {type: 'object', value: {}},
    labelProps: {type: 'object', value: {}}
  };
  /** Current viewport cluster nodes. */
  declare state: {nodes: ClusterNode[]};

  /** Initializes the visible-node cache. */
  initializeState(): void {
    this.setState({nodes: []});
  }

  /** Runs viewport queries after camera changes as well as data updates. */
  shouldUpdateState(): boolean {
    return true;
  }

  /** Requeries indexed clusters after data or viewport changes. */
  updateState({changeFlags}: UpdateParameters<this>): void {
    if (!changeFlags.dataChanged && !changeFlags.viewportChanged) return;
    const viewport = this.context.viewport;
    this.setState({nodes: this.props.data.index.getClusters(viewport.getBounds(), viewport.zoom)});
  }

  /** Creates marker and count-label sublayers with shared picking objects. */
  renderLayers(): [ScatterplotLayer<ClusterNode>, TextLayer<ClusterNode>] {
    return [
      new ScatterplotLayer<ClusterNode>({
        ...this.getSubLayerProps({id: 'markers'}),
        radiusUnits: 'pixels',
        getRadius: node => (node.isCluster ? 18 : 6),
        getFillColor: node => (node.isCluster ? [25, 110, 190, 230] : [50, 160, 120, 230]),
        ...this.props.markerProps,
        data: this.state.nodes,
        getPosition: node => node.position
      }),
      new TextLayer<ClusterNode>({
        ...this.getSubLayerProps({id: 'counts'}),
        getSize: 12,
        getColor: [255, 255, 255, 255],
        ...this.props.labelProps,
        data: this.state.nodes,
        getPosition: node => node.position,
        getText: node => (node.isCluster ? String(node.pointCount) : '')
      })
    ];
  }
}

/** Mounts the clustering example and returns its cleanup function. */
export function renderToDOM(container: HTMLElement): () => void {
  const root = document.createElement('div');
  root.className = 'clustering-example';
  root.innerHTML = `
    <main class="clustering-map" aria-label="Interactive cluster map">
      <div class="clustering-map-canvas"></div>
      <div class="clustering-zoom" aria-live="polite"></div>
    </main>
  `;
  container.replaceChildren(root);

  const zoomLabel = root.querySelector<HTMLElement>('.clustering-zoom')!;

  let geometryType: SampleGeometry = 'points';
  let radiusPixels = 50;
  let selectedCluster: ClusterNode | null = null;
  let selectedRow: number | null = null;
  let memberOffset = 0;
  let data = createSampleData(geometryType);
  let source = createSource();
  let panelRoot: HTMLElement | null = null;
  let radiusInput: HTMLInputElement | null = null;
  let radiusOutput: HTMLOutputElement | null = null;
  let geometrySelect: HTMLSelectElement | null = null;
  let hint: HTMLElement | null = null;

  const controlsPanel = new CustomPanel({
    id: 'clustering-controls',
    title: '',
    onRenderHTML: (element) => {
      panelRoot = element;
      renderControls(element);
    }
  });

  const map = new maplibregl.Map({
    container: root.querySelector<HTMLElement>('.clustering-map-canvas')!,
    style: MAP_STYLE,
    center: [INITIAL_VIEW_STATE.longitude, INITIAL_VIEW_STATE.latitude],
    zoom: INITIAL_VIEW_STATE.zoom,
    minZoom: INITIAL_VIEW_STATE.minZoom,
    maxZoom: INITIAL_VIEW_STATE.maxZoom,
    pitch: INITIAL_VIEW_STATE.pitch,
    bearing: INITIAL_VIEW_STATE.bearing
  });

  const overlay = new MapboxOverlay({
    interleaved: true,
    layers: [],
    widgets: [
      new SidebarPanelWidget({
        id: 'clustering-sidebar',
        side: 'left',
        placement: 'top-left',
        widthPx: 320,
        defaultOpen: true,
        panel: new ColumnPanel({
          id: 'clustering-panel',
          title: 'Explore clusters',
          panels: [controlsPanel]
        })
      })
    ],
    getTooltip: ({object}: PickingInfo<ClusterNode>) =>
      object
        ? object.isCluster
          ? `${object.pointCount} sites · Click to expand`
          : String(source.getFeature(object.rowIndex!).properties?.name)
        : null
  });
  map.addControl(overlay);
  map.on('load', updateLayers);
  map.on('move', updateZoomLabel);
  updateZoomLabel();

  /** Rebuilds the cluster index when the pixel-radius control changes. */
  function handleRadiusInput(): void {
    if (!radiusInput || !radiusOutput) return;
    radiusPixels = Number(radiusInput.value);
    radiusOutput.value = `${radiusPixels} px`;
    selectedCluster = null;
    memberOffset = 0;
    source = createSource();
    renderPanels();
    updateLayers();
  }

  /** Rebuilds sample geometry and its hierarchy for the selected input type. */
  function handleGeometryChange(): void {
    if (!geometrySelect || !hint) return;
    geometryType = geometrySelect.value as SampleGeometry;
    data = createSampleData(geometryType);
    source = createSource();
    selectedCluster = null;
    memberOffset = 0;
    hint.textContent =
      geometryType === 'polygons'
        ? 'Each footprint contributes one centroid. Selecting a member reveals its polygon.'
        : 'Every site contributes one point. Blue markers show member counts.';
    renderPanels();
    updateLayers();
  }

  /** Restores the initial map camera and clears the active feature selection. */
  function handleResetView(): void {
    map.flyTo({
      center: [INITIAL_VIEW_STATE.longitude, INITIAL_VIEW_STATE.latitude],
      zoom: INITIAL_VIEW_STATE.zoom,
      pitch: INITIAL_VIEW_STATE.pitch,
      bearing: INITIAL_VIEW_STATE.bearing,
      duration: 700
    });
    selectedCluster = null;
    selectedRow = null;
    renderPanels();
    updateLayers();
  }

  return () => {
    map.remove();
    container.replaceChildren();
  };

  /** Builds the immutable cluster hierarchy for current sample and radius. */
  function createSource(): ClusterSource {
    return new ClusterSource(data, {
      radiusPixels,
      maxZoom: 17,
      positionStrategy: geometryType === 'points' ? 'point' : 'centroid',
      aggregations: {capacity: {column: 'capacity', operation: 'sum'}}
    });
  }

  /** Updates the Deck overlay with the current clusters and selected geometry. */
  function updateLayers(): void {
    const selectedFeature = selectedRow === null ? null : source.getFeature(selectedRow);
    overlay.setProps({
      layers: [
    new ExampleClusterLayer({
          id: 'sample-clusters',
          data: source,
          onClick: handleMarkerClick,
          markerProps: {
            getRadius: (node) => (node.isCluster ? Math.min(30, 15 + Math.log2(node.pointCount)) : 5),
            getFillColor: (node) => (node.isCluster ? [28, 104, 176, 235] : [27, 152, 133, 235]),
            stroked: true,
            getLineColor: [255, 255, 255, 220],
            lineWidthMinPixels: 1
          },
          labelProps: {fontFamily: 'Arial, sans-serif', fontWeight: 700}
        }),
        new GeoJsonLayer({
          id: 'selected-original',
          data: selectedFeature?.geometry
            ? [{...selectedFeature, geometry: selectedFeature.geometry}]
            : [],
          getFillColor: [238, 151, 33, 160],
          getLineColor: [172, 85, 0, 255],
          getPointRadius: 9,
          pointRadiusUnits: 'pixels',
          stroked: true,
          lineWidthMinPixels: 3,
          getLineWidth: 2
        })
      ]
    });
  }

  /** Handles clicks on cluster markers and original features. */
  function handleMarkerClick({object}: PickingInfo<ClusterNode>): void {
    if (!object) return;
    if (object.isCluster) {
      selectedCluster = object;
      selectedRow = null;
      memberOffset = 0;
      const expansionZoom = source.index.getExpansionZoom(object.id);
      map.flyTo({
        center: object.position as [number, number],
        zoom: Math.max(map.getZoom() + 1, expansionZoom),
        duration: 700
      });
    } else if (object.rowIndex !== null) {
      selectedCluster = null;
      selectMember(object.rowIndex);
    }
    renderPanels();
    updateLayers();
  }

  /** Selects a source row and reveals its original geometry at close range. */
  function selectMember(rowIndex: number): void {
    selectedRow = rowIndex;
    const position = getRepresentativePoint(source.getFeature(rowIndex).geometry, 'centroid')!;
    map.flyTo({
      center: [position[0], position[1]],
      zoom: Math.max(map.getZoom(), 17),
      duration: 700
    });
  }

  /** Renders current cluster members and selected feature with safe text nodes. */
  function renderPanels(): void {
    const dynamicElement = panelRoot?.querySelector<HTMLElement>('.clustering-dynamic');
    if (!dynamicElement) return;
    dynamicElement.replaceChildren();
    if (selectedCluster) {
      const membersPanel = document.createElement('section');
      membersPanel.className = 'clustering-members';
      membersPanel.setAttribute('aria-label', 'Cluster members');
      const heading = document.createElement('h2');
      heading.textContent = `${selectedCluster.pointCount.toLocaleString()} members`;
      const total = document.createElement('p');
      total.append('Total sample capacity: ');
      const capacity = document.createElement('strong');
      capacity.textContent = selectedCluster.properties.capacity.toLocaleString();
      total.append(capacity);
      const list = document.createElement('ul');
      const memberRows = source.index.getLeaves(selectedCluster.id, {
        limit: MEMBER_PAGE_SIZE,
        offset: memberOffset
      });
      for (const rowIndex of memberRows) {
        const feature = source.getFeature(rowIndex);
        const item = document.createElement('li');
        const button = document.createElement('button');
        button.type = 'button';
        button.setAttribute('aria-pressed', String(selectedRow === rowIndex));
        button.append(String(feature.properties?.name));
        const neighborhood = document.createElement('small');
        neighborhood.textContent = String(feature.properties?.neighborhood);
        button.append(neighborhood);
        button.addEventListener('click', () => {
          selectMember(rowIndex);
          renderPanels();
          updateLayers();
        });
        item.append(button);
        list.append(item);
      }
      const pagination = document.createElement('div');
      pagination.className = 'clustering-pagination';
      const previous = document.createElement('button');
      previous.type = 'button';
      previous.textContent = 'Previous';
      previous.disabled = memberOffset === 0;
      previous.addEventListener('click', () => {
        memberOffset -= MEMBER_PAGE_SIZE;
        renderPanels();
      });
      const range = document.createElement('span');
      range.textContent = `${memberOffset + 1}–${Math.min(memberOffset + MEMBER_PAGE_SIZE, selectedCluster.pointCount)} of ${selectedCluster.pointCount}`;
      const next = document.createElement('button');
      next.type = 'button';
      next.textContent = 'Next';
      next.disabled = memberOffset + MEMBER_PAGE_SIZE >= selectedCluster.pointCount;
      next.addEventListener('click', () => {
        memberOffset += MEMBER_PAGE_SIZE;
        renderPanels();
      });
      pagination.append(previous, range, next);
      membersPanel.append(heading, total, list, pagination);
      dynamicElement.append(membersPanel);
    }

    const selectedFeature = selectedRow === null ? null : source.getFeature(selectedRow);
    if (selectedFeature) {
      const selectionPanel = document.createElement('section');
      selectionPanel.className = 'clustering-selection';
      selectionPanel.setAttribute('aria-live', 'polite');
      const heading = document.createElement('h2');
      heading.textContent = String(selectedFeature.properties?.name);
      const details = document.createElement('p');
      details.textContent = `${String(selectedFeature.properties?.neighborhood)} · Capacity ${String(selectedFeature.properties?.capacity)}`;
      const geometry = document.createElement('p');
      geometry.textContent = `Original ${selectedFeature.geometry?.type.toLowerCase()} highlighted in orange.`;
      selectionPanel.append(heading, details, geometry);
      dynamicElement.append(selectionPanel);
    }
  }

  /** Creates native controls inside the community panels host. */
  function renderControls(element: HTMLElement): void {
    element.innerHTML = `
      <div class="clustering-controls">
        <p class="clustering-intro">Zoom to separate nearby sites. Click a count to expand a cluster, then select a member to see its original geometry.</p>
        <p>ClusterSource builds a reusable hierarchy from complete GeoJSON or GeoArrow tables. <a href="/docs/developer-guide/clustering">Read the clustering guide</a>.</p>
        <div class="clustering-total"><strong>1,600</strong> generated sample sites</div>
        <label for="cluster-radius">Cluster radius <output>50 px</output></label>
        <input id="cluster-radius" type="range" min="20" max="100" step="5" value="50" />
        <label for="cluster-geometry">Input geometry</label>
        <select id="cluster-geometry">
          <option value="points">Points</option>
          <option value="polygons">Polygon centroids</option>
        </select>
        <p class="clustering-hint">Every site contributes one point. Blue markers show member counts.</p>
        <button type="button" class="clustering-reset">Reset view</button>
        <div class="clustering-dynamic"></div>
        <div class="clustering-legend">
          <span><i class="clustering-blue"></i> Cluster</span>
          <span><i class="clustering-green"></i> Site</span>
          <span><i class="clustering-orange"></i> Selected</span>
        </div>
        <p class="clustering-credit">Synthetic data for demonstration; these are not real places or building footprints.</p>
      </div>
    `;
    radiusInput = element.querySelector<HTMLInputElement>('#cluster-radius');
    radiusOutput = element.querySelector<HTMLOutputElement>('output');
    geometrySelect = element.querySelector<HTMLSelectElement>('#cluster-geometry');
    hint = element.querySelector<HTMLElement>('.clustering-hint');
    radiusInput?.addEventListener('input', handleRadiusInput);
    geometrySelect?.addEventListener('change', handleGeometryChange);
    element.querySelector<HTMLButtonElement>('.clustering-reset')?.addEventListener('click', handleResetView);
    renderPanels();
  }

  /** Updates the camera zoom indicator. */
  function updateZoomLabel(): void {
    zoomLabel.textContent = `Zoom ${map.getZoom().toFixed(1)}`;
  }
}
