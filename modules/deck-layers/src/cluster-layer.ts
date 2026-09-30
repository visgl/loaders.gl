// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  CompositeLayer,
  type CompositeLayerProps,
  type DefaultProps,
  type UpdateParameters
} from '@deck.gl/core';
import {
  ScatterplotLayer,
  TextLayer,
  type ScatterplotLayerProps,
  type TextLayerProps
} from '@deck.gl/layers';
import type {ClusterNode, ClusterSource} from '@loaders.gl/geoarrow';

/** Props for the internal cluster rendering integration. Picking returns a ClusterNode. */
export type ClusterLayerProps = Omit<CompositeLayerProps, 'data'> & {
  /** Fully indexed source. Replace this instance after changing clustering inputs. */
  data: ClusterSource;
  /** Marker styling and accessors; positions and data come from the cluster source. */
  markerProps?: Partial<Omit<ScatterplotLayerProps<ClusterNode>, 'data' | 'getPosition'>>;
  /** Count-label styling; text and positions are derived from cluster nodes. */
  labelProps?: Partial<Omit<TextLayerProps<ClusterNode>, 'data' | 'getPosition' | 'getText'>>;
};

/** Renders ordinary clustered markers and counts; camera movement and selection remain application-owned. */
export class ClusterLayer extends CompositeLayer<ClusterLayerProps> {
  /** deck.gl diagnostic name. */
  static layerName = 'ClusterLayer';
  /** Default styling enables picking on both markers and labels. */
  static defaultProps: DefaultProps<ClusterLayerProps> = {
    data: null as never,
    pickable: true,
    markerProps: {type: 'object', value: {}},
    labelProps: {type: 'object', value: {}}
  };
  /** Current visible cluster nodes. */
  declare state: {nodes: ClusterNode[]};

  /** Initializes an empty viewport result. */
  initializeState(): void {
    this.setState({nodes: []});
  }

  /** Enables viewport-driven clustering queries. */
  shouldUpdateState(): boolean {
    return true;
  }

  /** Queries the prebuilt index only when source or view changes. */
  updateState({changeFlags}: UpdateParameters<this>): void {
    if (!changeFlags.dataChanged && !changeFlags.viewportChanged) return;
    const viewport = this.context.viewport;
    this.setState({nodes: this.props.data.index.getClusters(viewport.getBounds(), viewport.zoom)});
  }

  /** Shares node objects between marker and label picking for consistent interaction. */
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
