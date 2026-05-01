// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type * as arrow from 'apache-arrow';
import {
  CompositeLayer,
  type CompositeLayerProps,
  type DefaultProps,
  type Layer
} from '@deck.gl/core';
import {PointCloudLayer, type PointCloudLayerProps} from '@deck.gl/layers';
import {getDeckBinaryDataFromArrowMesh} from '@loaders.gl/geoarrow';
import type {MeshArrowTable} from '@loaders.gl/schema';

/** Props for {@link MeshArrowPointCloudLayer}. */
export type MeshArrowPointCloudLayerProps = CompositeLayerProps & {
  /** loaders.gl Mesh Arrow table wrapper or raw Apache Arrow table. */
  data: MeshArrowTable | arrow.Table;
  /** Optional props forwarded to deck.gl's PointCloudLayer. */
  pointCloudLayerProps?: Partial<PointCloudLayerProps>;
};

const defaultProps: DefaultProps<MeshArrowPointCloudLayerProps> = {
  id: 'mesh-arrow-point-cloud-layer',
  pointCloudLayerProps: {type: 'object', compare: false, value: {}}
};

/**
 * Internal deck.gl layer that renders loaders.gl Mesh Arrow point clouds through binary attributes.
 */
export class MeshArrowPointCloudLayer extends CompositeLayer<MeshArrowPointCloudLayerProps> {
  /** deck.gl layer name used in debugging output. */
  static layerName = 'MeshArrowPointCloudLayer';

  /** Default props shared across Mesh Arrow point cloud layers. */
  static defaultProps: DefaultProps = defaultProps;

  /** Renders the Mesh Arrow table as a point cloud. */
  renderLayers(): Layer | null {
    const arrowTable = getArrowTable(this.props.data);
    const pointCloudData = getDeckBinaryDataFromArrowMesh(arrowTable);

    return new PointCloudLayer({
      ...this.getSubLayerProps({id: 'points'}),
      ...this.props.pointCloudLayerProps,
      data: pointCloudData,
      updateTriggers: this.props.pointCloudLayerProps?.updateTriggers
    }) as unknown as Layer;
  }
}

function getArrowTable(data: MeshArrowTable | arrow.Table): arrow.Table {
  return isMeshArrowTable(data) ? data.data : (data as arrow.Table);
}

/** Checks whether layer data is a loaders.gl Arrow table wrapper. */
function isMeshArrowTable(data: MeshArrowTable | arrow.Table): data is MeshArrowTable {
  return (data as MeshArrowTable).shape === 'arrow-table';
}
